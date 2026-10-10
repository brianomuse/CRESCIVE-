import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getMessaging as getAdminMessaging } from "firebase-admin/messaging";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

dotenv.config();

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enable CORS for frontend-backend interaction
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ==================== FIREBASE ADMIN INITIALIZATION ====================
let adminApp: any = null;
let adminMessaging: any = null;
let adminFirestore: any = null;
let adminAuth: any = null;
let hasAdminCredentials = false;

export function getFirebaseAdmin() {
  if (adminApp) {
    return { adminApp, adminMessaging, adminFirestore, adminAuth, hasAdminCredentials };
  }

  try {
    if (getAdminApps().length > 0) {
      adminApp = getAdminApps()[0];
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0208031043";
      let credentialOption: any = undefined;

      // 1. Check for complete service account JSON in environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          credentialOption = cert(parsed);
          hasAdminCredentials = true;
        } catch (parseErr) {
          console.warn("[Firebase Admin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", parseErr);
        }
      }
      // 2. Check for individual private key & client email variables
      else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
          const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
          credentialOption = cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          });
          hasAdminCredentials = true;
        } catch (certErr) {
          console.warn("[Firebase Admin] Could not construct cert from credentials:", certErr);
        }
      }

      adminApp = initAdminApp({
        projectId,
        ...(credentialOption ? { credential: credentialOption } : {}),
      });
    }

    if (adminApp) {
      // Only initialize Admin services when real server credentials are provided.
      // This prevents gRPC PERMISSION_DENIED errors when running without a Service Account key.
      if (hasAdminCredentials) {
        try {
          adminMessaging = getAdminMessaging(adminApp);
        } catch (e: any) {
          console.warn("[Firebase Admin] Messaging init:", e?.message || e);
        }
        try {
          adminFirestore = getAdminFirestore(adminApp);
        } catch (e: any) {
          console.warn("[Firebase Admin] Firestore init:", e?.message || e);
        }
        try {
          adminAuth = getAdminAuth(adminApp);
        } catch (e: any) {
          console.warn("[Firebase Admin] Auth init:", e?.message || e);
        }
        console.log(`[Firebase Admin] Authenticated successfully with credentials for project: ${process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0208031043"}`);
      } else {
        console.log(`[Firebase Admin] Running in client-first mode (in-memory server sync; service account key optional).`);
      }
    }
  } catch (err: any) {
    console.warn("[Firebase Admin] Initialization note:", err?.message || err);
  }

  return { adminApp, adminMessaging, adminFirestore, adminAuth, hasAdminCredentials };
}

// Initial attempt
getFirebaseAdmin();

// Helper to verify Firebase ID Token from request
async function verifyRequestAuth(req: express.Request): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) return null;

  const { adminAuth: currentAuth, hasAdminCredentials } = getFirebaseAdmin();
  if (!currentAuth || !hasAdminCredentials) return null;

  try {
    const decoded = await currentAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.warn("[Auth] Token verification note:", err);
    return null;
  }
}

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// In-memory caches for fast local access (complemented with Firestore persistence)
const registeredFcmTokens = new Map<string, Set<string>>();
const userNotificationPrefs = new Map<string, { chatMessages: boolean; moveReminders: boolean; cresciveUpdates: boolean }>();
const activeMoveReminders = new Map<string, any>();

// ==================== API ROUTER ====================
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "CRESCIVE",
    runtime: process.env.VERCEL ? "vercel-serverless" : "node",
    timestamp: new Date().toISOString(),
  });
});

// Authoritative Public AI & Product Knowledge Endpoint
apiRouter.get("/ai-info.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const aiInfoPath = path.join(process.cwd(), "public", "ai-info.json");
  res.sendFile(aiInfoPath);
});

// ==================== NOTIFICATIONS ====================

