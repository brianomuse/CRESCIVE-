/**
 * Official Android System Alarm Clock Integration Service
 * Uses official Android AlarmClock Intent: android.intent.action.SET_ALARM
 * Compliant with Android specifications and web/PWA standards.
 */

export interface AndroidAlarmResult {
  success: boolean;
  platform: "android" | "web" | "desktop" | "ios";
  message: string;
  intentUri?: string;
}

/**
 * Detects if the client is running on an Android device (via browser or installed PWA)
 */
export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Parses a time string (e.g., "18:30" or "09:15") into hour (0-23) and minute (0-59)
 */
export function parseHourAndMinute(timeStr?: string): { hour: number; minute: number } {
  if (!timeStr) {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    return { hour: nextHour.getHours(), minute: 0 };
  }

  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (!isNaN(hour) && !isNaN(minute)) {
      return {
        hour: Math.max(0, Math.min(23, hour)),
        minute: Math.max(0, Math.min(59, minute)),
      };
    }
  }

  return { hour: 9, minute: 0 };
}

/**
 * Maps repeatSchedule to Android Calendar day integers:
 * Calendar.SUNDAY = 1, MONDAY = 2, TUESDAY = 3, WEDNESDAY = 4, THURSDAY = 5, FRIDAY = 6, SATURDAY = 7
 */
export function getAndroidRepeatDays(repeatSchedule?: string): number[] | undefined {
  if (!repeatSchedule || repeatSchedule === "none") return undefined;

  if (repeatSchedule === "daily") {
    return [1, 2, 3, 4, 5, 6, 7];
  }
  if (repeatSchedule === "weekdays") {
    return [2, 3, 4, 5, 6];
  }
  if (repeatSchedule === "weekly") {
    // Current day of week
    const currentDay = new Date().getDay() + 1; // JS 0-6 to Calendar 1-7
    return [currentDay];
  }
  return undefined;
}

/**
 * Launches the official Android Alarm Clock action using the standard Android Intent.
 * On Android devices, this launches the native Clock application directly to set
 * an actual system-level alarm with the Move title and time.
 * On non-Android platforms, provides honest, transparent capability status without simulation.
 */
export function triggerAndroidSystemAlarm(
  moveTitle: string,
  scheduledTime: string,
  repeatSchedule?: string
): AndroidAlarmResult {
  const onAndroid = isAndroidDevice();
  const { hour, minute } = parseHourAndMinute(scheduledTime);
  const cleanTitle = `CRESCIVE: ${moveTitle.trim()}`;

  if (!onAndroid) {
    // Truthful report: do not fake alarm on non-Android devices
    let platformName: "desktop" | "ios" | "web" = "desktop";
    if (typeof navigator !== "undefined") {
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        platformName = "ios";
      } else if (!/mac|win|linux/i.test(navigator.userAgent)) {
        platformName = "web";
      }
    }

    return {
      success: false,
      platform: platformName,
      message:
        "The Real Android Alarm Clock integration connects directly to the Android System Clock app on Android devices. On this device, please use Google Calendar integration or CRESCIVE precise reminders.",
    };
  }

  // Construct official Android Intent URI for AlarmClock.ACTION_SET_ALARM
  // Format:
  // intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.HOUR=HH;i.android.intent.extra.MINUTES=MM;S.android.intent.extra.MESSAGE=MSG;B.android.intent.extra.SKIP_UI=false;end
  const repeatDays = getAndroidRepeatDays(repeatSchedule);
  let daysParam = "";
  if (repeatDays && repeatDays.length > 0) {
    // Optional days parameter for Android AlarmClock
    daysParam = `;a.android.intent.extra.DAYS=i,${repeatDays.join(",")}`;
  }

  const intentUri = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.HOUR=${hour};i.android.intent.extra.MINUTES=${minute};S.android.intent.extra.MESSAGE=${encodeURIComponent(
    cleanTitle
  )};B.android.intent.extra.SKIP_UI=false${daysParam};end`;

  try {
    // Dispatch intent to native Android OS Clock app
    const link = document.createElement("a");
    link.href = intentUri;
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    document.body.appendChild(link);
    link.click();
    link.remove();

    return {
      success: true,
      platform: "android",
      message: `Opened Android Clock to set alarm for ${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}.`,
      intentUri,
    };
  } catch (err: any) {
    console.error("Failed to dispatch Android Alarm Intent:", err);
    return {
      success: false,
      platform: "android",
      message: "Could not launch Android Clock app. Please ensure a system Clock app is installed.",
    };
  }
}
