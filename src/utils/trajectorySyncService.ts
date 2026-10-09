import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  UserProfile,
  MoveItem,
  FocusStats,
  FunZoneState,
  CresciveDailyState,
  DailyMovesState,
  MiniGameStats,
  TrajectoryData,
  TrajectorySyncStatus,
} from "../types";
import { getStoredFocusStats, saveStoredFocusStats } from "./focusStorage";
import { getStoredFunZoneState, saveFunZoneState } from "./funZoneStorage";
import { getStoredDailyState } from "./cresciveDailyStorage";
import { getStoredGameStats, saveGameStats } from "./gamesStorage";
import { getStoredDailyMoves, saveDailyMovesLocally } from "./dailyMovesStorage";

const STORAGE_KEY_PROFILE = "crescive_user_profile_v1";
const STORAGE_KEY_MOVES = "crescive_user_moves_v1";
const STORAGE_KEY_SYNC_VERSION = "crescive_trajectory_version_v1";
const STORAGE_KEY_LAST_SYNC_TIME = "crescive_trajectory_last_sync_v1";

// Unique client device token to prevent self-echo loops during real-time snapshot sync
const CLIENT_DEVICE_ID =
  typeof window !== "undefined"
    ? (() => {
        let id = sessionStorage.getItem("crescive_client_dev_id");
        if (!id) {
          id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          sessionStorage.setItem("crescive_client_dev_id", id);
        }
        return id;
      })()
    : "ssr";

let currentSyncStatus: TrajectorySyncStatus = "unauthenticated";
const statusListeners = new Set<(status: TrajectorySyncStatus) => void>();

export function getSyncStatus(): TrajectorySyncStatus {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "offline";
  }
  return currentSyncStatus;
}

export function subscribeSyncStatus(listener: (status: TrajectorySyncStatus) => void): () => void {
  statusListeners.add(listener);
  listener(getSyncStatus());
  return () => {
    statusListeners.delete(listener);
  };
}

function updateSyncStatus(status: TrajectorySyncStatus) {
  currentSyncStatus = status;
  statusListeners.forEach((fn) => fn(status));
}

// Track online/offline browser state
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (currentSyncStatus === "offline") {
      updateSyncStatus("syncing");
    }
  });
  window.addEventListener("offline", () => {
    updateSyncStatus("offline");
  });
}

/**
 * Reads all current local CRESCIVE trajectory data across all features
 */
export function getLocalTrajectorySnapshot(): {
  moves: MoveItem[];
  userProfile: UserProfile | null;
  focusStats: FocusStats;
  funZoneState: FunZoneState;
  dailyState: CresciveDailyState;
  dailyMovesState: DailyMovesState;
  gameStats: MiniGameStats;
} {
  let moves: MoveItem[] = [];
  let userProfile: UserProfile | null = null;

  try {
    const rawMoves = localStorage.getItem(STORAGE_KEY_MOVES);
    if (rawMoves) moves = JSON.parse(rawMoves);
  } catch {
    moves = [];
  }

  try {
    const rawProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (rawProfile) userProfile = JSON.parse(rawProfile);
  } catch {
    userProfile = null;
  }

  return {
    moves,
    userProfile,
    focusStats: getStoredFocusStats(),
    funZoneState: getStoredFunZoneState(),
    dailyState: getStoredDailyState(),
    dailyMovesState: getStoredDailyMoves(),
    gameStats: getStoredGameStats(),
  };
}

/**
 * Intelligent Conflict-Free Merger: Combines local and remote trajectory states
 * without dropping any user Moves, XP, achievements, or focus records.
 */
