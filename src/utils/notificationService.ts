import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { app, db, auth } from "../lib/firebase";
import {
  NotificationPermissionState,
  NotificationPreferences,
  MoveReminderItem,
} from "../types";

const STORAGE_KEY_NOTIFICATION_PREFS = "crescive_notification_preferences_v1";
const STORAGE_KEY_SAVED_TOKEN = "crescive_fcm_token_v1";
const STORAGE_KEY_MOVE_REMINDERS = "crescive_move_reminders_v1";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  chatMessages: true,
  moveReminders: true,
  cresciveUpdates: true,
};

let messagingInstance: Messaging | null = null;

/**
 * Returns current browser notification permission status without prompting.
 * Handles 'granted', 'denied', 'default', 'unsupported'.
 */
export function getBrowserNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Triggers the REAL browser notification permission prompt directly.
 * Invoked ONLY when the user intentionally taps [ ENABLE NOTIFICATIONS ].
 * Does NOT display any synthetic or simulated modal dialogs.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  // If already granted, do not ask again
  if (Notification.permission === "granted") {
    return "granted";
  }

  // If already denied, the browser prevents asking again
  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch (err) {
    console.error("Native Notification.requestPermission() error:", err);
    return "denied";
  }
}

/**
 * Lazy loads and returns the Firebase Messaging instance if supported in this browser.
 */
export async function getFirebaseMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.info("FCM is not supported in this browser environment.");
      return null;
    }

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (err) {
    console.warn("Could not obtain FCM messaging instance:", err);
    return null;
  }
}

/**
 * Registers the background service worker and retrieves a real FCM registration token.
 * Securely associates the token with the authenticated Firebase UID.
 */
export async function registerPushNotificationToken(uid?: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;

  if (Notification.permission !== "granted") {
    return null;
  }

  const userId = uid || auth.currentUser?.uid;
  if (!userId) {
    console.warn("Cannot register FCM token: No authenticated Firebase user.");
    return null;
  }

  try {
    const messaging = await getFirebaseMessagingInstance();
    if (!messaging) return null;

    // Register official firebase messaging service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // Retrieve FCM token using service worker registration
    const currentToken = await getToken(messaging, {
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      localStorage.setItem(STORAGE_KEY_SAVED_TOKEN, currentToken);

      // Securely store token under the authenticated user's private document in Firestore
      const userTokensRef = doc(db, "users", userId, "notifications", "fcm_tokens");
      await setDoc(
        userTokensRef,
        {
          tokens: arrayUnion(currentToken),
          activeToken: currentToken,
          updatedAt: serverTimestamp(),
          userAgent: navigator.userAgent,
          platform: navigator.platform || "web",
        },
        { merge: true }
      );

      // Also register with server-side push engine
      fetch("/api/notifications/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          token: currentToken,
          userAgent: navigator.userAgent,
        }),
      }).catch((e) => console.warn("Failed to notify backend of token:", e));

      return currentToken;
    } else {
      console.warn("No FCM registration token received.");
      return null;
    }
  } catch (err) {
    console.error("Error obtaining FCM registration token:", err);
    return null;
  }
}

/**
 * Unregisters the push notification token from Firestore and local storage.
 */
export async function unregisterPushNotificationToken(uid?: string): Promise<void> {
  if (typeof window === "undefined") return;

  const userId = uid || auth.currentUser?.uid;
  const currentToken = localStorage.getItem(STORAGE_KEY_SAVED_TOKEN);

  localStorage.removeItem(STORAGE_KEY_SAVED_TOKEN);

  if (userId && currentToken) {
    try {
      const userTokensRef = doc(db, "users", userId, "notifications", "fcm_tokens");
      await setDoc(
        userTokensRef,
        {
          tokens: arrayRemove(currentToken),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      fetch("/api/notifications/unregister-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, token: currentToken }),
      }).catch(() => {});
    } catch (e) {
      console.warn("Failed to remove token from Firestore:", e);
    }
  }
}

/**
 * Retrieves the user's notification preferences from local storage and Firestore.
 */
export function getStoredNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATION_PREFS);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Saves notification preferences both locally and to the user's private Firestore document.
 */
export async function saveNotificationPreferences(
  prefs: NotificationPreferences,
  uid?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATION_PREFS, JSON.stringify(prefs));

    const userId = uid || auth.currentUser?.uid;
    if (userId) {
      const prefsRef = doc(db, "users", userId, "notifications", "preferences");
      await setDoc(prefsRef, { ...prefs, updatedAt: serverTimestamp() }, { merge: true });

      fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, preferences: prefs }),
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to save notification preferences:", err);
  }
}

/**
 * Initializes foreground push message listener.
 * When the app is in the foreground, dispatches a persistent system notification via service worker.
 */
