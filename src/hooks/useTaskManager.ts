import { useState, useCallback, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NewTaskData } from '../components/AddTaskBottomSheet';
import { encryptObject, decryptObject } from '../utils/security';
import { scheduleTaskReminder } from '../services/NotificationService';

const TASKS_STORAGE_KEY = '@myapp_tasks_data';

const STATUS_ORDER = ['to-do', 'in-progress', 'completed'] as const;
type TaskStatus = (typeof STATUS_ORDER)[number];

/** Returns 9:00 AM the next calendar day */
const getTomorrow = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
};

export function useTaskManager() {
  const [tasks, setTasks] = useState<any[]>([]);

  // Initial load on mount
  useEffect(() => {
    loadTasks();
    const sub = DeviceEventEmitter.addListener('onTaskCreatedFromShare', () => {
      loadTasks();
    });
    return () => sub.remove();
  }, []);

  // Reload tasks whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, []),
  );

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        let parsed: any[];

        // Try to decrypt. If it fails or returns null, it might be unencrypted legacy data.
        const decrypted = decryptObject(storedTasks);
        if (decrypted) {
          parsed = decrypted;
        } else {
          // Fallback to direct parsing for legacy non-encrypted data
          try {
            parsed = JSON.parse(storedTasks);
            console.log(
              'Loaded unencrypted legacy data, will encrypt on next save',
            );
          } catch (e) {
            console.error('Failed to parse tasks', e);
            parsed = [];
          }
        }

        let migrated = false;
        // Reconstruct Date objects after JSON parse
        const formattedTasks = parsed.map((t: any) => {
          let tColorIndex = t.colorIndex;
          if (tColorIndex === undefined) {
            tColorIndex = Math.floor(Math.random() * 3);
            migrated = true;
          }
          return {
            ...t,
            colorIndex: tColorIndex,
            dueDate: new Date(t.dueDate),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          };
        });

        // Auto-cleanup: remove completed tasks from previous days
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const initialCount = formattedTasks.length;
        const cleanedTasks = formattedTasks.filter(t => {
          if (t.status === 'completed' || t.isCompleted) {
            const completedDate = new Date(t.updatedAt);
            return completedDate >= startOfToday;
          }
          return true;
        });

        const cleaned = cleanedTasks.length !== initialCount;

        // Sort by newest first
        cleanedTasks.sort(
          (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime(),
        );

        // If migrated, loaded unencrypted, or tasks were cleaned, save as encrypted
        if (migrated || !decrypted || cleaned) {
          const encrypted = encryptObject(cleanedTasks);
          await AsyncStorage.setItem(TASKS_STORAGE_KEY, encrypted);
        }

        setTasks(cleanedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to load tasks', error);
      setTasks([]);
    }
  };

  const saveNewTask = async (data: NewTaskData, onSuccess?: () => void) => {
    const newTask = {
      id: Date.now(),
      title: data.title,
      description: data.description,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: data.priority,
      category: 'work',
      status: data.status,
      dueDate: data.dueDate,
      tag: data.tag,
      colorIndex: Math.floor(Math.random() * 3),
    };

    setTasks(prev => {
      const updatedTasks = [newTask, ...prev];
      try {
        const enc = encryptObject(updatedTasks);
        AsyncStorage.setItem(TASKS_STORAGE_KEY, enc).catch(err =>
          console.error('Failed to save task', err),
        );
      } catch (err) {
        console.error('Failed to encrypt task', err);
      }
      return updatedTasks;
    });

    // Auto-schedule a local reminder if the task has a future due date
    if (data.dueDate && data.dueDate.getTime() > Date.now()) {
      scheduleTaskReminder(data.title, data.dueDate.getTime()).catch(err =>
        console.error(
          '[useTaskManager] Failed to schedule task reminder:',
          err,
        ),
      );
    }

    onSuccess?.();
  };

  const deleteTask = async (
    taskId: number,
    onTaskDeleted?: (id: number) => void,
  ) => {
    setTasks(prev => {
      const filteredTasks = prev.filter(t => t.id !== taskId);
      try {
        const enc = encryptObject(filteredTasks);
        AsyncStorage.setItem(TASKS_STORAGE_KEY, enc).catch(err =>
          console.error('Failed to save task', err),
        );
      } catch (err) {
        console.error('Failed to encrypt task', err);
      }
      return filteredTasks;
    });
    onTaskDeleted?.(taskId);
  };

  const toggleTaskComplete = async (
    taskId: number,
    onToggled?: (id: number) => void,
  ) => {
    setTasks(prev => {
      const updatedTasks = prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            isCompleted: true,
            status: 'completed',
            updatedAt: new Date(),
          };
        }
        return t;
      });
      try {
        const enc = encryptObject(updatedTasks);
        AsyncStorage.setItem(TASKS_STORAGE_KEY, enc).catch(err =>
          console.error('Failed to save task', err),
        );
      } catch (err) {
        console.error('Failed to encrypt task', err);
      }
      return updatedTasks;
    });
    onToggled?.(taskId);
  };

  /** Generic setter: update status (and optionally dueDate) for any task */
  const setTaskStatus = async (
    taskId: number,
    newStatus: TaskStatus,
    newDueDate?: Date,
    onDone?: () => void,
  ) => {
    setTasks(prev => {
      const updatedTasks = prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            isCompleted: newStatus === 'completed',
            dueDate: newDueDate ?? t.dueDate,
            updatedAt: new Date(),
          };
        }
        return t;
      });
      try {
        const enc = encryptObject(updatedTasks);
        AsyncStorage.setItem(TASKS_STORAGE_KEY, enc).catch(err =>
          console.error('Failed to save task', err),
        );
      } catch (err) {
        console.error('Failed to encrypt task', err);
      }
      return updatedTasks;
    });
    onDone?.();
  };

  /** Cycles: to-do → in-progress → completed → to-do (tomorrow) */
  const advanceTaskStatus = async (
    taskId: number,
    onAdvanced?: (id: number, nextStatus: TaskStatus) => void,
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let nextStatus: TaskStatus;
    let nextDueDate: Date | undefined;

    if (task.status === 'completed') {
      nextStatus = 'to-do';
      nextDueDate = getTomorrow();
    } else {
      const idx = STATUS_ORDER.indexOf(task.status as TaskStatus);
      nextStatus = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
    }

    await setTaskStatus(taskId, nextStatus, nextDueDate, () =>
      onAdvanced?.(taskId, nextStatus),
    );
  };

  const updateTask = async (
    taskId: number,
    updates: Partial<any>,
    onUpdated?: () => void
  ) => {
    setTasks(prev => {
      const updatedTasks = prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            ...updates,
            updatedAt: new Date(),
          };
        }
        return t;
      });
      try {
        const enc = encryptObject(updatedTasks);
        AsyncStorage.setItem(TASKS_STORAGE_KEY, enc).catch(err =>
          console.error('Failed to save task', err),
        );
      } catch (err) {
        console.error('Failed to encrypt task', err);
      }
      return updatedTasks;
    });
    onUpdated?.();
  };

  // Derived counts
  const todoCount = tasks.filter(t => t.status === 'to-do').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return {
    tasks,
    todoCount,
    inProgressCount,
    completedCount,
    saveNewTask,
    deleteTask,
    toggleTaskComplete,
    advanceTaskStatus,
    setTaskStatus,
    updateTask,
    getTomorrow,
  };
}