export function mergeTrajectories(
  local: ReturnType<typeof getLocalTrajectorySnapshot>,
  remote: TrajectoryData
): {
  mergedMoves: MoveItem[];
  mergedProfile: UserProfile | null;
  mergedFocus: FocusStats;
  mergedFunZone: FunZoneState;
  mergedDaily: CresciveDailyState;
  mergedGames: MiniGameStats;
} {
  // 1. Merge Moves by ID
  const movesMap = new Map<string, MoveItem>();

  // Add remote moves first
  (remote.moves || []).forEach((rm) => {
    movesMap.set(rm.id, rm);
  });

  // Reconcile with local moves
  (local.moves || []).forEach((lm) => {
    const rm = movesMap.get(lm.id);
    if (!rm) {
      movesMap.set(lm.id, lm);
    } else {
      // Both exist: if one is completed, prefer completion
      const isCompleted = lm.completed || rm.completed;
      const completedAt = lm.completedAt || rm.completedAt;

      // Keep integration identifiers if either has them
      const googleCalendarEventId = lm.googleCalendarEventId || rm.googleCalendarEventId;
      const googleCalendarSyncedAt = lm.googleCalendarSyncedAt || rm.googleCalendarSyncedAt;
      const googleCalendarHtmlLink = lm.googleCalendarHtmlLink || rm.googleCalendarHtmlLink;
      const androidAlarmSet = lm.androidAlarmSet || rm.androidAlarmSet;
      const androidAlarmTime = lm.androidAlarmTime || rm.androidAlarmTime;

      movesMap.set(lm.id, {
        ...rm,
        ...lm,
        completed: isCompleted,
        completedAt,
        googleCalendarEventId,
        googleCalendarSyncedAt,
        googleCalendarHtmlLink,
        androidAlarmSet,
        androidAlarmTime,
      });
    }
  });

  const mergedMoves = Array.from(movesMap.values()).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // 2. Merge UserProfile
  let mergedProfile: UserProfile | null = local.userProfile;
  if (!mergedProfile && remote.userProfile) {
    mergedProfile = remote.userProfile;
  } else if (mergedProfile && remote.userProfile) {
    // Both exist: prefer whichever has onboarding completed and richer content
    mergedProfile = {
      ...remote.userProfile,
      ...mergedProfile,
      preferredName: mergedProfile.preferredName || remote.userProfile.preferredName,
      avatarUrl: mergedProfile.avatarUrl || remote.userProfile.avatarUrl,
      becoming: mergedProfile.becoming || remote.userProfile.becoming,
      fiveYearVision: mergedProfile.fiveYearVision || remote.userProfile.fiveYearVision,
      matters: Array.from(new Set([...(mergedProfile.matters || []), ...(remote.userProfile.matters || [])])),
      constraints: Array.from(new Set([...(mergedProfile.constraints || []), ...(remote.userProfile.constraints || [])])),
    };
  }

  // 3. Merge FocusStats
  const remoteFocus = remote.focusStats || {
    totalSessionsCompleted: 0,
    totalFocusMinutes: 0,
    sessionsHistory: [],
    distinctDays: [],
    longestSessionMinutes: 0,
  };

  const sessionsMap = new Map<string, any>();
  (remoteFocus.sessionsHistory || []).forEach((s) => sessionsMap.set(s.id, s));
  (local.focusStats.sessionsHistory || []).forEach((s) => sessionsMap.set(s.id, s));
  const mergedSessions = Array.from(sessionsMap.values());

  const mergedFocusMinutes = mergedSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const mergedDistinctDays = Array.from(
    new Set(
      mergedSessions
        .map((s) => (s.completedAt ? s.completedAt.split("T")[0] : null))
        .filter(Boolean) as string[]
    )
  );

  const mergedFocus: FocusStats = {
    totalSessionsCompleted: mergedSessions.length,
    totalFocusMinutes: Math.max(local.focusStats.totalFocusMinutes, remoteFocus.totalFocusMinutes, mergedFocusMinutes),
    sessionsHistory: mergedSessions,
    distinctDays: mergedDistinctDays,
    longestSessionMinutes: Math.max(
      local.focusStats.longestSessionMinutes,
      remoteFocus.longestSessionMinutes,
      ...mergedSessions.map((s) => s.durationMinutes || 0),
      0
    ),
  };

  // 4. Merge FunZone State
  const remoteFun = remote.funZoneState || {
    xp: 0,
    streak: 0,
    lastActiveDate: "",
    favoritedJokeIds: [],
    jokesViewedCount: 0,
    gamesPlayedCount: 0,
    quizCorrectCount: 0,
    riddlesSolvedCount: 0,
    bestTapScore: 0,
    unlockedAchievementIds: [],
  };

  const mergedFunZone: FunZoneState = {
    xp: Math.max(local.funZoneState.xp || 0, remoteFun.xp || 0),
    streak: Math.max(local.funZoneState.streak || 0, remoteFun.streak || 0),
    lastActiveDate: local.funZoneState.lastActiveDate || remoteFun.lastActiveDate || "",
    favoritedJokeIds: Array.from(
      new Set([...(local.funZoneState.favoritedJokeIds || []), ...(remoteFun.favoritedJokeIds || [])])
    ),
    jokesViewedCount: Math.max(local.funZoneState.jokesViewedCount || 0, remoteFun.jokesViewedCount || 0),
    gamesPlayedCount: Math.max(local.funZoneState.gamesPlayedCount || 0, remoteFun.gamesPlayedCount || 0),
    quizCorrectCount: Math.max(local.funZoneState.quizCorrectCount || 0, remoteFun.quizCorrectCount || 0),
    riddlesSolvedCount: Math.max(local.funZoneState.riddlesSolvedCount || 0, remoteFun.riddlesSolvedCount || 0),
    bestTapScore: Math.max(local.funZoneState.bestTapScore || 0, remoteFun.bestTapScore || 0),
    unlockedAchievementIds: Array.from(
      new Set([...(local.funZoneState.unlockedAchievementIds || []), ...(remoteFun.unlockedAchievementIds || [])])
    ),
  };

  // 5. Merge Daily State
  const remoteDaily = remote.dailyState;
  let mergedDaily: CresciveDailyState = local.dailyState;
  if (remoteDaily && remoteDaily.date === local.dailyState.date) {
    mergedDaily = {
      ...local.dailyState,
      completed: {
        challenge: local.dailyState.completed.challenge || remoteDaily.completed.challenge,
        joke: local.dailyState.completed.joke || remoteDaily.completed.joke,
        miniGame: local.dailyState.completed.miniGame || remoteDaily.completed.miniGame,
        tip: local.dailyState.completed.tip || remoteDaily.completed.tip,
      },
      bonusClaimed: local.dailyState.bonusClaimed || remoteDaily.bonusClaimed,
      xpEarnedToday: Math.max(local.dailyState.xpEarnedToday, remoteDaily.xpEarnedToday),
      streak: Math.max(local.dailyState.streak, remoteDaily.streak),
    };
  } else if (remoteDaily && remoteDaily.date > local.dailyState.date) {
    mergedDaily = remoteDaily;
  }

  // 6. Merge Mini Games State
  const remoteGames = remote.gameStats;
  const mergedGames: MiniGameStats = {
    ...local.gameStats,
    totalGamesXpEarned: Math.max(local.gameStats.totalGamesXpEarned || 0, remoteGames?.totalGamesXpEarned || 0),
    gamesPlayed: Math.max(local.gameStats.gamesPlayed || 0, remoteGames?.gamesPlayed || 0),
    gamesCompleted: Math.max(local.gameStats.gamesCompleted || 0, remoteGames?.gamesCompleted || 0),
    runnerBestDistance: Math.max(local.gameStats.runnerBestDistance || 0, remoteGames?.runnerBestDistance || 0),
    runnerBestScore: Math.max(local.gameStats.runnerBestScore || 0, remoteGames?.runnerBestScore || 0),
    mazeLevelsCompleted: Math.max(local.gameStats.mazeLevelsCompleted || 0, remoteGames?.mazeLevelsCompleted || 0),
    mazeBestTime: Math.min(local.gameStats.mazeBestTime || 9999, remoteGames?.mazeBestTime || 9999),
    focusBestScore: Math.max(local.gameStats.focusBestScore || 0, remoteGames?.focusBestScore || 0),
    focusPerfectRuns: Math.max(local.gameStats.focusPerfectRuns || 0, remoteGames?.focusPerfectRuns || 0),
    unlockedAchievements: Array.from(
      new Set([...(local.gameStats.unlockedAchievements || []), ...(remoteGames?.unlockedAchievements || [])])
    ),
    dailyGameStartsCount: {
      ...(remoteGames?.dailyGameStartsCount || {}),
      ...(local.gameStats.dailyGameStartsCount || {}),
    },
    lastPlayedDate: local.gameStats.lastPlayedDate || remoteGames?.lastPlayedDate || "",
    consecutivePlayDays: Math.max(local.gameStats.consecutivePlayDays || 0, remoteGames?.consecutivePlayDays || 0),
  };

  return {
    mergedMoves,
    mergedProfile,
    mergedFocus,
    mergedFunZone,
    mergedDaily,
    mergedGames,
  };
}

