/**
 * NotificationService.ts
 *
 * Centralised, offline-first notification layer for TaskMate.
 * Uses @notifee/react-native for Android local notifications.
 *
 * Exposes:
 *   createNotificationChannel()
 *   requestNotificationPermission()
 *   showTaskCreatedNotification(taskTitle)
 *   scheduleTaskReminder(taskTitle, timestamp)
 *   showFocusCompleteNotification(taskTitle)
 *   scheduleDailyStreakReminder()
 */

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  TimestampTrigger,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Platform } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_ID = 'TaskMate_main';
const CHANNEL_NAME = 'TaskMate Notifications';

/** Fixed ID for the ongoing focus-timer notification so we can update it in place. */
const FOCUS_NOTIF_ID = 'TaskMate_focus_timer';

/** Internal flag — avoids duplicate channel creation calls. */
let channelCreated = false;

// ─── Channel ──────────────────────────────────────────────────────────────────

/**
 * Creates the primary Android notification channel.
 * Safe to call multiple times — Notifee is idempotent.
 * Must be called before any notification is displayed (call from App.tsx on mount).
 */
export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibration: true,
      sound: 'default',
    });
    channelCreated = true;
  } catch (error) {
    console.error('[NotificationService] Failed to create channel:', error);
  }
}

/**
 * Internal helper — ensures the channel exists before any notification fires.
 * Handles the race condition where a notification is triggered before
 * App.tsx's useEffect has finished calling createNotificationChannel().
 */
async function ensureChannel(): Promise<void> {
  if (!channelCreated) {
    await createNotificationChannel();
  }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * Requests notification permission on Android 13+ (API 33+).
 * On older Android versions this is a no-op (permission is granted by default).
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('[NotificationService] Permission request failed:', error);
    return false;
  }
}

// ─── Instant Notifications ───────────────────────────────────────────────────

/**
 * Fires an immediate notification confirming a new task was created.
 *
 * Example:
 *   Title: "Task Created ✅"
 *   Body:  "Finish UI design"
 */
export async function showTaskCreatedNotification(
  taskTitle: string,
): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await ensureChannel();
    await notifee.displayNotification({
      title: 'Task Created ✅',
      body: taskTitle,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
  } catch (error) {
    console.error(
      '[NotificationService] showTaskCreatedNotification failed:',
      error,
    );
  }
}

/**
 * Fires an immediate notification when a focus / Pomodoro session completes.
 *
 * Example:
 *   Title: "Focus Session Complete 🎉"
 *   Body:  "Great work on 'Design Landing Page'"
 */
export async function showFocusCompleteNotification(
  taskTitle: string,
): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await ensureChannel();
    // Cancel the live timer notification first
    await notifee.cancelNotification(FOCUS_NOTIF_ID);
    await notifee.displayNotification({
      title: 'Focus Session Complete 🎉',
      body: `Great work on '${taskTitle}'`,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        ongoing: false,
        autoCancel: true,
      },
    });
  } catch (error) {
    console.error(
      '[NotificationService] showFocusCompleteNotification failed:',
      error,
    );
  }
}

// ─── Focus Session Notifications (Active badge + Scheduled completion) ────────

/** Fixed ID for the ongoing "session active" badge notification. */
const FOCUS_ACTIVE_ID = 'TaskMate_focus_active';
/** Fixed ID for the scheduled completion trigger — fires even if app is killed. */
const FOCUS_DONE_TRIGGER_ID = 'TaskMate_focus_done';

/**
 * Shows a persistent badge notification: "Focus Session Active 🎯 — {taskTitle}".
 * `ongoing: true` means Android pins it in the notification tray while running.
 * Calling again with `isPaused: true` flips it to a dismissible paused state.
 *
 * @param taskTitle - Task the user is focusing on.
 * @param isPaused  - Pass true when the timer is paused.
 */
export async function showActiveFocusNotification(
  taskTitle: string,
  isPaused: boolean = false,
): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await ensureChannel();
    await notifee.displayNotification({
      id: FOCUS_ACTIVE_ID,
      title: isPaused ? '⏸ Focus Session Paused' : '🎯 Focus Session Active',
      body: isPaused
        ? `Paused — '${taskTitle}'`
        : `Stay focused on '${taskTitle}'`,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        ongoing: !isPaused, // pinned while running, dismissible while paused
        onlyAlertOnce: true, // no sound/vibration on state updates
        pressAction: { id: 'default' },
      },
    });
  } catch (error) {
    console.error(
      '[NotificationService] showActiveFocusNotification failed:',
      error,
    );
  }
}

/**
 * Cancels the "session active" badge notification.
 * Call on reset, manual stop, or when the session completes inside the app.
 */
export async function cancelActiveFocusNotification(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.cancelNotification(FOCUS_ACTIVE_ID);
  } catch (error) {
    console.error(
      '[NotificationService] cancelActiveFocusNotification failed:',
      error,
    );
  }
}

