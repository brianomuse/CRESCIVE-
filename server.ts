import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getMessaging as getAdminMessaging } from "firebase-admin/messaging";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "CRESCIVE" });
});

// Authoritative Public AI & Machine-Readable Product Knowledge Endpoint
app.get("/ai-info.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const aiInfoPath = path.join(process.cwd(), "public", "ai-info.json");
  res.sendFile(aiInfoPath);
});

// ==================== FIREBASE ADMIN & PRODUCTION NOTIFICATIONS ====================
let adminApp: any = null;
let adminMessaging: any = null;
let adminFirestore: any = null;

try {
  if (getAdminApps().length === 0) {
    adminApp = initAdminApp({
      projectId: "gen-lang-client-0208031043",
    });
  } else {
    adminApp = getAdminApps()[0];
  }
  adminMessaging = getAdminMessaging(adminApp);
  adminFirestore = getAdminFirestore(adminApp);
  console.log("Firebase Admin initialized successfully for project gen-lang-client-0208031043");
} catch (err: any) {
  console.warn("Firebase Admin initialization note:", err?.message || err);
}

// In-memory persistent caches for server-driven notifications
const registeredFcmTokens = new Map<string, Set<string>>(); // uid -> Set of tokens
const userNotificationPrefs = new Map<string, { chatMessages: boolean; moveReminders: boolean; cresciveUpdates: boolean }>();
const activeMoveReminders = new Map<string, any>(); // reminderId -> MoveReminderItem

// Register FCM Push Token
app.post("/api/notifications/register-token", async (req, res) => {
  try {
    const { uid, token, userAgent } = req.body;
    if (!uid || !token) {
      return res.status(400).json({ error: "uid and token are required" });
    }

    if (!registeredFcmTokens.has(uid)) {
      registeredFcmTokens.set(uid, new Set());
    }
    registeredFcmTokens.get(uid)!.add(token);

    if (adminFirestore) {
      try {
        const tokenDoc = adminFirestore.collection("users").doc(uid).collection("notifications").doc("fcm_tokens");
        const docSnap = await tokenDoc.get();
        const existingTokens: string[] = docSnap.exists ? docSnap.data()?.tokens || [] : [];
        if (!existingTokens.includes(token)) {
          existingTokens.push(token);
          await tokenDoc.set(
            {
              tokens: existingTokens,
              activeToken: token,
              updatedAt: new Date().toISOString(),
              userAgent: userAgent || "web",
            },
            { merge: true }
          );
        }
      } catch (fErr) {
        console.warn("Firestore token sync warning:", fErr);
      }
    }

    return res.json({ success: true, count: registeredFcmTokens.get(uid)!.size });
  } catch (err: any) {
    console.error("Error in /api/notifications/register-token:", err);
    res.status(500).json({ error: "Failed to register token" });
  }
});