/**
 * Saves merged trajectory to local storage
 */
export function persistTrajectoryLocally(data: {
  moves: MoveItem[];
  userProfile: UserProfile | null;
  focusStats: FocusStats;
  funZoneState: FunZoneState;
  dailyState: CresciveDailyState;
  gameStats: MiniGameStats;
}): void {
  try {
    localStorage.setItem(STORAGE_KEY_MOVES, JSON.stringify(data.moves));
    if (data.userProfile) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(data.userProfile));
    }
    saveStoredFocusStats(data.focusStats);
    saveFunZoneState(data.funZoneState);
    saveGameStats(data.gameStats);
    if ((data as any).dailyMovesState) {
      saveDailyMovesLocally((data as any).dailyMovesState);
    }
    localStorage.setItem(STORAGE_KEY_LAST_SYNC_TIME, new Date().toISOString());
  } catch (err) {
    console.error("Failed to persist trajectory locally:", err);
  }
}

/**
 * Synchronizes local trajectory with Firestore for the authenticated user
 */
export async function syncTrajectoryWithCloud(
  userId: string,
  onTrajectoryRestored?: (merged: { moves: MoveItem[]; userProfile: UserProfile | null }) => void
): Promise<boolean> {
  if (!userId) {
    updateSyncStatus("unauthenticated");
    return false;
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    updateSyncStatus("offline");
    return false;
  }

  updateSyncStatus("syncing");

  try {
    const trajectoryDocRef = doc(db, "users", userId, "trajectory", "data");
    const snapshot = await getDoc(trajectoryDocRef);
    const local = getLocalTrajectorySnapshot();

    let mergedData: {
      moves: MoveItem[];
      userProfile: UserProfile | null;
      focusStats: FocusStats;
      funZoneState: FunZoneState;
      dailyState: CresciveDailyState;
      gameStats: MiniGameStats;
    };

    let nextVersion = 1;

    if (snapshot.exists()) {
      const remote = snapshot.data() as TrajectoryData;
      nextVersion = (remote.version || 0) + 1;

      // Intelligent reconciliation
      const merged = mergeTrajectories(local, remote);
      mergedData = {
        moves: merged.mergedMoves,
        userProfile: merged.mergedProfile,
        focusStats: merged.mergedFocus,
        funZoneState: merged.mergedFunZone,
        dailyState: merged.mergedDaily,
        gameStats: merged.mergedGames,
      };
    } else {
      // First sync for this account: upload local data
      mergedData = local;
    }

    // Persist locally
    persistTrajectoryLocally(mergedData);

    // Upload to Firestore
    const cloudPayload = {
      userId,
      moves: mergedData.moves,
      userProfile: mergedData.userProfile,
      focusStats: mergedData.focusStats,
      funZoneState: mergedData.funZoneState,
      dailyState: mergedData.dailyState,
      dailyMovesState: (mergedData as any).dailyMovesState || local.dailyMovesState,
      gameStats: mergedData.gameStats,
      updatedAt: new Date().toISOString(),
      version: nextVersion,
      lastDeviceId: CLIENT_DEVICE_ID,
    };

    await setDoc(trajectoryDocRef, cloudPayload, { merge: true });

    localStorage.setItem(STORAGE_KEY_SYNC_VERSION, String(nextVersion));
    updateSyncStatus("synced");

    // Notify React state listeners
    if (onTrajectoryRestored) {
      onTrajectoryRestored({
        moves: mergedData.moves,
        userProfile: mergedData.userProfile,
      });
    }

    return true;
  } catch (error: any) {
    console.error("Cloud Trajectory Sync Error:", error);
    updateSyncStatus("error");
    return false;
  }
}