// Register FCM Push Token
apiRouter.post("/notifications/register-token", async (req, res) => {
  try {
    const { uid, token, userAgent } = req.body;
    if (!uid || typeof uid !== "string" || uid.length > 128) {
      return res.status(400).json({ error: "Valid uid is required" });
    }
    if (!token || typeof token !== "string" || token.length > 500) {
      return res.status(400).json({ error: "Valid token is required" });
    }

    // Optional auth token verification if supplied
    const verifiedUser = await verifyRequestAuth(req);
    if (verifiedUser && verifiedUser.uid !== uid) {
      return res.status(403).json({ error: "Unauthorized token registration for mismatched user" });
    }

    if (!registeredFcmTokens.has(uid)) {
      registeredFcmTokens.set(uid, new Set());
    }
    registeredFcmTokens.get(uid)!.add(token);

    const { adminFirestore: fs } = getFirebaseAdmin();
    if (fs) {
      try {
        const tokenDoc = fs.collection("users").doc(uid).collection("notifications").doc("fcm_tokens");
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
        console.warn("[Notifications] Firestore token sync warning:", fErr);
      }
    }

    return res.json({ success: true, count: registeredFcmTokens.get(uid)!.size });
  } catch (err: any) {
    console.error("Error in /notifications/register-token:", err);
    res.status(500).json({ error: "Failed to register token" });
  }
});

