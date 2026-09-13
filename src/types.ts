export type ChapterType = 
  | "LEARNING"
  | "BUILDING"
  | "WORKING"
  | "EXPLORING"
  | "TRANSITIONING";

export interface UserProfile {
  preferredName: string;
  avatarUrl?: string;
  age: number;
  chapter: string[];
  becoming: string;
  matters: string[];
  fiveYearVision: string;
  constraints: string[];
  customConstraint?: string;
  availableTime: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface MoveItem {
  id: string;
  title: string;
  domain: string;
  timeCommitment: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  // Scheduling & Reminders
  scheduledDate?: string;
  scheduledTime?: string;
  repeatSchedule?: "none" | "daily" | "weekdays" | "weekly";
  reminderEnabled?: boolean;
  reminderDateTime?: string;
  snoozeCount?: number;
  lastSnoozedAt?: string;
  reminderDismissed?: boolean;
}

export interface MoveIdea {
  id: string;
  title: string;
  category: string;
  explanation: string;
  suggestedDuration: string;
  timeBucket: "5 min" | "10 min" | "20 min" | "30 min" | "1 hour" | "2+ hours";
  tags: string[];
}

export interface ReminderSettings {
  remindersEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultTimingMinutes: number; // 0 = at time, 5, 10, 15, 30
}

export interface LifeCategory {
  id: string;
  number: number;
  title: string;
  iconName: string;
  subcategories: string[];
  color: string;
  glowColor: string;
  accentGradient: string;
  description: string;
}

export interface ScenarioResult {
  id: string;
  scenario: string;
  analysis: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

// ==================== FUN ZONE TYPES ====================
export type JokeCategory =
  | "Random"
  | "School"
  | "Dad Jokes"
  | "Smart/Funny"
  | "Short Jokes"
  | "Silly Jokes"
  | "Technology"
  | "Student Life";

export interface Joke {
  id: string;
  category: JokeCategory;
  text: string;
  punchline?: string;
  emoji?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface ScrambleWord {
  id: string;
  scrambled: string;
  word: string;
  hint: string;
  emoji: string;
}

export interface Riddle {
  id: string;
  riddle: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface FunAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetCount: number;
  unlocked: boolean;
  xpReward: number;
}

export interface FunZoneState {
  xp: number;
  streak: number;
  lastActiveDate: string;
  favoritedJokeIds: string[];
  jokesViewedCount: number;
  gamesPlayedCount: number;
  quizCorrectCount: number;
  riddlesSolvedCount: number;
  bestTapScore: number;
  dailyJokeClaimedDate?: string;
  firstDailyActivityDate?: string;
  unlockedAchievementIds: string[];
}

// ==================== CRESCIVE DAILY TYPES ====================
export interface DailyChallengeItem {
  id: string;
  category: "Math" | "Science" | "English" | "Logic" | "General Knowledge" | "Geography" | "Technology" | "Patterns";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DailyTipItem {
  id: string;
  category: "Study" | "Science" | "Technology" | "Habits" | "Time Management" | "Creativity" | "Memory" | "Space" | "Nature";
  tag: string;
  title: string;
  tip: string;
  actionableStep?: string;
}

export interface CresciveDailyState {
  date: string; // YYYY-MM-DD
  completed: {
    challenge: boolean;
    joke: boolean;
    miniGame: boolean;
    tip: boolean;
  };
  bonusClaimed: boolean;
  xpEarnedToday: number;
  streak: number;
  lastCompletedDate?: string;
  todayChallengeId: string;
  todayJokeId: string;
  todayTipId: string;
  todayGameType: "scramble" | "tap" | "riddle";
}

// ==================== 3D MINI GAMES TYPES ====================
export type MiniGameId = "runner" | "maze" | "focus";

export interface MiniGameMeta {
  id: MiniGameId;
  title: string;
  tagline: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  xpReward: string;
  category: string;
  color: string;
  glowColor: string;
}

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface MiniGameStats {
  totalGamesXpEarned: number;
  gamesPlayed: number;
  gamesCompleted: number;
  runnerBestDistance: number;
  runnerBestScore: number;
  mazeLevelsCompleted: number;
  mazeBestTime: number; // in seconds
  focusBestScore: number;
  focusPerfectRuns: number;
  unlockedAchievements: string[];
  dailyGameStartsCount: Record<string, number>;
  lastPlayedDate: string;
  consecutivePlayDays: number;
}

// ==================== GLOBAL LEADERBOARD TYPES ====================
export type LeaderboardFilter = "global" | "weekly" | "friends" | "all-time";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  avatarUrl?: string;
  level: number;
  totalXp: number;
  weeklyXp: number;
  completedMoves: number;
  dailyChallengesCount: number;
  achievementsCount: number;
  chapter?: string;
  country?: string;
  badge?: string;
  streakDays?: number;
  isCurrentUser?: boolean;
  isFriend?: boolean;
}

export interface LeaderboardPrivacySettings {
  optIn: boolean;
  displayName: string;
  showAvatar: boolean;
  showChapter: boolean;
}

export interface UserLeaderboardStanding {
  currentRank: number;
  previousRank: number;
  totalXp: number;
  weeklyXp: number;
  level: number;
  completedMoves: number;
  dailyChallengesCount: number;
  achievementsCount: number;
  nextRankXp: number;
  xpToNextRank: number;
  nextRankUsername?: string;
  rankChangeNotification?: string;
}

// ==================== DEEP WORK SANCTUARY (FOCUS / FLOW MODE) TYPES ====================
export type SoundscapeId = "rain" | "cosmic" | "focus" | "cafe" | "none";

export type FocusReflectionChoice = "flow" | "good" | "some_friction" | "heavy_friction";

export interface FocusSession {
  id: string;
  moveId?: string;
  moveTitle: string;
  domain?: string;
  durationMinutes: number;
  completedAt: string;
  reflection?: FocusReflectionChoice;
  xpEarned: number;
}

export interface FocusStats {
  totalSessionsCompleted: number;
  totalFocusMinutes: number;
  sessionsHistory: FocusSession[];
  distinctDays: string[];
  longestSessionMinutes: number;
}