/**
 * Listens in real-time to remote trajectory changes from other devices
 */
export function listenToRemoteTrajectory(
  userId: string,
  onRemoteChange: (updated: { moves: MoveItem[]; userProfile: UserProfile | null }) => void
): () => void {
  if (!userId) return () => {};

  const trajectoryDocRef = doc(db, "users", userId, "trajectory", "data");

  const unsubscribe = onSnapshot(
    trajectoryDocRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const remote = snapshot.data() as TrajectoryData & { lastDeviceId?: string };

      // Ignore echoes from current device's own writes
      if (remote.lastDeviceId === CLIENT_DEVICE_ID) {
        updateSyncStatus("synced");
        return;
      }

      // Changes from Device B! Reconcile and apply
      const local = getLocalTrajectorySnapshot();
      const merged = mergeTrajectories(local, remote);

      persistTrajectoryLocally({
        moves: merged.mergedMoves,
        userProfile: merged.mergedProfile,
        focusStats: merged.mergedFocus,
        funZoneState: merged.mergedFunZone,
        dailyState: merged.mergedDaily,
        gameStats: merged.mergedGames,
      });

      updateSyncStatus("synced");
      onRemoteChange({
        moves: merged.mergedMoves,
        userProfile: merged.mergedProfile,
      });
    },
    (error) => {
      console.error("Remote trajectory snapshot error:", error);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        updateSyncStatus("offline");
      } else {
        updateSyncStatus("error");
      }
    }
  );

  return unsubscribe;
}
