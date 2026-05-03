import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptObject, decryptObject } from '../utils/security';

const STREAK_LOG_KEY = '@myapp_streak_log';

// ─── Types ────────────────────────────────────────────────────────────────────
export type DayRecord = {
  date: string; // 'YYYY-MM-DD'
  total: number;
  completed: number;
};

export type StreakLog = Record<string, DayRecord>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const toDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const computeStreak = (log: StreakLog): number => {
  let streak = 0;
  const cursor = new Date();
  // Start from yesterday — today is not "over" yet, so doesn't count yet
  cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const key = toDateKey(cursor);
    const record = log[key];
    // Day had tasks AND all were completed → streak continues
    if (record && record.total > 0 && record.completed >= record.total) {
      streak++;
    } else {
      // Day with tasks that weren't completed → break
      // Days with NO tasks are skipped (don't break streak)
      if (record && record.total > 0) break;
      // No tasks that day → don't break, but also don't count — keep walking back
      if (!record && i > 0) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // Also check if TODAY is already fully done — add 1 to streak
  const todayKey = toDateKey(new Date());
  const todayRecord = log[todayKey];
  if (
    todayRecord &&
    todayRecord.total > 0 &&
    todayRecord.completed >= todayRecord.total
  ) {
    streak += 1;
  }

  return streak;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStreak(tasks: any[]) {
  const [log, setLog] = useState<StreakLog>({});
  const [currentStreak, setCurrentStreak] = useState(0);

  // Load persisted log on mount
  useEffect(() => {
    AsyncStorage.getItem(STREAK_LOG_KEY).then(raw => {
      if (raw) {
        let parsed: StreakLog | null = decryptObject(raw);
        if (!parsed) {
          try {
            parsed = JSON.parse(raw) as StreakLog;
          } catch {
            parsed = null;
          }
        }

        if (parsed) {
          setLog(parsed);
          setCurrentStreak(computeStreak(parsed));
        }
      }
    });
  }, []);

  // Re-compute today's record whenever tasks change
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const todayKey = toDateKey(new Date());

    // All tasks whose dueDate falls on today
    const todayTasks = tasks.filter(t => {
      try {
        const d = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
        return toDateKey(d) === todayKey;
      } catch {
        return false;
      }
    });

    if (todayTasks.length === 0) return;

    const total = todayTasks.length;
    const completed = todayTasks.filter(
      t => t.status === 'completed' || t.isCompleted,
    ).length;

    setLog(prev => {
      // Only update if data actually changed
      const existing = prev[todayKey];
      if (existing?.total === total && existing?.completed === completed)
        return prev;

      const updated: StreakLog = {
        ...prev,
        [todayKey]: { date: todayKey, total, completed },
      };

      // Persist async with encryption
      const encrypted = encryptObject(updated);
      AsyncStorage.setItem(STREAK_LOG_KEY, encrypted).catch(() => {});
      setCurrentStreak(computeStreak(updated));
      return updated;
    });
  }, [tasks]);

  return { currentStreak, log };
}
