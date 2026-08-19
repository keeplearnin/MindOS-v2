'use client';

// Daily reminder scheduling.
//
// Capacitor's LocalNotifications only fires on a native build, so on the web
// the settings UI stays visible but says plainly that reminders arrive through
// the iOS app. Anything else would be promising a notification that never comes.

import { isNative } from './native';

export const REMINDER_ENABLED_KEY = 'keel_reminder_enabled';
export const REMINDER_TIME_KEY = 'keel_reminder_time'; // "HH:MM"
export const DEFAULT_REMINDER_TIME = '20:30';

const REMINDER_ID = 1001;

export function getReminderPrefs() {
  if (typeof window === 'undefined') return { enabled: false, time: DEFAULT_REMINDER_TIME };
  return {
    enabled: window.localStorage.getItem(REMINDER_ENABLED_KEY) === '1',
    time: window.localStorage.getItem(REMINDER_TIME_KEY) || DEFAULT_REMINDER_TIME,
  };
}

export function setReminderPrefs({ enabled, time }) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REMINDER_ENABLED_KEY, enabled ? '1' : '0');
  if (time) window.localStorage.setItem(REMINDER_TIME_KEY, time);
}

async function plugin() {
  if (!isNative()) return null;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    return LocalNotifications;
  } catch {
    return null;
  }
}

export async function requestReminderPermission() {
  const LN = await plugin();
  if (!LN) return 'unsupported';
  try {
    const res = await LN.requestPermissions();
    return res.display; // 'granted' | 'denied' | 'prompt'
  } catch {
    return 'denied';
  }
}

// Re-registers the single repeating reminder. Cancelling first keeps a changed
// time from leaving the previous schedule behind.
export async function scheduleDailyReminder(time) {
  const LN = await plugin();
  if (!LN) return false;
  const [hour, minute] = (time || DEFAULT_REMINDER_TIME).split(':').map(Number);
  try {
    await LN.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {});
    await LN.schedule({
      notifications: [{
        id: REMINDER_ID,
        title: 'Keel',
        body: 'How did today go? Log your habits before bed.',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      }],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyReminder() {
  const LN = await plugin();
  if (!LN) return;
  try {
    await LN.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch { /* nothing scheduled */ }
}

// Called on app start so a reminder survives reinstalls and OS-level clearing.
export async function syncReminderOnLaunch() {
  const { enabled, time } = getReminderPrefs();
  if (!enabled) return;
  const perm = await requestReminderPermission();
  if (perm === 'granted') await scheduleDailyReminder(time);
}