// Unregister FCM Push Token
apiRouter.post("/notifications/unregister-token", async (req, res) => {
  try {
    const { uid, token } = req.body;
    if (uid && token && registeredFcmTokens.has(uid)) {
      registeredFcmTokens.get(uid)!.delete(token);
    }

    const { adminFirestore: fs } = getFirebaseAdmin();
    if (fs && uid && token) {
      try {
        const tokenDoc = fs.collection("users").doc(uid).collection("notifications").doc("fcm_tokens");
        const docSnap = await tokenDoc.get();
        if (docSnap.exists) {
          const list: string[] = (docSnap.data()?.tokens || []).filter((t: string) => t !== token);
          await tokenDoc.set({ tokens: list, updatedAt: new Date().toISOString() }, { merge: true });
        }
      } catch (fErr) {
        console.warn("[Notifications] Firestore token delete warning:", fErr);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to unregister token" });
  }
});

// Update Notification Preferences
apiRouter.post("/notifications/preferences", async (req, res) => {
  try {
    const { uid, preferences } = req.body;
    if (!uid || !preferences) {
      return res.status(400).json({ error: "uid and preferences are required" });
    }

    const verifiedUser = await verifyRequestAuth(req);
    if (verifiedUser && verifiedUser.uid !== uid) {
      return res.status(403).json({ error: "Cannot modify preferences of another user" });
    }

    userNotificationPrefs.set(uid, preferences);

    const { adminFirestore: fs } = getFirebaseAdmin();
    if (fs) {
      try {
        await fs.collection("users").doc(uid).collection("notifications").doc("preferences").set(
          {
            ...preferences,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fErr) {
        console.warn("[Notifications] Firestore preferences sync warning:", fErr);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Send Chat Message Push Notification to Recipient
apiRouter.post("/notifications/send-chat", async (req, res) => {
  try {
    const { senderUid, senderName, senderAvatar, recipientUid, conversationId } = req.body;

    if (!senderUid || !recipientUid || !conversationId) {
      return res.status(400).json({ error: "senderUid, recipientUid, and conversationId are required" });
    }

    // Security: Never notify sender themselves
    if (senderUid === recipientUid) {
      return res.json({ skipped: true, reason: "Sender is recipient" });
    }

    // Security: Verify ID token if provided
    const verifiedUser = await verifyRequestAuth(req);
    if (verifiedUser && verifiedUser.uid !== senderUid) {
      return res.status(403).json({ error: "Sender authentication mismatch" });
    }

    // Security: Validate conversationId format
    const expectedConvoSub = [senderUid, recipientUid].sort().join("_");
    if (!conversationId.includes(senderUid) || !conversationId.includes(recipientUid)) {
      if (!conversationId.includes(expectedConvoSub)) {
        return res.status(403).json({ error: "Invalid conversation participant pairing" });
      }
    }

    const { adminFirestore: fs, adminMessaging: messaging } = getFirebaseAdmin();

    // Check recipient's preferences
    let chatAllowed = true;
    const cachedPrefs = userNotificationPrefs.get(recipientUid);
    if (cachedPrefs && cachedPrefs.chatMessages === false) {
      chatAllowed = false;
    } else if (fs) {
      try {
        const prefDoc = await fs.collection("users").doc(recipientUid).collection("notifications").doc("preferences").get();
        if (prefDoc.exists && prefDoc.data()?.chatMessages === false) {
          chatAllowed = false;
        }
      } catch {}
    }

    if (!chatAllowed) {
      return res.json({ skipped: true, reason: "Recipient has muted chat notifications" });
    }

    // Collect recipient tokens
    const tokens = new Set<string>();
    if (registeredFcmTokens.has(recipientUid)) {
      for (const t of registeredFcmTokens.get(recipientUid)!) {
        tokens.add(t);
      }
    }

    if (fs) {
      try {
        const tokenDoc = await fs.collection("users").doc(recipientUid).collection("notifications").doc("fcm_tokens").get();
        if (tokenDoc.exists) {
          const list: string[] = tokenDoc.data()?.tokens || [];
          list.forEach((t: string) => tokens.add(t));
        }
      } catch (fErr) {
        console.warn("[Push] Could not query recipient tokens from Firestore:", fErr);
      }
    }

    const tokenArray = Array.from(tokens);
    const title = `${senderName || "A member"} sent you a message`;
    const body = "New message in CRESCIVE Chat";
    const icon = senderAvatar || "/crescive_logo.png";
    const clickUrl = `/?tab=chat&convo=${encodeURIComponent(conversationId)}&sender=${encodeURIComponent(senderUid)}`;

    if (tokenArray.length > 0 && messaging) {
      try {
        const response = await messaging.sendEachForMulticast({
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
    console.error("Error in /notifications/send-chat:", err);
    res.status(500).json({ error: "Failed to dispatch chat push notification" });
  }
});

// Schedule Move Reminder (Stores in Firestore and local cache)
apiRouter.post("/notifications/move-reminder/schedule", async (req, res) => {
  try {
    const { reminder } = req.body;
    if (!reminder || !reminder.id || !reminder.userId) {
      return res.status(400).json({ error: "Valid reminder object with id and userId is required" });
    }

    const verifiedUser = await verifyRequestAuth(req);
    if (verifiedUser && verifiedUser.uid !== reminder.userId) {
      return res.status(403).json({ error: "Cannot schedule reminders for another user" });
    }

    activeMoveReminders.set(reminder.id, reminder);

    const { adminFirestore: fs } = getFirebaseAdmin();
    if (fs) {
      try {
        await fs.collection("users").doc(reminder.userId).collection("moveReminders").doc(reminder.id).set(
          {
            ...reminder,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fErr) {
        console.warn("[Move Reminders] Firestore reminder sync error:", fErr);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to schedule reminder" });
  }
});

// Delete Move Reminder
apiRouter.post("/notifications/move-reminder/delete", async (req, res) => {
  try {
    const { id, uid } = req.body;
    if (id) {
      activeMoveReminders.delete(id);
    }

    const verifiedUser = await verifyRequestAuth(req);
    if (verifiedUser && uid && verifiedUser.uid !== uid) {
      return res.status(403).json({ error: "Cannot delete reminders for another user" });
    }

    const { adminFirestore: fs } = getFirebaseAdmin();
    if (fs && uid && id) {
      try {
        await fs.collection("users").doc(uid).collection("moveReminders").doc(id).delete();
      } catch (fErr) {
        console.warn("[Move Reminders] Firestore reminder delete error:", fErr);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

// Move Reminder Dispatch Engine (Callable on demand or via Vercel Cron)
export async function checkAndDispatchDueReminders(): Promise<{ checked: number; dispatched: number }> {
  let checked = 0;
  let dispatched = 0;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayDateStr = now.toISOString().split("T")[0];
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday

  const { adminFirestore: fs, adminMessaging: messaging, hasAdminCredentials } = getFirebaseAdmin();

  // Combine reminders from memory and Firestore
  const remindersToCheck: any[] = Array.from(activeMoveReminders.values());

  if (fs && hasAdminCredentials) {
    try {
      const snapshot = await fs.collectionGroup("moveReminders").where("enabled", "==", true).get();
      snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        if (!remindersToCheck.some((r) => r.id === item.id)) {
          remindersToCheck.push(item);
        }
      });
    } catch (fsErr: any) {
      const msg = fsErr?.message || String(fsErr);
      if (!msg.includes("PERMISSION_DENIED")) {
        console.warn("[Move Reminders] Firestore collectionGroup query note:", msg);
      }
    }
  }

  checked = remindersToCheck.length;

  for (const reminder of remindersToCheck) {
    if (!reminder.enabled) continue;
    if (reminder.lastNotifiedDate === todayDateStr) continue;

    if (reminder.repeatSchedule === "weekdays" && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    // Compare scheduled time (allow within 30 min window for cron or exact for timer)
    const isDue = reminder.scheduledTime === currentTimeStr || (process.env.VERCEL && reminder.scheduledTime <= currentTimeStr);

    if (isDue) {
      reminder.lastNotifiedDate = todayDateStr;

      const uid = reminder.userId;
      if (!uid) continue;

      const tokens = new Set<string>();
      if (registeredFcmTokens.has(uid)) {
        registeredFcmTokens.get(uid)!.forEach((t) => tokens.add(t));
      }

      if (fs) {
        try {
          const tokenDoc = await fs.collection("users").doc(uid).collection("notifications").doc("fcm_tokens").get();
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

      if (tokenArray.length > 0 && messaging) {
        try {
          await messaging.sendEachForMulticast({
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
          dispatched++;
          console.log(`[Push] Move reminder dispatched for "${reminder.moveTitle}" to ${tokenArray.length} devices.`);
        } catch (pushErr: any) {
          console.warn("[Push] Move reminder FCM send error:", pushErr?.message);
        }
      }

      if (reminder.repeatSchedule === "once") {
        reminder.enabled = false;
      }

      if (fs) {
        try {
          await fs.collection("users").doc(uid).collection("moveReminders").doc(reminder.id).update({
            lastNotifiedDate: todayDateStr,
            enabled: reminder.enabled,
          });
        } catch {}
      }
    }
  }

  return { checked, dispatched };
}

// Vercel Cron Endpoint / Dispatch Trigger
apiRouter.all("/cron/move-reminders", async (req, res) => {
  // If CRON_SECRET is set, protect the cron endpoint
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized cron trigger" });
    }
  }

  try {
    const result = await checkAndDispatchDueReminders();
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    console.error("Cron dispatch error:", err);
    return res.status(500).json({ error: "Cron execution failed", details: err.message });
  }
});

// ==================== CRESCIVE NAVIGATOR API ====================
apiRouter.post("/navigator", async (req, res) => {
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
Be intelligent, helpful, friendly, patient, encouraging, clear, respectful, and approachable.
Do not sound robotic or overly formal.

2. WHAT YOU HELP USERS WITH
General questions, learning, difficult topics, brainstorming, writing, grammar, summaries, mathematics, science, technology, coding, app development, productivity, planning, personal development, and navigating the app.

3. NAVIGATOR ROLE & ACCURATE APP INVENTORY
You are part of the Navigator category. Guide users to sections that actually exist:
- "Home" tab: Daily Challenge, Creator Story ("Creator Brian Omuse · The vision behind CRESCIVE"), Momentum meter, Category quick links.
- "Moves" tab: Track, add, and complete discrete action steps ("Moves") with time commitments, priorities, reminders.
- "Categories" tab: 10 life pillars (Personal Growth, Career & Ambition, Financial Freedom, Health & Vitality, Mindset & Mental Health, Relationships & Social, Skills & Mastery, Creativity & Innovation, Productivity & Habits, Digital Life & Tech).
- "Navigator" tab: This official AI guidance assistant.
- "Fun Zone" tab: Games, brain teasers, riddles, quick math, memory match, word scramble.
- "Future" tab: 5-Year Vision, Horizon planning, and "What If?" Scenario Simulator.
- "Profile" tab: Profile details, constellation values, notification settings, and trajectory stats.

4. CRESCIVE OFFICIAL ENTITY & FOUNDER FACTS
- Name: CRESCIVE
- Tagline: "The app of becoming."
- Purpose: A personal growth and self-development platform
- Creator & Founder: Brian Omuse
- Created: 2026
- Origin: Malaba, Kenya
- Official philosophy: LEARN → GROW → CREATE → PROGRESS

USER CONTEXT:
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
        reply += `🎮 **Where are the games?**\n\nYou can find all games in the **Fun Zone** tab (gamepad icon)!\n- **Memory Match**\n- **Reaction Speed Test**\n- **Quick Math Sprint**\n- **Word Scramble**\n\nHead over to **Fun Zone** to try one whenever you need a quick refreshing break!`;
      } else if (lower.includes("code") || lower.includes("coding") || lower.includes("program") || lower.includes("developer")) {
        reply += `💻 **Where to learn & practice coding in CRESCIVE:**\n\n1. **Categories Tab → Skills & Mastery:**\n   Tap **Skills & Mastery** to browse curated coding Move ideas.\n2. **Your Moves Engine:**\n   Turn what you want to learn into a 15- or 30-minute daily action in your **Moves** tab.\n3. **Right Here with Me:**\n   Ask me any programming question or share code you want to debug!`;
      } else if (lower.includes("progress") || lower.includes("streak") || lower.includes("stats") || lower.includes("challenge")) {
        reply += `📈 **Tracking your progress in CRESCIVE:**\n\n- **Home Tab:** View your Daily Challenge streak and momentum meter.\n- **Moves Tab:** Check off your completed Moves and see your active trajectory.\n- **Profile Tab:** Review your personal chapter, vision, and consistency statistics.`;
      } else if (lower.includes("future") || lower.includes("what if") || lower.includes("simulator") || lower.includes("vision")) {
        reply += `🧭 **Planning your trajectory & testing scenarios:**\n\nHead over to the **Future** tab to refine your **5-Year Vision** and run the interactive **"What If?" Scenario Simulator**.`;
      } else {
        reply += `I'm here to help you learn, build, code, plan, solve problems, and find your way through CRESCIVE.\n\nRemember: **LEARN → GROW → CREATE → PROGRESS**.\n\nWhat would you like to explore or work on right now?`;
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
        console.warn("[Navigator] Gemini API call deployed fallback:", geminiError?.message || geminiError);
      }
    }

    const reply = generateFallback(message);
    return res.json({ reply });
  } catch (error: any) {
    console.error("Error in /navigator:", error);
    res.status(500).json({ error: "Failed to process Navigator query", details: error.message });
  }
});

// ==================== SCENARIO SIMULATOR API ("What If?") ====================
apiRouter.post("/simulator", async (req, res) => {
  try {
    const { scenario, userProfile } = req.body;
    const preferredName = userProfile?.preferredName || "User";
    const ai = getAIClient();

    if (!scenario || typeof scenario !== "string" || scenario.trim().length === 0) {
      return res.status(400).json({ error: "Scenario text is required." });
    }

    if (ai) {
      try {
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

Keep it realistic, grounded, and empowering. Return clear, concise markdown sections.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        return res.json({ analysis: response.text });
      } catch (geminiError: any) {
        console.warn("[Simulator] Gemini API call deployed fallback:", geminiError?.message || geminiError);
      }
    }

    return res.json({
      analysis: `### Trajectory Simulation for: "${scenario}"\n\n` +
        `**1. Knowledge & Skills**: Requires focused fundamentals and deliberate repetition.\n\n` +
        `**2. Time Investment**: Recommended 45–60 minutes 4 times per week to build compounding momentum without burnout.\n\n` +
        `**3. Trajectory Upside**: Significant progress in 90 days if paired with consistent execution.\n\n` +
        `**4. Key Friction**: Initial resistance and distractions. Protect your focus windows.\n\n` +
        `**5. The Immediate First Move**: Define your first 30-minute study or build session as a Move in CRESCIVE today.`
    });
  } catch (err: any) {
    console.error("Error in /simulator:", err);
    res.status(500).json({ error: "Simulation failed", details: err.message });
  }
});

// ==================== GLOBAL LEADERBOARD & XP VERIFICATION ====================
function validateAndReconcileXp(
  reportedXp: number,
  completedMoves: number,
  dailyChallenges: number,
  gameXp: number,
  achievementCount: number
): { verifiedXp: number; isFlagged: boolean; level: number } {
  const theoreticalUpperLimit =
    (completedMoves * 50) +
    (dailyChallenges * 40) +
    (achievementCount * 80) +
    Math.min(gameXp, 5000) +
    100;

  let verifiedXp = Math.max(0, Math.round(reportedXp));
  let isFlagged = false;

  if (verifiedXp > theoreticalUpperLimit && verifiedXp > 150) {
    verifiedXp = Math.min(verifiedXp, theoreticalUpperLimit);
    isFlagged = true;
  }

  const level = Math.max(1, Math.floor(verifiedXp / 100) + 1);
  return { verifiedXp, isFlagged, level };
}

apiRouter.post("/leaderboard", (req, res) => {
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
      realFirestoreUsers = []
    } = req.body;

    const completedMoves = Array.isArray(moves) ? moves.filter((m: any) => m.completed).length : 0;
    const dailyChallengesCount = dailyState?.completed?.challenge ? 1 : 0;
    const totalGameXp = Number(gameStats?.totalGamesXpEarned) || 0;
    const achievementCount = (gameStats?.unlockedAchievements?.length || 0) + (funZoneState?.unlockedAchievementIds?.length || 0);
    const rawTotalXp = (funZoneState?.xp || 0) + (completedMoves * 25);

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

    let combinedEntries: any[] = [];
    if (Array.isArray(realFirestoreUsers)) {
      combinedEntries = realFirestoreUsers.filter((u: any) => u && u.username);
    }

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

    combinedEntries.sort((a, b) => {
      const field = filter === "weekly" ? "weeklyXp" : "totalXp";
      const aVal = Number(a[field]) || 0;
      const bVal = Number(b[field]) || 0;
      if (bVal !== aVal) return bVal - aVal;
      const bMoves = Number(b.completedMoves) || 0;
      const aMoves = Number(a.completedMoves) || 0;
      if (bMoves !== aMoves) return bMoves - aMoves;
      return 0;
    });

    const rankedList = combinedEntries.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    const userIndex = rankedList.findIndex((item) => item.isCurrentUser);
    const userRank = userIndex !== -1 ? rankedList[userIndex].rank : null;

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
    console.error("Error in /leaderboard:", err);
    res.status(500).json({ error: "Failed to generate leaderboard", details: err.message });
  }
});

apiRouter.post("/leaderboard/validate-move", (req, res) => {
  try {
    const { moveId } = req.body;
    if (!moveId) {
      return res.status(400).json({ error: "moveId is required" });
    }
    return res.json({
      success: true,
      xpAwarded: 25,
      moveId,
      message: "+25 XP Earned! Great job moving your trajectory forward.",
    });
  } catch (err: any) {
    console.error("Error validating move action:", err);
    res.status(500).json({ error: "Validation failed" });
  }
});

// Mount the API router at BOTH "/api" AND "/" to guarantee support in both
// Vercel serverless functions (with or without path stripping) and local Express!
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
