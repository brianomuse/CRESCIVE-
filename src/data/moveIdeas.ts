import { MoveIdea } from "../types";

export const MOVE_IDEAS_CATEGORIES = [
  "All Categories",
  "Knowledge & Learning",
  "Career & Work",
  "Money",
  "Personal Growth",
  "Health & Fitness",
  "Relationships",
  "Creativity",
  "Creator & Building",
  "Goals & Direction",
  "Time & Productivity",
  "Life & Environment",
  "Experiences",
  "Confidence",
  "Discipline",
  "Communication",
  "Reading",
  "Technology",
  "School & Education",
  "Leadership",
  "Hobbies",
  "Community & Helping Others",
] as const;

export type MoveIdeaCategory = (typeof MOVE_IDEAS_CATEGORIES)[number];

export const MOVE_TIME_FILTERS = [
  "All Durations",
  "5 min",
  "10 min",
  "20 min",
  "30 min",
  "1 hour",
  "2+ hours",
] as const;

export const MOVE_IDEAS: MoveIdea[] = [
  // 1. Knowledge & Learning
  {
    id: "kl-1",
    title: "Learn Something New",
    category: "Knowledge & Learning",
    explanation: "Explore a topic, scientific phenomenon, or concept you have never encountered before.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["learning", "curiosity", "intellect"]
  },
  {
    id: "kl-2",
    title: "Learn a New Skill",
    category: "Knowledge & Learning",
    explanation: "Begin learning an actionable skill through structured practice and intentional study.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["skill", "practice", "growth"]
  },
  {
    id: "kl-3",
    title: "Practice Mathematics",
    category: "Knowledge & Learning",
    explanation: "Solve 5-10 analytical or mathematical problems to sharpen deduction and numerical intuition.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["math", "logic", "focus"]
  },
  {
    id: "kl-4",
    title: "Learn a Language",
    category: "Knowledge & Learning",
    explanation: "Learn 10 new vocabulary words and speak aloud 5 sentences in a target language.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["languages", "vocabulary", "culture"]
  },
  {
    id: "kl-5",
    title: "Synthesize Notes into a Summary",
    category: "Knowledge & Learning",
    explanation: "Condense a chapter or recent lecture into a single high-signal index card of key insights.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["notes", "comprehension", "memory"]
  },
  {
    id: "kl-6",
    title: "Deep Dive Research Session",
    category: "Knowledge & Learning",
    explanation: "Conduct an uninterrupted deep dive into primary sources on an intriguing subject.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["research", "deep work", "scholarship"]
  },

  // 2. Career & Work
  {
    id: "cw-1",
    title: "Research a Career",
    category: "Career & Work",
    explanation: "Investigate career trajectories, required credentials, and day-to-day realities of a field you admire.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["career", "research", "trajectory"]
  },
  {
    id: "cw-2",
    title: "Improve Your CV",
    category: "Career & Work",
    explanation: "Refine bullet points on your résumé to highlight concrete metrics, outcomes, and recent milestones.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["resume", "cv", "professional"]
  },
  {
    id: "cw-3",
    title: "Work on a Portfolio",
    category: "Career & Work",
    explanation: "Curate your best proof of work and draft case study descriptions demonstrating your craftsmanship.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["portfolio", "showcase", "projects"]
  },
  {
    id: "cw-4",
    title: "Reach Out to a Professional Mentor",
    category: "Career & Work",
    explanation: "Draft a thoughtful, respectful message asking for perspective or feedback on your trajectory.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["networking", "mentor", "reachout"]
  },
  {
    id: "cw-5",
    title: "Audit Your High-Leverage Work",
    category: "Career & Work",
    explanation: "Review your recent week: identify the 20% of work producing 80% of your tangible value.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["leverage", "strategy", "review"]
  },

  // 3. Money
  {
    id: "mo-1",
    title: "Save Money",
    category: "Money",
    explanation: "Review subscriptions, unnecessary recurring charges, or negotiate a monthly expense.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["savings", "budget", "finance"]
  },
  {
    id: "mo-2",
    title: "Track Today's Spending",
    category: "Money",
    explanation: "Record and categorize all transactions from the last 24 hours to maintain financial sovereignty.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["expense", "tracking", "discipline"]
  },
  {
    id: "mo-3",
    title: "Build or Update Your Monthly Budget",
    category: "Money",
    explanation: "Review current income, fixed allocations, and savings buffers for the coming month.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["budget", "planning", "wealth"]
  },
  {
    id: "mo-4",
    title: "Study an Investment or Financial Concept",
    category: "Money",
    explanation: "Learn how index compounding, dividend yields, or sovereign treasury reserves function.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["investing", "knowledge", "wealth"]
  },
  {
    id: "mo-5",
    title: "Review Financial Independence Trajectory",
    category: "Money",
    explanation: "Calculate your net burn rate and calibrate your emergency runway reserve.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["runway", "freedom", "independence"]
  },

  // 4. Personal Growth
  {
    id: "pg-1",
    title: "Reflect on an Important Decision",
    category: "Personal Growth",
    explanation: "Write down the core trade-offs, potential second-order outcomes, and underlying values.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["reflection", "decisions", "wisdom"]
  },
  {
    id: "pg-2",
    title: "Try Something New",
    category: "Personal Growth",
    explanation: "Step deliberately outside your comfort zone: a new environment, method, or creative activity.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["courage", "novelty", "growth"]
  },
  {
    id: "pg-3",
    title: "Perform an Honest Identity Audit",
    category: "Personal Growth",
    explanation: "Assess the gap between your ideal self and your daily habits with zero self-delusion.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["honesty", "self-awareness", "becoming"]
  },
  {
    id: "pg-4",
    title: "5-Minute Evening Gratitude Reflection",
    category: "Personal Growth",
    explanation: "Note three non-obvious occurrences or blessings from today and why they mattered.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["gratitude", "mindset", "presence"]
  },
  {
    id: "pg-5",
    title: "Write a Letter to Your 5-Year Future Self",
    category: "Personal Growth",
    explanation: "Record your current aspirations, principles, and where you vow to be in five years.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["vision", "future", "trajectory"]
  },

  // 5. Health & Fitness
  {
    id: "hf-1",
    title: "Exercise for 30 Minutes",
    category: "Health & Fitness",
    explanation: "Engage in bodyweight strength, resistance training, or an energetic interval circuit.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["exercise", "strength", "fitness"]
  },
  {
    id: "hf-2",
    title: "Take a 20-Minute Walk",
    category: "Health & Fitness",
    explanation: "Walk outdoors without headphones; let your gaze soften and clear mental congestion.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["walk", "sunlight", "clarity"]
  },
  {
    id: "hf-3",
    title: "Morning Hydration & Mobility Routine",
    category: "Health & Fitness",
    explanation: "Drink 500ml water with minerals and perform gentle spine, hip, and ankle mobility openers.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["mobility", "stretching", "morning"]
  },
  {
    id: "hf-4",
    title: "Prepare a Nourishing Whole-Food Meal",
    category: "Health & Fitness",
    explanation: "Cook a clean, protein-rich, nutrient-dense meal using natural whole-food ingredients.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["nutrition", "cooking", "vitality"]
  },
  {
    id: "hf-5",
    title: "Long Endurance Run or Hike",
    category: "Health & Fitness",
    explanation: "Spend sustained aerobic zone-2 time building cardiovascular capacity and stamina.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["endurance", "cardio", "stamina"]
  },

  // 6. Relationships
  {
    id: "re-1",
    title: "Call a Family Member",
    category: "Relationships",
    explanation: "Connect with a parent, sibling, or elder to genuinely listen and show heartfelt care.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["family", "connection", "love"]
  },
  {
    id: "re-2",
    title: "Check on a Friend",
    category: "Relationships",
    explanation: "Send a sincere voice note or check-in message to a friend you haven't spoken to recently.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["friendship", "care", "support"]
  },
  {
    id: "re-3",
    title: "Have an Unhurried Conversation",
    category: "Relationships",
    explanation: "Sit with someone important to you with phones put away and give complete presence.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["presence", "listening", "bonding"]
  },
  {
    id: "re-4",
    title: "Express Unsolicited Appreciation",
    category: "Relationships",
    explanation: "Thank someone specifically for the concrete positive impact they have had on your life.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["appreciation", "kindness", "gratitude"]
  },

  // 7. Creativity
  {
    id: "cr-1",
    title: "Write for 20 Minutes",
    category: "Creativity",
    explanation: "Write uninhibited stream-of-consciousness, prose, essay ideas, or personal reflections.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["writing", "expression", "creativity"]
  },
  {
    id: "cr-2",
    title: "Practice a Creative Skill",
    category: "Creativity",
    explanation: "Spend focused time practicing drawing, digital illustration, composition, or design.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["art", "design", "craft"]
  },
  {
    id: "cr-3",
    title: "Generate 10 New Ideas on a Prompt",
    category: "Creativity",
    explanation: "Push past obvious answers to generate 10 novel angles on a problem or creative thesis.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["ideation", "brainstorming", "divergent thinking"]
  },
  {
    id: "cr-4",
    title: "Create a Visual Moodboard or Study",
    category: "Creativity",
    explanation: "Collect exemplary visual artifacts, typography specimens, and architecture references.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["aesthetics", "curation", "taste"]
  },

  // 8. Creator & Building
  {
    id: "cb-1",
    title: "Build Something",
    category: "Creator & Building",
    explanation: "Construct a physical or digital artifact from scratch: code, hardware, craft, or prototype.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["building", "making", "prototype"]
  },
  {
    id: "cb-2",
    title: "Start a Personal Project",
    category: "Creator & Building",
    explanation: "Initialize the repository, file structure, or outline for a project you've been delaying.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["initiative", "project", "genesis"]
  },
  {
    id: "cb-3",
    title: "Continue an Unfinished Project",
    category: "Creator & Building",
    explanation: "Pick up a stalled build and push one milestone or major feature across the finish line.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["momentum", "completion", "shipping"]
  },
  {
    id: "cb-4",
    title: "Work on a Personal Project",
    category: "Creator & Building",
    explanation: "Dedicate 2 deep hours of creative construction on your primary sovereign venture.",
    suggestedDuration: "2 hours",
    timeBucket: "2+ hours",
    tags: ["deep work", "creation", "craft"]
  },
  {
    id: "cb-5",
    title: "Ship a Working Public Release",
    category: "Creator & Building",
    explanation: "Deploy, publish, or release an updated build into the hands of real users or readers.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["shipping", "release", "courage"]
  },

  // 9. Goals & Direction
  {
    id: "gd-1",
    title: "Define a Goal",
    category: "Goals & Direction",
    explanation: "Clarify a specific, measurable, meaningful objective with an uncompromising deadline.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["goals", "clarity", "focus"]
  },
  {
    id: "gd-2",
    title: "Break a Large Goal into Smaller Steps",
    category: "Goals & Direction",
    explanation: "Deconstruct an overwhelming objective into 5 distinct, sequential, daily executable Moves.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["decomposition", "strategy", "execution"]
  },
  {
    id: "gd-3",
    title: "Review Your Goals",
    category: "Goals & Direction",
    explanation: "Audit your active milestones against reality: prune vanity goals and double down on true leverage.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["review", "alignment", "direction"]
  },
  {
    id: "gd-4",
    title: "Quarterly Trajectory Alignment",
    category: "Goals & Direction",
    explanation: "Review the past 90 days of progress and establish the primary priority for the coming quarter.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["quarterly", "milestones", "vision"]
  },

  // 10. Time & Productivity
  {
    id: "tp-1",
    title: "Plan Tomorrow",
    category: "Time & Productivity",
    explanation: "Identify the single highest-priority Move for tomorrow so you start with immediate clarity.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["planning", "evening", "clarity"]
  },
  {
    id: "tp-2",
    title: "Spend Focused Time Without Distractions",
    category: "Time & Productivity",
    explanation: "Engage in a distraction-free deep work sprint with all notifications and tabs silenced.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["focus", "deep work", "flow"]
  },
  {
    id: "tp-3",
    title: "Audit Screen Time and Digital Leaks",
    category: "Time & Productivity",
    explanation: "Review device analytics; identify passive consumption traps and establish protective boundaries.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["digital wellness", "audit", "focus"]
  },
  {
    id: "tp-4",
    title: "Clear Administrative Backlog",
    category: "Time & Productivity",
    explanation: "Tackle outstanding emails, forms, and administrative loose ends in a rapid time-boxed sprint.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["admin", "inbox zero", "efficiency"]
  },

  // 11. Life & Environment
  {
    id: "le-1",
    title: "Organize Your Workspace",
    category: "Life & Environment",
    explanation: "Clear your desk of debris, tidy cords, wipe surfaces, and prepare a calm physical canvas.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["workspace", "order", "clarity"]
  },
  {
    id: "le-2",
    title: "Deep Clean One Room or Zone",
    category: "Life & Environment",
    explanation: "Restore order and cleanliness to a high-traffic room to reset your mental state.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["cleaning", "environment", "calm"]
  },
  {
    id: "le-3",
    title: "De-clutter Digital Files and Desktop",
    category: "Life & Environment",
    explanation: "Archive old downloads, organize key folders, and streamline your digital working environment.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["digital hygiene", "files", "order"]
  },
  {
    id: "le-4",
    title: "Prepare Your Living Space for Sleep",
    category: "Life & Environment",
    explanation: "Dim ambient lights, adjust ventilation, cool the room, and eliminate blue light sources.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["sleep", "evening", "environment"]
  },

  // 12. Experiences
  {
    id: "ex-1",
    title: "Explore an Unfamiliar Neighborhood",
    category: "Experiences",
    explanation: "Wander a new street, district, or park with open eyes, observing local architecture and rhythms.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["exploration", "adventure", "discovery"]
  },
  {
    id: "ex-2",
    title: "Visit a Cultural Space or Library",
    category: "Experiences",
    explanation: "Spend an hour surrounded by history, art, rare books, or quiet contemplative spaces.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["culture", "museum", "beauty"]
  },
  {
    id: "ex-3",
    title: "Watch the Sunrise or Sunset Outdoors",
    category: "Experiences",
    explanation: "Witness the horizon transition in real time without phone screens or interruptions.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["nature", "presence", "wonder"]
  },
  {
    id: "ex-4",
    title: "Cook an Unfamiliar International Recipe",
    category: "Experiences",
    explanation: "Prepare a meal from a culture different than your own, testing new spices and methods.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["cooking", "culture", "discovery"]
  },

  // 13. Confidence
  {
    id: "co-1",
    title: "Voice an Opinion in a Group Setting",
    category: "Confidence",
    explanation: "Speak up deliberately with clarity and conviction during an upcoming meeting or discussion.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["courage", "voice", "assertiveness"]
  },
  {
    id: "co-2",
    title: "List 5 Difficult Things You Have Overcome",
    category: "Confidence",
    explanation: "Recall tangible proof of your past resilience to anchor self-belief in empirical fact.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["resilience", "evidence", "self-trust"]
  },
  {
    id: "co-3",
    title: "Rehearse a Presentation Under Pressure",
    category: "Confidence",
    explanation: "Stand up, set a timer, and deliver your pitch or speech straight through without stopping.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["public speaking", "rehearsal", "poise"]
  },
  {
    id: "co-4",
    title: "Do One Thing You've Been Avoiding",
    category: "Confidence",
    explanation: "Confront a small uncomfortable task right now to eliminate lingering anxiety.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["bravery", "action", "momentum"]
  },

  // 14. Discipline
  {
    id: "di-1",
    title: "Resist an Urge with Cold Presence",
    category: "Discipline",
    explanation: "When a distraction urge strikes, breathe deeply for 2 minutes and let the wave subside.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["willpower", "mindfulness", "restraint"]
  },
  {
    id: "di-2",
    title: "Wake Up at Your Target Time",
    category: "Discipline",
    explanation: "Rise immediately without hitting snooze; plant both feet firmly on the ground.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["morning", "consistency", "mastery"]
  },
  {
    id: "di-3",
    title: "Finish What You Started",
    category: "Discipline",
    explanation: "Refuse to open a new task until you carry the current commitment across the finish line.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["completion", "focus", "integrity"]
  },
  {
    id: "di-4",
    title: "Cold Water Finish to Shower",
    category: "Discipline",
    explanation: "Turn the shower water completely cold for the final 60 seconds to reinforce nervous-system control.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["resilience", "cold exposure", "grit"]
  },

  // 15. Communication
  {
    id: "cm-1",
    title: "Practice Communication",
    category: "Communication",
    explanation: "Record yourself explaining a complex idea concisely in under 2 minutes, then review cadence.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["speaking", "clarity", "articulation"]
  },
  {
    id: "cm-2",
    title: "Write a Direct, Concise Email",
    category: "Communication",
    explanation: "Draft a high-stakes message, edit out 30% of the filler words, and verify the explicit call to action.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["writing", "brevity", "professional"]
  },
  {
    id: "cm-3",
    title: "Active Listening Practice",
    category: "Communication",
    explanation: "In your next conversation, summarize the other person's point before stating your own view.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["listening", "empathy", "dialogue"]
  },
  {
    id: "cm-4",
    title: "Deliver Constructive, Respectful Feedback",
    category: "Communication",
    explanation: "Provide honest, compassionate feedback designed to empower someone's growth.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["feedback", "candor", "growth"]
  },

  // 16. Reading
  {
    id: "rd-1",
    title: "Read 10 Pages",
    category: "Reading",
    explanation: "Read 10 pages of high-substance non-fiction or enduring classic literature with full presence.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["reading", "books", "depth"]
  },
  {
    id: "rd-2",
    title: "Read About Something You Are Interested In",
    category: "Reading",
    explanation: "Immerse yourself in a well-researched essay or book chapter on a captivating domain.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["curiosity", "reading", "interest"]
  },
  {
    id: "rd-3",
    title: "Read a Landmark Essay or Paper",
    category: "Reading",
    explanation: "Study an influential academic paper or foundational historical essay with highlighter and notes.",
    suggestedDuration: "45 min",
    timeBucket: "30 min",
    tags: ["scholarship", "essays", "intellect"]
  },
  {
    id: "rd-4",
    title: "Read Poetry or Philosophical Aphorisms",
    category: "Reading",
    explanation: "Reflect slowly on concentrated language to attune your mind to rhythm and deeper meaning.",
    suggestedDuration: "10 min",
    timeBucket: "10 min",
    tags: ["philosophy", "poetry", "contemplation"]
  },

  // 17. Technology
  {
    id: "te-1",
    title: "Learn a Programming Concept",
    category: "Technology",
    explanation: "Study closures, recursion, state machines, or asynchronous architecture with hands-on code.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["coding", "programming", "software"]
  },
  {
    id: "te-2",
    title: "Automate a Repetitive Task",
    category: "Technology",
    explanation: "Write a small script, macro, or terminal shortcut to eliminate a daily manual chore.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["automation", "efficiency", "code"]
  },
  {
    id: "te-3",
    title: "Audit Account Security & Passwords",
    category: "Technology",
    explanation: "Review key email and banking credentials, enable two-factor authentication, and update passwords.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["security", "privacy", "defense"]
  },
  {
    id: "te-4",
    title: "Explore an Open-Source Codebase",
    category: "Technology",
    explanation: "Clone and inspect architecture patterns inside a reputable open-source repository on GitHub.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["open source", "architecture", "software"]
  },

  // 18. School & Education
  {
    id: "se-1",
    title: "Study for 30 Minutes",
    category: "School & Education",
    explanation: "Engage in focused, distraction-free study of your primary academic coursework.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["study", "school", "academics"]
  },
  {
    id: "se-2",
    title: "Active Recall Flashcard Session",
    category: "School & Education",
    explanation: "Test yourself with spaced repetition flashcards rather than passively re-reading notes.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["flashcards", "retention", "memory"]
  },
  {
    id: "se-3",
    title: "Solve Past Exam Questions",
    category: "School & Education",
    explanation: "Simulate test conditions by answering timed practice questions without checking solutions.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["exam prep", "practice", "testing"]
  },
  {
    id: "se-4",
    title: "Teach a Concept to an Empty Room",
    category: "School & Education",
    explanation: "Use the Feynman technique: explain a difficult lesson out loud simply as if teaching a beginner.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["feynman", "teaching", "mastery"]
  },

  // 19. Leadership
  {
    id: "ld-1",
    title: "Conduct a 1-on-1 Check-In",
    category: "Leadership",
    explanation: "Hold an intentional conversation with a peer or teammate to remove roadblocks and empower them.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["leadership", "team", "empowerment"]
  },
  {
    id: "ld-2",
    title: "Take Ownership of an Unresolved Problem",
    category: "Leadership",
    explanation: "Step into an ambiguous gap, propose a clear action plan, and mobilize collective progress.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["initiative", "ownership", "solutions"]
  },
  {
    id: "ld-3",
    title: "Recognize Someone's Behind-the-Scenes Contribution",
    category: "Leadership",
    explanation: "Publicly or privately honor someone whose quiet reliability keeps everything functioning.",
    suggestedDuration: "5 min",
    timeBucket: "5 min",
    tags: ["recognition", "culture", "morale"]
  },

  // 20. Hobbies
  {
    id: "hb-1",
    title: "Practice a Musical Instrument",
    category: "Hobbies",
    explanation: "Spend 20 minutes mastering a challenging chord progression, scale, or musical movement.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["music", "instrument", "flow"]
  },
  {
    id: "hb-2",
    title: "Tend to Plants or a Garden",
    category: "Hobbies",
    explanation: "Water, prune, inspect soil moisture, and nurture living greenery in your environment.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["gardening", "nature", "patience"]
  },
  {
    id: "hb-3",
    title: "Play a Game of Chess or Strategy",
    category: "Hobbies",
    explanation: "Engage in a deliberate match requiring tactical foresight, defense calculation, and patience.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["chess", "strategy", "games"]
  },
  {
    id: "hb-4",
    title: "Practice a Skill",
    category: "Hobbies",
    explanation: "Devote uninterrupted time to hone an artisanal hobby: woodworking, leatherwork, or cooking.",
    suggestedDuration: "1 hour",
    timeBucket: "1 hour",
    tags: ["craft", "hands-on", "mastery"]
  },

  // 21. Community & Helping Others
  {
    id: "ch-1",
    title: "Help Someone",
    category: "Community & Helping Others",
    explanation: "Offer genuine assistance to a neighbor, colleague, or stranger with zero expectation of return.",
    suggestedDuration: "20 min",
    timeBucket: "20 min",
    tags: ["service", "kindness", "community"]
  },
  {
    id: "ch-2",
    title: "Volunteer Time to a Local Cause",
    category: "Community & Helping Others",
    explanation: "Contribute hands-on labor or mentoring to a local community initiative or school.",
    suggestedDuration: "2 hours",
    timeBucket: "2+ hours",
    tags: ["volunteering", "impact", "generosity"]
  },
  {
    id: "ch-3",
    title: "Donate Unused Items in Excellent Condition",
    category: "Community & Helping Others",
    explanation: "Gather 5 quality clothing items or books and deliver them to a community center.",
    suggestedDuration: "30 min",
    timeBucket: "30 min",
    tags: ["giving", "declutter", "charity"]
  },
  {
    id: "ch-4",
    title: "Pick Up Litter in Your Neighborhood",
    category: "Community & Helping Others",
    explanation: "Take a trash bag on a short walk and leave a street cleaner than you found it.",
    suggestedDuration: "15 min",
    timeBucket: "10 min",
    tags: ["civic", "environment", "stewardship"]
  }
];