/**
 * Schedules a completion notification via TimestampTrigger to fire at `endTimestamp`.
 * Because it is a Notifee alarm-manager trigger, it fires even if the app is
 * completely closed or killed — guaranteed offline delivery.
 *
 * Call this as soon as the timer starts (or resumes after a pause).
 * Cancel it (cancelScheduledFocusCompletion) whenever the timer is paused or
 * manually stopped so it doesn't fire prematurely.
 *
 * @param taskTitle    - Task title shown in the completion notification.
 * @param endTimestamp - Unix timestamp in **milliseconds** when the session ends.
 */
export async function scheduleFocusCompletionNotification(
  taskTitle: string,
  endTimestamp: number,
): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (endTimestamp <= Date.now()) return; // already elapsed — skip

  try {
    await ensureChannel();
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: endTimestamp,
      alarmManager: { allowWhileIdle: true },
    };

    await notifee.createTriggerNotification(
      {
        id: FOCUS_DONE_TRIGGER_ID,
        title: 'Focus Session Complete 🎉',
        body: `Great work on '${taskTitle}'!`,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
          autoCancel: true,
        },
      },
      trigger,
    );
  } catch (error) {
    console.error(
      '[NotificationService] scheduleFocusCompletionNotification failed:',
      error,
    );
  }
}

/**
 * Cancels the scheduled completion trigger.
 * Call when: the timer is paused (reschedule on resume), manually reset/skipped,
 * or when the session completes inside the app and you show the instant version.
 */
export async function cancelScheduledFocusCompletion(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.cancelTriggerNotification(FOCUS_DONE_TRIGGER_ID);
  } catch (error) {
    console.error(
      '[NotificationService] cancelScheduledFocusCompletion failed:',
      error,
    );
  }
}

// ─── Legacy stubs kept for import compatibility ───────────────────────────────
// These are no-ops now. Remove call-sites progressively.
export async function startFocusTimerNotification(): Promise<void> {}
export async function updateFocusTimerNotification(): Promise<void> {}
export async function cancelFocusTimerNotification(): Promise<void> {
  await cancelActiveFocusNotification();
  await cancelScheduledFocusCompletion();
}

// ─── Scheduled / Trigger Notifications ───────────────────────────────────────

/**
 * Schedules a task reminder to fire at a specific Unix timestamp (ms).
 * Uses Notifee TimestampTrigger — works completely offline.
 *
 * Example (fires at dueDate):
 *   Title: "Task Reminder ⏰"
 *   Body:  "Finish UI design"
 *
 * @param taskTitle  - The task title to display.
 * @param timestamp  - Unix timestamp in **milliseconds** when the reminder fires.
 * @returns The Notifee notification ID (can be used to cancel later).
 */
export async function scheduleTaskReminder(
  taskTitle: string,
  timestamp: number,
): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  // Guard: do not schedule reminders in the past
  if (timestamp <= Date.now()) {
    console.warn(
      '[NotificationService] scheduleTaskReminder: timestamp is in the past, skipping.',
    );
    return null;
  }

  try {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      // Alarm manager (exact) is preferred for task reminders — requires
      // SCHEDULE_EXACT_ALARM permission on Android 12+.
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    const notifId = await notifee.createTriggerNotification(
      {
        title: 'Task Reminder ⏰',
        body: taskTitle,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
      },
      trigger,
    );

    return notifId;
  } catch (error) {
    console.error('[NotificationService] scheduleTaskReminder failed:', error);
    return null;
  }
}

/**
 * Schedules a daily streak reminder at 8:00 PM today.
 * If 8:00 PM has already passed today, the reminder is scheduled for tomorrow.
 *
 * Example:
 *   Title: "Keep your streak alive 🔥"
 *   Body:  "Complete your tasks today and keep climbing!"
 *
 * @returns The Notifee notification ID.
 */
export async function scheduleDailyStreakReminder(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  try {
    const now = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0); // 8:00 PM

    // If 8 PM today has already passed, schedule for 8 PM tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: target.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    const notifId = await notifee.createTriggerNotification(
      {
        title: 'Keep your streak alive 🔥',
        body: 'Complete your tasks today and keep climbing!',
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
      },
      trigger,
    );

    return notifId;
  } catch (error) {
    console.error(
      '[NotificationService] scheduleDailyStreakReminder failed:',
      error,
    );
    return null;
  }
}

/**
 * Cancels a previously scheduled or displayed notification by its ID.
 * Safe to call even if the notification has already fired or been dismissed.
 */
export async function cancelNotification(notifId: string): Promise<void> {
  try {
    await notifee.cancelNotification(notifId);
  } catch (error) {
    console.error('[NotificationService] cancelNotification failed:', error);
  }
}

/**
 * Cancels ALL pending trigger notifications (scheduled reminders).
 * Useful for clearing stale reminders when tasks are deleted or completed.
 */
export async function cancelAllTriggerNotifications(): Promise<void> {
  try {
    await notifee.cancelTriggerNotifications();
  } catch (error) {
    console.error(
      '[NotificationService] cancelAllTriggerNotifications failed:',
      error,
    );
  }
}