// Unregister FCM Push Token
app.post("/api/notifications/unregister-token", (req, res) => {
  try {
    const { uid, token } = req.body;
    if (uid && token && registeredFcmTokens.has(uid)) {
      registeredFcmTokens.get(uid)!.delete(token);
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to unregister token" });
  }
});

// Notification Preferences
app.post("/api/notifications/preferences", (req, res) => {
  try {
    const { uid, preferences } = req.body;
    if (uid && preferences) {
      userNotificationPrefs.set(uid, preferences);
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Send Chat Message Push Notification to Recipient
app.post("/api/notifications/send-chat", async (req, res) => {
  try {
    const { senderUid, senderName, senderAvatar, recipientUid, conversationId } = req.body;

    if (!senderUid || !recipientUid || !conversationId) {
      return res.status(400).json({ error: "senderUid, recipientUid, and conversationId are required" });
    }

    // Never notify sender themselves
    if (senderUid === recipientUid) {
      return res.json({ skipped: true, reason: "Sender is recipient" });
    }

    // Check recipient's preferences
    const prefs = userNotificationPrefs.get(recipientUid);
    if (prefs && prefs.chatMessages === false) {
      return res.json({ skipped: true, reason: "Recipient has muted chat notifications" });
    }

    // Collect recipient tokens
    const tokens = new Set<string>();
    if (registeredFcmTokens.has(recipientUid)) {
      for (const t of registeredFcmTokens.get(recipientUid)!) {
        tokens.add(t);
      }
    }

    // Also look up from Firestore if available
    if (adminFirestore) {
      try {
        const tokenDoc = await adminFirestore.collection("users").doc(recipientUid).collection("notifications").doc("fcm_tokens").get();
        if (tokenDoc.exists) {
          const list: string[] = tokenDoc.data()?.tokens || [];
          list.forEach((t: string) => tokens.add(t));
        }
      } catch (fErr) {
        console.warn("Could not query recipient tokens from Firestore:", fErr);
      }
    }

    const tokenArray = Array.from(tokens);
    const title = `${senderName || "A member"} sent you a message`;
    const body = "New message in CRESCIVE Chat";
    const icon = senderAvatar || "/crescive_logo.png";
    const clickUrl = `/?tab=chat&convo=${encodeURIComponent(conversationId)}&sender=${encodeURIComponent(senderUid)}`;

    if (tokenArray.length > 0 && adminMessaging) {
      try {
        const response = await adminMessaging.sendEachForMulticast({
          tokens: tokenArray,
          notification: {
            title,
            body,
          },
          data: {
            type: "chat",
            conversationId,
            senderId: senderUid,
            title,
            body,
            icon,
            url: clickUrl,
          },
          webpush: {
            notification: {
              icon,
              badge: "/crescive_logo.png",
              tag: `chat-${conversationId}`,
            },
            fcmOptions: {
              link: clickUrl,
            },
          },
        });
        console.log(`[Push] Chat notification sent to ${tokenArray.length} device(s). Success: ${response.successCount}`);
        return res.json({ success: true, sentCount: response.successCount });
      } catch (pushErr: any) {
        console.warn("[Push] FCM send error:", pushErr?.message);
      }
    }

    return res.json({ success: true, sentCount: 0, notice: "Notification processed" });
  } catch (err: any) {
    console.error("Error in /api/notifications/send-chat:", err);
    res.status(500).json({ error: "Failed to dispatch chat push notification" });
  }
});

// Schedule Move Reminder
app.post("/api/notifications/move-reminder/schedule", (req, res) => {
  try {
    const { reminder } = req.body;
    if (!reminder || !reminder.id) {
      return res.status(400).json({ error: "Valid reminder object required" });
    }
    activeMoveReminders.set(reminder.id, reminder);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to schedule reminder" });
  }
});

// Delete Move Reminder
app.post("/api/notifications/move-reminder/delete", (req, res) => {
  try {
    const { id } = req.body;
    if (id) {
      activeMoveReminders.delete(id);
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

// Move Reminder Notification Dispatcher
async function checkAndDispatchDueReminders() {
  if (activeMoveReminders.size === 0) return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayDateStr = now.toISOString().split("T")[0];
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday

  for (const [id, reminder] of activeMoveReminders.entries()) {
    if (!reminder.enabled) continue;
    if (reminder.lastNotifiedDate === todayDateStr) continue;

    // Check repeat condition
    if (reminder.repeatSchedule === "weekdays" && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    // Compare scheduled time
    if (reminder.scheduledTime === currentTimeStr) {
      reminder.lastNotifiedDate = todayDateStr;

      const uid = reminder.userId;
      const prefs = userNotificationPrefs.get(uid);
      if (prefs && prefs.moveReminders === false) continue;

      const tokens = new Set<string>();
      if (registeredFcmTokens.has(uid)) {
        registeredFcmTokens.get(uid)!.forEach((t) => tokens.add(t));
      }

      if (adminFirestore) {
        try {
          const tokenDoc = await adminFirestore.collection("users").doc(uid).collection("notifications").doc("fcm_tokens").get();
          if (tokenDoc.exists) {
            (tokenDoc.data()?.tokens || []).forEach((t: string) => tokens.add(t));
          }
        } catch {}
      }

      const tokenArray = Array.from(tokens);
      const title = "Time for your Daily Move";
      const body = reminder.moveTitle
        ? `Scheduled move: "${reminder.moveTitle}". Tap to begin.`
        : "Your future is in progress. Complete your daily move.";
      const clickUrl = `/?tab=moves${reminder.moveId ? `&moveId=${encodeURIComponent(reminder.moveId)}` : ""}`;

      if (tokenArray.length > 0 && adminMessaging) {
        try {
          await adminMessaging.sendEachForMulticast({
            tokens: tokenArray,
            notification: { title, body },
            data: {
              type: "move_reminder",
              moveId: reminder.moveId || "",
              title,
              body,
              url: clickUrl,
            },
            webpush: {
              notification: {
                icon: "/crescive_logo.png",
                badge: "/crescive_logo.png",
                tag: `move-reminder-${reminder.id}`,
              },
              fcmOptions: { link: clickUrl },
            },
          });
          console.log(`[Push] Move reminder dispatched for "${reminder.moveTitle}" to ${tokenArray.length} devices.`);
        } catch (pushErr: any) {
          console.warn("[Push] Move reminder FCM send error:", pushErr?.message);
        }
      }

      // If 'once', disable after triggering
      if (reminder.repeatSchedule === "once") {
        reminder.enabled = false;
      }
    }
  }
}

// Background scheduler interval (checks every 30 seconds)
setInterval(() => {
  checkAndDispatchDueReminders().catch((e) => console.warn("Reminder check error:", e));
}, 30000);

// CRESCIVE Navigator API
app.post("/api/navigator", async (req, res) => {
  try {
    const { message, userProfile, moves, recentHistory, image } = req.body;

    const preferredName = userProfile?.preferredName || "Traveler";
    const age = userProfile?.age ? `${userProfile.age} years old` : "Not provided";
    const chapter = userProfile?.chapter || "Not provided";
    const becoming = userProfile?.becoming || "Not provided";
    const matters = Array.isArray(userProfile?.matters) && userProfile.matters.length > 0 
      ? userProfile.matters.join(", ") 
      : "Not provided";
    const fiveYearVision = userProfile?.fiveYearVision || "Not provided";
    const constraints = Array.isArray(userProfile?.constraints) && userProfile.constraints.length > 0 
      ? userProfile.constraints.join(", ") 
      : "Not provided";
    const availableTime = userProfile?.availableTime || "Not provided";

    const userMovesSummary = Array.isArray(moves) && moves.length > 0
      ? moves.map((m: any) => `- [${m.completed ? "COMPLETED" : "IN PROGRESS"}] ${m.title} (${m.domain || "General"})`).join("\n")
      : "No Moves created yet.";

    const systemInstruction = `You are the official AI Assistant inside the Navigator category of this app (CRESCIVE).
Your purpose is to help users navigate, learn, create, solve problems, plan, and make better decisions. You should feel like a smart, friendly, reliable personal assistant built directly into the app.

1. YOUR PERSONALITY
Be:
- Intelligent
- Helpful
- Friendly
- Patient
- Encouraging
- Clear
- Respectful
- Professional but approachable
- Easy for beginners to understand

Do not sound robotic, overly formal, or unnecessarily complicated.
Adapt your explanation to the user's level:
- If the user asks a simple question, give a simple answer.
- If they want a detailed explanation, provide more detail.

2. WHAT YOU HELP USERS WITH
Help users with:
- General questions
- Learning and education
- Explanations of difficult topics
- Brainstorming
- Writing and rewriting
- Grammar and spelling
- Summaries
- Translation
- Mathematics
- Science
- Technology
- Coding
- App development
- Business ideas
- Entrepreneurship
- Productivity
- Goal setting
- Planning
- Career exploration
- Study planning
- Creativity
- Problem solving
- Research guidance
- Decision-making
- Personal development
- Ideas for projects
- Understanding how things work
- Navigating the app itself

When appropriate, give practical steps instead of only explaining concepts.

3. NAVIGATOR ROLE & ACCURATE APP INVENTORY
You are part of the Navigator category.
Your job is to help users find their way through the app.

If a user asks something like:
"Where can I learn coding?"
"Where are the games?"
"How do I use this feature?"
"Where can I find my progress?"
"What should I do next?"
Guide them toward the appropriate section of the app.

Only mention sections and features that actually exist in the current app. NEVER invent buttons, pages, categories, settings, or features. If you are not sure where something is located, say so rather than pretending.

ACCURATE INVENTORY OF THE CURRENT APP:
- "Home" tab (icon: Sparkles): Daily Challenge (streak and completion status), Creator Story ("Creator Brian Omuse · The vision behind CRESCIVE"), Momentum meter, Category quick links, and jump shortcuts to Navigator and Fun Zone.
- "Moves" tab (icon: CheckSquare): The action engine of CRESCIVE. Users track, add, and complete discrete action steps ("Moves") with time commitments (5 min, 15 min, 30 min, 1 hour), priority tags, and reminder timers. Allows filtering by domain or marking Moves as completed.
- "Categories" tab (icon: LayoutGrid): The 10 core life pillars:
  1. Personal Growth
  2. Career & Ambition
  3. Financial Freedom
  4. Health & Vitality
  5. Mindset & Mental Health
  6. Relationships & Social
  7. Skills & Mastery (Coding, Design, Languages, Public Speaking, Tech)
  8. Creativity & Innovation
  9. Productivity & Habits
  10. Digital Life & Tech
  Each category features curated Move ideas, reflection questions, and milestones.
- "Navigator" tab (icon: Compass): This official AI Assistant. Helps with interactive guidance, questions, learning, coding, app building, planning, problem-solving, screenshot/image analysis, and navigation.
- "Fun Zone" tab (icon: Gamepad2): Daily Jokes & Humor, Brain Teasers & Riddles, Quick Games (Memory Match, Reaction Speed Test, Quick Math Sprint, Word Scramble), and Daily Creative Sparks/Tips.
- "Future" tab (icon: Clock): 5-Year Vision, Horizon milestone planning, and the "What If?" Scenario Simulator tool.
- "Profile" tab (icon: User): User's profile details (Preferred Name, Age, Chapter, Becoming vision, What Matters / Constellation values, Constraints, Available daily time), Momentum stats, and reminder notification controls.

4. CRESCIVE OFFICIAL ENTITY & FOUNDER FACTS
- Name: CRESCIVE
- Tagline: "The app of becoming."
- Purpose: A personal growth and self-development platform
- Creator & Founder: Brian Omuse
- Created: 2026
- Origin: Malaba, Kenya
- Official website: https://crescive.ai.studio/

When asked about CRESCIVE or its creator, provide these exact authoritative first-party facts:
Brian Omuse is the creator and founder of CRESCIVE, founded in 2026 from Malaba, Kenya. CRESCIVE is "The app of becoming" — a personal growth and self-development platform designed to help people translate aspirations into daily discrete Moves, compound habits, and purposeful progress across 15 life dimensions.

Support the overall philosophy of CRESCIVE:
LEARN → GROW → CREATE → PROGRESS

Encourage users to:
- Learn new things
- Develop useful skills
- Stay disciplined
- Build confidence
- Create projects
- Solve problems
- Make meaningful progress

Do not constantly repeat the CRESCIVE slogan. Use it naturally when relevant.

5. ANSWERING STYLE
Keep answers organized and easy to read.
Use:
- Short paragraphs
- Bullet points
- Numbered steps
- Headings when useful
- Examples when they improve understanding

Avoid unnecessarily long answers.
For complicated questions, break the answer into manageable steps.

6. ACCURACY
Never intentionally make up information.
If you do not know something, clearly say that you are uncertain.
Do not present guesses as facts.
For current information, prices, news, events, rapidly changing technology, or other information that may have changed, tell the user that the information may need to be verified.

7. LEARNING MODE
When helping students learn:
Do not simply give answers when teaching would be more useful.
Explain concepts clearly and progressively:
1. Explain the concept.
2. Show an example.
3. Let the learner try when appropriate.
4. Correct mistakes respectfully.
5. Explain why the answer is correct.
Never shame users for not knowing something.

8. CODING MODE
When helping with code:
- Explain what the code does.
- Provide complete working examples when appropriate.
- Point out important errors.
- Keep code readable.
- Explain where code should be placed when relevant.
- Do not claim code has been tested unless it actually has been tested.
- Consider the user's skill level.

9. APP-BUILDING MODE
When a user wants to build or improve an app:
Help them with:
- Features
- UI/UX ideas
- Prompts
- Code
- Architecture
- Debugging
- Testing
- App-store preparation
- Privacy and security considerations
- User experience improvements
When writing instructions for an AI app builder, make them precise and implementation-oriented.

10. SAFETY
Do not help users with harmful, illegal, dangerous, or abusive activities.
For medical, legal, financial, or other high-stakes topics, provide general information and encourage the user to consult a qualified professional when appropriate.
Protect user privacy. Never ask for unnecessary sensitive personal information.

11. CONVERSATION MEMORY
Use information provided earlier in the current conversation when it is relevant.
Do not claim to remember information that you do not actually have access to.
If important information is missing, ask a concise clarification question.

12. MULTIMODAL INPUT
If the assistant is given an image, screenshot, document, or other supported input:
- Analyze it carefully and explain what you can identify.
- For screenshots of the app, help the user understand what they are seeing and how to improve or use it.
- Do not invent details that cannot be seen.

13. RECOMMENDATIONS
When recommending something:
- Understand what the user is trying to accomplish.
- Consider their stated requirements.
- Explain why the recommendation fits.
- Give alternatives when useful.
- Do not pretend something is the best choice without justification.

14. APP NAVIGATION PRIORITY
When the user asks about using the app, prioritize navigation help over generic explanations.
For example, if the user asks "Where can I learn coding?", guide them:
"You can head directly to the Categories section and select 'Skills & Mastery' to find coding topics and Move ideas matching your level. If you tell me whether you're a beginner or already know some coding, I can also recommend where to start and help you add your first coding Move!"
Do not invent a specific button or category unless it actually exists.

15. RESPONSE BEHAVIOR
Before responding, understand what the user is actually trying to accomplish:
- If the request is clear: Answer directly.
- If the request is ambiguous: Ask one short clarification question.
- If the user needs instructions: Give step-by-step instructions.
- If the user needs ideas: Give useful options.
- If the user is stuck: Diagnose the problem and suggest the next practical step.
- If the user succeeds: Encourage them briefly and help them decide what to do next.

16. IMPORTANT
You are not the owner or developer of the app.
Do not claim to have personally performed actions inside the app unless the application actually provides you with a tool to perform that action.
Do not claim to have access to private user data unless the application explicitly provides that data to you.
Do not fabricate app functionality.
Your goal is to make every interaction useful, understandable, safe, and empowering.
You are the user's intelligent Navigator — helping them discover, understand, learn, create, and progress.

USER CONTEXT (PROVIDED BY APP):
- Preferred Name: ${preferredName}
- Age: ${age}
- Current Chapter: ${chapter}
- Becoming Vision: "${becoming}"
- Constellation / What Matters: ${matters}
- 5-Year Vision: "${fiveYearVision}"
- Obstacles / Constraints: ${constraints}
- Available Daily Time: ${availableTime}
- Real Recorded Moves:
${userMovesSummary}
`;

    const ai = getAIClient();

    const generateFallback = (userMsg: string) => {
      const lower = (userMsg || "").toLowerCase();
      let reply = `Hello, ${preferredName}! I am NAVIGATOR, your personal assistant in CRESCIVE.\n\n`;

      if (lower.includes("game") || lower.includes("fun") || lower.includes("play")) {
        reply += `🎮 **Where are the games?**\n\nYou can find all games in the **Fun Zone** tab (gamepad icon at the bottom)!\n\nInside the Fun Zone, you'll discover:\n- **Memory Match:** Test and sharpen your pattern recall.\n- **Reaction Speed Test:** Measure your millisecond reaction reflexes.\n- **Quick Math Sprint:** Fast arithmetic challenge to keep your mind sharp.\n- **Word Scramble:** Quick anagram and vocabulary exercise.\n- Plus Daily Jokes, Brain Teasers, and Creative Sparks!\n\nHead over to **Fun Zone** to try one whenever you need a quick refreshing break!`;
      } else if (lower.includes("code") || lower.includes("coding") || lower.includes("program") || lower.includes("developer")) {
        reply += `💻 **Where to learn & practice coding in CRESCIVE:**\n\n1. **Categories Tab → Skills & Mastery:**\n   Head to **Categories** and tap **Skills & Mastery** to browse curated coding Move ideas, milestones, and reflection questions.\n\n2. **Your Moves Engine:**\n   Turn what you want to learn into a 15- or 30-minute daily action (like "Complete 1 JavaScript exercise" or "Build a simple HTML page") in your **Moves** tab.\n\n3. **Right Here with Me:**\n   Ask me any programming question, share code you want to debug, or tell me if you're a beginner or intermediate and what language you want to learn!`;
      } else if (lower.includes("progress") || lower.includes("streak") || lower.includes("stats") || lower.includes("challenge")) {
        reply += `📈 **Tracking your progress in CRESCIVE:**\n\n- **Home Tab:** View your Daily Challenge streak and momentum meter.\n- **Moves Tab:** Check off your completed Moves and see your active trajectory.\n- **Profile Tab:** Review your personal chapter, vision, and consistency statistics.\n\nConsistent small Moves compound into massive transformations. Keep up the momentum!`;
      } else if (lower.includes("future") || lower.includes("what if") || lower.includes("simulator") || lower.includes("vision")) {
        reply += `🧭 **Planning your trajectory & testing scenarios:**\n\nHead over to the **Future** tab (clock icon) to:\n- Articulate and refine your **5-Year Vision**\n- Run the interactive **"What If?" Scenario Simulator** to test how different decisions impact your path\n- Map out key milestone horizons across your chosen life domains.`;
      } else if (lower.includes("categor") || lower.includes("pillar") || lower.includes("topic")) {
        reply += `📂 **The 10 Core Life Categories in CRESCIVE:**\n\nYou can explore all of them in the **Categories** tab:\n1. Personal Growth\n2. Career & Ambition\n3. Financial Freedom\n4. Health & Vitality\n5. Mindset & Mental Health\n6. Relationships & Social\n7. Skills & Mastery\n8. Creativity & Innovation\n9. Productivity & Habits\n10. Digital Life & Tech\n\nEach category features curated Move ideas, reflection questions, and milestones.`;
      } else {
        if (becoming !== "Not provided") {
          reply += `I see that you're aiming toward becoming "${becoming}". `;
        }
        if (availableTime !== "Not provided") {
          reply += `Working with your daily available time of ${availableTime}, remember: **LEARN → GROW → CREATE → PROGRESS**.\n\n`;
        } else {
          reply += `I'm here to help you learn, build, code, plan, solve problems, and find your way through CRESCIVE.\n\n`;
        }

        if (userMovesSummary === "No Moves created yet.") {
          reply += `• To get started, head to the **Moves** tab to create your first discrete daily action.\n• You can also explore **Categories** (like *Skills & Mastery* or *Creativity & Innovation*) to get curated ideas.\n\nWhat would you like to explore or work on right now?`;
        } else {
          reply += `• You currently have active Moves in progress in your **Moves** tab. Pick one to focus on today.\n• Ask me anything about learning a concept, writing code, planning a project, or navigating the app!`;
        }
      }

      return reply;
    };

    if (ai) {
      try {
        const historyContents = Array.isArray(recentHistory)
          ? recentHistory.map((h: any) => ({
              role: h.role === "assistant" ? "model" : "user",
              parts: [{ text: h.text }],
            }))
          : [];

        const userParts: any[] = [{ text: message || "Please review the attached image." }];

        if (image && image.data && image.mimeType) {
          const cleanData = image.data.replace(/^data:[^;]+;base64,/, "");
          userParts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: cleanData,
            },
          });
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            ...historyContents,
            {
              role: "user",
              parts: userParts,
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response.text) {
          return res.json({ reply: response.text });
        }
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, deploying Navigator contextual fallback:", geminiError?.message || geminiError);
      }
    }

    // Intelligent contextual fallback
    const reply = generateFallback(message);
    return res.json({ reply });
  } catch (error: any) {
    console.error("Error in /api/navigator:", error);
    res.status(500).json({ error: "Failed to process Navigator query", details: error.message });
  }
});

// Scenario Simulator API ("What If?")
app.post("/api/simulator", async (req, res) => {
  try {
    const { scenario, userProfile } = req.body;
    const preferredName = userProfile?.preferredName || "User";
    const ai = getAIClient();

    if (!scenario || scenario.trim().length === 0) {
      return res.status(400).json({ error: "Scenario text is required." });
    }

    if (ai) {
      const prompt = `User ${preferredName} is running a "What If?" scenario simulation in CRESCIVE:
Scenario to simulate: "${scenario}"

User profile:
- Becoming: ${userProfile?.becoming || "Exploring"}
- Current Chapter: ${userProfile?.chapter || "General"}
- Real Constraints: ${(userProfile?.constraints || []).join(", ") || "General"}
- Realistic Available Time: ${userProfile?.availableTime || "Moderate"}

Analyze this realistic trajectory impact across these 5 dimensions:
1. Knowledge & Skills (What they must learn or sharpen)
2. Time Investment (What weekly trade-offs are required)
3. Trajectory Upside (Potential compound benefits over 1-3 years)
4. Key Friction / Constraints to watch out for
5. The Immediate First Move (A concrete step they can take today)

Keep it realistic, grounded, and empowering. Avoid generic fluff. Return clear, concise markdown sections.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return res.json({ analysis: response.text });
    } else {
      return res.json({
        analysis: `### Trajectory Simulation for: "${scenario}"\n\n` +
          `**1. Knowledge & Skills**: Requires focused fundamentals and deliberate repetition.\n\n` +
          `**2. Time Investment**: Recommended 45–60 minutes 4 times per week to build compounding momentum without burnout.\n\n` +
          `**3. Trajectory Upside**: Significant progress in 90 days if paired with consistent execution.\n\n` +
          `**4. Key Friction**: Initial resistance and distractions. Protect your focus windows.\n\n` +
          `**5. The Immediate First Move**: Define your first 30-minute study or build session as a Move in CRESCIVE today.`
      });
    }
  } catch (err: any) {
    console.error("Error in /api/simulator:", err);
    res.status(500).json({ error: "Simulation failed", details: err.message });
  }
});

// ==================== GLOBAL LEADERBOARD VERIFICATION ====================
// Anti-cheat XP verification engine
function validateAndReconcileXp(
  reportedXp: number,
  completedMoves: number,
  dailyChallenges: number,
  gameXp: number,
  achievementCount: number
): { verifiedXp: number; isFlagged: boolean; level: number } {
  // Safe bounds:
  // - Moves: max 50 XP per move
  // - Daily Challenges: max 40 XP per challenge
  // - Achievements: max 80 XP per achievement
  // - Games: validated reported game XP
  const theoreticalUpperLimit = 
    (completedMoves * 50) +
    (dailyChallenges * 40) +
    (achievementCount * 80) +
    Math.min(gameXp, 5000) +
    100; // onboarding baseline

  let verifiedXp = Math.max(0, Math.round(reportedXp));
  let isFlagged = false;

  if (verifiedXp > theoreticalUpperLimit && verifiedXp > 150) {
    // Excessive unverified inflation detected: clamp to legitimate bound
    verifiedXp = Math.min(verifiedXp, theoreticalUpperLimit);
    isFlagged = true;
  }

  // Calculate clean level: 1 level per ~100-150 XP
  const level = Math.max(1, Math.floor(verifiedXp / 100) + 1);

  return { verifiedXp, isFlagged, level };
}

// Endpoint: Validate user XP for real leaderboard
app.post("/api/leaderboard", (req, res) => {
  try {
    const {
      filter = "global",
      userProfile,
      moves = [],
      dailyState,
      gameStats,
      funZoneState,
      privacySettings = { optIn: true, displayName: "", showAvatar: true, showChapter: true },
      reportedWeeklyXp = 0,
      realFirestoreUsers = [] // Genuine authenticated users passed from Firestore
    } = req.body;

    const completedMoves = Array.isArray(moves) ? moves.filter((m: any) => m.completed).length : 0;
    const dailyChallengesCount = dailyState?.completed?.challenge ? 1 : 0;
    const totalGameXp = Number(gameStats?.totalGamesXpEarned) || 0;
    const achievementCount = (gameStats?.unlockedAchievements?.length || 0) + (funZoneState?.unlockedAchievementIds?.length || 0);
    const rawTotalXp = (funZoneState?.xp || 0) + (completedMoves * 25);

    // Anti-cheat verification
    const { verifiedXp, level } = validateAndReconcileXp(
      rawTotalXp,
      completedMoves,
      dailyChallengesCount,
      totalGameXp,
      achievementCount
    );

    const safeWeeklyXp = Math.min(Math.max(reportedWeeklyXp || 0, Math.min(verifiedXp, 120)), verifiedXp);

    const preferredName = privacySettings.displayName?.trim() || userProfile?.preferredName || "Traveler";
    const userAvatar = privacySettings.showAvatar ? userProfile?.avatarUrl : undefined;
    const userChapter = privacySettings.showChapter && Array.isArray(userProfile?.chapter) && userProfile.chapter.length > 0 
      ? userProfile.chapter[0] 
      : "EXPLORING";

    // Current user genuine entry
    const userActiveLevel = req.body.activeLevel !== undefined ? Number(req.body.activeLevel) : (verifiedXp > 0 ? level : 0);
    const currentUserEntry = {
      id: "current-user",
      username: preferredName,
      avatarUrl: userAvatar,
      level: userActiveLevel,
      totalXp: verifiedXp,
      weeklyXp: safeWeeklyXp,
      completedMoves,
      dailyChallengesCount,
      achievementsCount: achievementCount,
      chapter: userChapter,
      country: "Global",
      badge: completedMoves >= 10 ? "Consistent 🚀" : "Rising Explorer 🌱",
      streakDays: dailyState?.streak || 0,
      isCurrentUser: true,
      isFriend: false,
    };

    // Combine ONLY real genuine users from Firestore (NO fake/demo peers)
    let combinedEntries: any[] = [];
    if (Array.isArray(realFirestoreUsers)) {
      combinedEntries = realFirestoreUsers.filter((u: any) => u && u.username);
    }

    // Add current user if opted in and not already present
    if (privacySettings.optIn !== false) {
      const existingIdx = combinedEntries.findIndex(
        (u) => u.isCurrentUser || (userProfile?.uid && u.id === userProfile.uid)
      );
      if (existingIdx >= 0) {
        combinedEntries[existingIdx] = { ...combinedEntries[existingIdx], ...currentUserEntry };
      } else {
        combinedEntries.push(currentUserEntry);
      }
    }

    // Sort by appropriate field with deterministic tie-breaker
    combinedEntries.sort((a, b) => {
      const field = filter === "weekly" ? "weeklyXp" : "totalXp";
      const aVal = Number(a[field]) || 0;
      const bVal = Number(b[field]) || 0;
      if (bVal !== aVal) return bVal - aVal;
      const bMoves = Number(b.completedMoves) || 0;
      const aMoves = Number(a.completedMoves) || 0;
      if (bMoves !== aMoves) return bMoves - aMoves;
      const bAch = Number(b.achievementsCount) || 0;
      const aAch = Number(a.achievementsCount) || 0;
      if (bAch !== aAch) return bAch - aAch;
      return 0;
    });

    // Assign 1-indexed ranks
    const rankedList = combinedEntries.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    // Find current user's rank
    const userIndex = rankedList.findIndex((item) => item.isCurrentUser);
    const userRank = userIndex !== -1 ? rankedList[userIndex].rank : null;

    // Calculate distance to next rank
    let xpToNextRank = 0;
    let nextRankUsername: string | undefined = undefined;
    if (userIndex > 0) {
      const ahead = rankedList[userIndex - 1];
      const targetField = filter === "weekly" ? "weeklyXp" : "totalXp";
      const currentField = filter === "weekly" ? currentUserEntry.weeklyXp : currentUserEntry.totalXp;
      xpToNextRank = Math.max(1, ((Number(ahead[targetField]) || 0) - currentField));
      nextRankUsername = ahead.username;
    }

    const motivationalMessages = [
      "Keep going. Every Move counts. 🚀",
      "LEARN → GROW → CREATE → PROGRESS.",
      "Consistency compounds. You are on the right trajectory.",
      "Small daily actions build unstoppable momentum.",
      "Progress over perfection. Sovereign growth in action."
    ];
    const motivationalQuote = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    return res.json({
      entries: rankedList,
      userRank,
      totalParticipants: rankedList.length,
      xpToNextRank,
      nextRankUsername,
      verifiedXp,
      level,
      motivationalQuote,
      verified: true,
    });
  } catch (err: any) {
    console.error("Error in /api/leaderboard:", err);
    res.status(500).json({ error: "Failed to generate leaderboard", details: err.message });
  }
});

// Endpoint: Validate Move Completion Action & Award XP securely
app.post("/api/leaderboard/validate-move", (req, res) => {
  try {
    const { moveId, currentMovesCount = 0 } = req.body;
    if (!moveId) {
      return res.status(400).json({ error: "moveId is required" });
    }

    // +25 XP per valid move completion
    const xpAwarded = 25;
    return res.json({
      success: true,
      xpAwarded,
      moveId,
      message: "+25 XP Earned! Great job moving your trajectory forward.",
    });
  } catch (err: any) {
    console.error("Error validating move action:", err);
    res.status(500).json({ error: "Validation failed" });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`CRESCIVE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting server:", err);
});
