import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { DailyMovesState, TrainingCycleDay, DailyEssentialCategory } from "../types";

const STORAGE_PREFIX = "crescive_daily_moves_v1_";
const STORAGE_CYCLE_KEY = "crescive_training_cycle_day_v1";
const STORAGE_STREAK_KEY = "crescive_moves_streak_v1";

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStoredCycleDay(): TrainingCycleDay {
  try {
    const raw = localStorage.getItem(STORAGE_CYCLE_KEY);
    if (raw) {
      const val = parseInt(raw, 10);
      if (val >= 1 && val <= 4) return val as TrainingCycleDay;
    }
  } catch (e) {
    console.warn("Failed reading stored cycle day:", e);
  }
  return 1;
}

export function setStoredCycleDay(day: TrainingCycleDay): void {
  try {
    localStorage.setItem(STORAGE_CYCLE_KEY, String(day));
  } catch (e) {
    console.warn("Failed saving cycle day:", e);
  }
}

export function advanceCycleDay(currentDay: TrainingCycleDay): TrainingCycleDay {
  const nextDay = (currentDay >= 4 ? 1 : (currentDay + 1)) as TrainingCycleDay;
  setStoredCycleDay(nextDay);
  return nextDay;
}

export function createInitialDailyMovesState(dateStr: string = getTodayDateString()): DailyMovesState {
  const cycleDay = getStoredCycleDay();
  let streak = 0;
  try {
    const rawStreak = localStorage.getItem(STORAGE_STREAK_KEY);
    if (rawStreak) streak = parseInt(rawStreak, 10) || 0;
  } catch (e) {
    console.warn("Streak read error:", e);
  }

  return {
    date: dateStr,
    cycleDay,
    completedEssentials: {
      move: false,
      hydrate: false,
      rest: false,
      focus: false,
      learn: false,
      reset: false,
      connect: false,
    },
    workout: {
      warmupCompleted: false,
      completedExerciseIds: [],
      speedCompleted: false,
      completed: false,
    },
    hydrationBreaksCount: 0,
    recoveryCompleted: false,
    focusCompleted: false,
    focusMinutesCompleted: 0,
    learnCompleted: false,
    resetCompleted: false,
    connectCompleted: false,
    dayCompleted: false,
    xpEarnedToday: 0,
    streakDays: streak,
    lastActiveDate: dateStr,
  };
}

export function getStoredDailyMoves(dateStr: string = getTodayDateString()): DailyMovesState {
  const key = `${STORAGE_PREFIX}${dateStr}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all fields exist
      return {
        ...createInitialDailyMovesState(dateStr),
        ...parsed,
        completedEssentials: {
          move: false,
          hydrate: false,
          rest: false,
          focus: false,
          learn: false,
          reset: false,
          connect: false,
          ...(parsed.completedEssentials || {}),
        },
        workout: {
          warmupCompleted: false,
          completedExerciseIds: [],
          speedCompleted: false,
          completed: false,
          ...(parsed.workout || {}),
        },
      };
    }
  } catch (e) {
    console.warn("Failed parsing daily moves from storage:", e);
  }

  const initial = createInitialDailyMovesState(dateStr);
  saveDailyMovesLocally(initial);
  return initial;
}

export function saveDailyMovesLocally(state: DailyMovesState): void {
  try {
    const key = `${STORAGE_PREFIX}${state.date}`;
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem(STORAGE_STREAK_KEY, String(state.streakDays));
    localStorage.setItem(STORAGE_CYCLE_KEY, String(state.cycleDay));
  } catch (e) {
    console.warn("Local storage write error:", e);
  }
}

/**
 * Persists daily moves state locally and to Firestore for authenticated user.
 */
export async function saveDailyMovesState(
  state: DailyMovesState,
  uid?: string
): Promise<void> {
  saveDailyMovesLocally(state);

  const effectiveUid = uid || auth.currentUser?.uid;
  if (!effectiveUid) return;

  try {
    const dailyMovesRef = doc(db, "users", effectiveUid, "dailyMoves", state.date);
    await setDoc(
      dailyMovesRef,
      {
        ...state,
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Also update trajectory data document
    const trajectoryRef = doc(db, "users", effectiveUid, "trajectory", "data");
    await setDoc(
      trajectoryRef,
      {
        dailyMovesState: state,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    // Offline or network warning - local storage has already safely persisted
    console.warn("Firestore dailyMoves sync deferred (offline/weak connection):", err);
  }
}

/**
 * Attempts to load today's moves from Firestore for authenticated user.
 */
export async function fetchRemoteDailyMoves(
  uid: string,
  dateStr: string = getTodayDateString()
): Promise<DailyMovesState | null> {
  try {
    const dailyMovesRef = doc(db, "users", uid, "dailyMoves", dateStr);
    const snap = await getDoc(dailyMovesRef);
    if (snap.exists()) {
      const data = snap.data() as DailyMovesState;
      saveDailyMovesLocally(data);
      return data;
    }
  } catch (err) {
    console.warn("Failed fetching remote dailyMoves:", err);
  }
  return null;
}

export function calculateCompletedEssentialsCount(state: DailyMovesState): number {
  const values = Object.values(state.completedEssentials);
  return values.filter(Boolean).length;
}

export const ESSENTIAL_TITLES: Record<DailyEssentialCategory, { title: string; subtitle: string }> = {
  move: { title: "MOVE", subtitle: "Move with purpose." },
  hydrate: { title: "HYDRATE", subtitle: "Keep your day flowing." },
  rest: { title: "REST", subtitle: "Rest is part of progress." },
  focus: { title: "FOCUS", subtitle: "Protect your attention." },
  learn: { title: "LEARN", subtitle: "Improve something today." },
  reset: { title: "RESET", subtitle: "Take a quiet minute." },
  connect: { title: "CONNECT", subtitle: "People matter." },
};
