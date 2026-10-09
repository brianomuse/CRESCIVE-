import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { MoveItem } from "../types";
import { parseDurationMinutes } from "./focusStorage";

export const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

// In-memory token cache (NEVER stored in localStorage or sessionStorage per security guidelines)
let inMemoryCalendarAccessToken: string | null = null;

// Track calendar connection status in memory & localStorage flag (flag only records whether connected, not the token!)
const CALENDAR_CONNECTED_FLAG = "crescive_gcal_connected_flag_v1";

// Listen to auth state to clear token on signout
onAuthStateChanged(auth, (user) => {
  if (!user) {
    inMemoryCalendarAccessToken = null;
    try {
      localStorage.removeItem(CALENDAR_CONNECTED_FLAG);
    } catch {
      // safe ignore
    }
  }
});

export function isGoogleCalendarConnected(): boolean {
  if (inMemoryCalendarAccessToken) return true;
  try {
    return localStorage.getItem(CALENDAR_CONNECTED_FLAG) === "true";
  } catch {
    return false;
  }
}

export function getCalendarAccessToken(): string | null {
  return inMemoryCalendarAccessToken;
}

export function setCalendarAccessToken(token: string | null) {
  inMemoryCalendarAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(CALENDAR_CONNECTED_FLAG, "true");
    } else {
      localStorage.removeItem(CALENDAR_CONNECTED_FLAG);
    }
  } catch {
    // safe ignore
  }
}

/**
 * Connect to Google Calendar via official OAuth popup flow
 */
export async function connectGoogleCalendar(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    // Create dedicated provider with calendar.events scope
    const calendarProvider = new GoogleAuthProvider();
    calendarProvider.addScope("https://www.googleapis.com/auth/calendar.events");
    calendarProvider.setCustomParameters({
      prompt: "consent",
      access_type: "offline",
    });

    const result = await signInWithPopup(auth, calendarProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error("Unable to obtain Google Calendar access token from authorization response.");
    }

    setCalendarAccessToken(credential.accessToken);
    return { success: true, token: credential.accessToken };
  } catch (error: any) {
    console.error("Google Calendar authorization error:", error);
    if (error?.code === "auth/popup-closed-by-user") {
      return { success: false, error: "Authorization was cancelled." };
    }
    return {
      success: false,
      error: error?.message || "Google Calendar connection failed.",
    };
  }
}

/**
 * Disconnect Google Calendar integration and clear in-memory tokens
 */
export function disconnectGoogleCalendar(): void {
  setCalendarAccessToken(null);
}

/**
 * Helper to ensure a valid access token exists or request authorization
 */
export async function ensureCalendarToken(): Promise<string> {
  if (inMemoryCalendarAccessToken) {
    return inMemoryCalendarAccessToken;
  }
  const res = await connectGoogleCalendar();
  if (!res.success || !res.token) {
    throw new Error(res.error || "Google Calendar authorization required.");
  }
  return res.token;
}

/**
 * Formats start and end times for Google Calendar event
 */
function calculateEventDates(move: MoveItem): { startIso: string; endIso: string; timeZone: string } {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  let baseDate = new Date();
  if (move.scheduledDate) {
    const parts = move.scheduledDate.split("-");
    if (parts.length === 3) {
      baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }

  let hours = 9;
  let minutes = 0;
  if (move.scheduledTime) {
    const timeParts = move.scheduledTime.split(":");
    if (timeParts.length >= 2) {
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
    }
  }

  const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0);
  const durationMinutes = parseDurationMinutes(move.timeCommitment) || 30;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    timeZone,
  };
}

/**
 * Creates a REAL Google Calendar event representing the CRESCIVE Move
 */
export async function createMoveCalendarEvent(move: MoveItem): Promise<{
  eventId: string;
  htmlLink: string;
}> {
  const token = await ensureCalendarToken();
  const { startIso, endIso, timeZone } = calculateEventDates(move);

  const eventPayload = {
    summary: `${move.title} [CRESCIVE Move]`,
    description: `Domain: ${move.domain}\nDuration: ${move.timeCommitment}\n${
      move.notes ? `Intention: "${move.notes}"\n` : ""
    }\nCreated and synchronized via CRESCIVE Personal Development Architecture.`,
    start: {
      dateTime: startIso,
      timeZone,
    },
    end: {
      dateTime: endIso,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "notification", minutes: 10 },
      ],
    },
  };

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, clear cached token
      disconnectGoogleCalendar();
      throw new Error("Calendar session expired. Please reconnect Google Calendar.");
    }
    const errBody = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink || `https://calendar.google.com/calendar/event?eid=${data.id}`,
  };
}

/**
 * Updates an existing Google Calendar event when a Move is modified
 */
export async function updateMoveCalendarEvent(
  eventId: string,
  move: MoveItem
): Promise<boolean> {
  const token = await ensureCalendarToken();
  const { startIso, endIso, timeZone } = calculateEventDates(move);

  const eventPayload = {
    summary: `${move.title} [CRESCIVE Move]`,
    description: `Domain: ${move.domain}\nDuration: ${move.timeCommitment}\n${
      move.notes ? `Intention: "${move.notes}"\n` : ""
    }\nUpdated in CRESCIVE.`,
    start: {
      dateTime: startIso,
      timeZone,
    },
    end: {
      dateTime: endIso,
      timeZone,
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      disconnectGoogleCalendar();
      throw new Error("Calendar session expired. Please reconnect Google Calendar.");
    }
    return false;
  }

  return true;
}

/**
 * Deletes a Google Calendar event when a Move is removed
 */
export async function deleteMoveCalendarEvent(eventId: string): Promise<boolean> {
  const token = await ensureCalendarToken();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) return true; // Already gone
    if (response.status === 401) {
      disconnectGoogleCalendar();
      throw new Error("Calendar session expired.");
    }
    return false;
  }

  return true;
}