export async function setupForegroundPushListener(
  onNotificationReceived?: (payload: any) => void
): Promise<(() => void) | undefined> {
  const messaging = await getFirebaseMessagingInstance();
  if (!messaging) return undefined;

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("[notificationService] Foreground message received: ", payload);

    if (onNotificationReceived) {
      onNotificationReceived(payload);
    }

    // Display persistent system notification via service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const title = payload.notification?.title || payload.data?.title || "CRESCIVE";
        const body = payload.notification?.body || payload.data?.body || "New update";
        const icon = payload.notification?.icon || payload.data?.icon || "/crescive_logo.png";

        (registration.showNotification as any)(title, {
          body,
          icon,
          badge: "/crescive_logo.png",
          tag: payload.data?.tag || "crescive-foreground",
          data: payload.data,
          vibrate: [200, 100, 200],
        });
      });
    }
  });

  return unsubscribe;
}

// ==================== MOVE REMINDERS MANAGEMENT ====================

/**
 * Loads Move Reminders from local storage and syncs with Firestore if signed in.
 */
export async function getMoveReminders(uid?: string): Promise<MoveReminderItem[]> {
  let localReminders: MoveReminderItem[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MOVE_REMINDERS);
      if (raw) localReminders = JSON.parse(raw);
    } catch {
      localReminders = [];
    }
  }

  const userId = uid || auth.currentUser?.uid;
  if (!userId) return localReminders;

  try {
    const colRef = collection(db, "users", userId, "moveReminders");
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const remoteReminders: MoveReminderItem[] = [];
      snapshot.forEach((d) => {
        remoteReminders.push(d.data() as MoveReminderItem);
      });
      localStorage.setItem(STORAGE_KEY_MOVE_REMINDERS, JSON.stringify(remoteReminders));
      return remoteReminders;
    }
  } catch (err) {
    console.warn("Could not fetch remote move reminders:", err);
  }

  return localReminders;
}

/**
 * Saves (creates or updates) a Move Reminder locally and in Firestore.
 */
export async function saveMoveReminder(reminder: MoveReminderItem): Promise<void> {
  const current = await getMoveReminders();
  const existingIdx = current.findIndex((r) => r.id === reminder.id);

  let updatedList: MoveReminderItem[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = { ...reminder, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [...current, reminder];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_MOVE_REMINDERS, JSON.stringify(updatedList));
  }

  const userId = reminder.userId || auth.currentUser?.uid;
  if (userId) {
    try {
      const docRef = doc(db, "users", userId, "moveReminders", reminder.id);
      await setDoc(docRef, reminder, { merge: true });

      // Notify backend scheduler
      fetch("/api/notifications/move-reminder/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminder }),
      }).catch(() => {});
    } catch (e) {
      console.error("Failed to persist Move Reminder to Firestore:", e);
    }
  }
}

/**
 * Deletes a Move Reminder.
 */
export async function deleteMoveReminder(reminderId: string, uid?: string): Promise<void> {
  const current = await getMoveReminders();
  const filtered = current.filter((r) => r.id !== reminderId);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_MOVE_REMINDERS, JSON.stringify(filtered));
  }

  const userId = uid || auth.currentUser?.uid;
  if (userId) {
    try {
      const docRef = doc(db, "users", userId, "moveReminders", reminderId);
      await deleteDoc(docRef);

      fetch("/api/notifications/move-reminder/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reminderId, uid: userId }),
      }).catch(() => {});
    } catch (e) {
      console.error("Failed to delete Move Reminder from Firestore:", e);
    }
  }
}

/**
 * Enables or disables a Move Reminder.
 */
export async function toggleMoveReminder(
  reminderId: string,
  enabled: boolean,
  uid?: string
): Promise<void> {
  const current = await getMoveReminders();
  const item = current.find((r) => r.id === reminderId);
  if (!item) return;

  const updated: MoveReminderItem = { ...item, enabled, updatedAt: new Date().toISOString() };
  await saveMoveReminder(updated);
}

/**
 * Triggers a real Move Reminder notification (via service worker or Notification API)
 * when a reminder is due.
 */
export async function dispatchMoveReminderNotification(reminder: MoveReminderItem): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const prefs = getStoredNotificationPreferences();
  if (!prefs.moveReminders) return;

  const title = "Time for your Daily Move";
  const body = reminder.moveTitle
    ? `Scheduled move: "${reminder.moveTitle}". Tap to begin.`
    : "Your future is in progress. Complete your daily move.";

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration.showNotification as any)(title, {
        body,
        icon: "/crescive_logo.png",
        badge: "/crescive_logo.png",
        tag: `move-reminder-${reminder.id}`,
        renotify: true,
        data: {
          type: "move_reminder",
          moveId: reminder.moveId,
          url: "/?tab=moves",
        },
        vibrate: [200, 100, 200],
      });
      return;
    } catch (e) {
      console.warn("Could not display notification via service worker:", e);
    }
  }

  try {
    new Notification(title, {
      body,
      icon: "/crescive_logo.png",
      tag: `move-reminder-${reminder.id}`,
    });
  } catch (e) {
    console.warn("Could not create browser notification:", e);
  }
}
