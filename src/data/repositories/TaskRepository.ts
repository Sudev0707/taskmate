import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptObject, decryptObject } from '../../utils/security';
import { TaskEntity } from '../../domain/models/TaskEntity';

const TASKS_STORAGE_KEY = '@myapp_tasks_data';

export class TaskRepository {
  async getTasks(): Promise<TaskEntity[]> {
    try {
      const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (!data) return [];
      const decrypted = decryptObject(data);
      if (decrypted) {
        return decrypted.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          startDate: t.startDate ? new Date(t.startDate) : undefined,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        }));
      }
      return JSON.parse(data).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        startDate: t.startDate ? new Date(t.startDate) : undefined,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      }));
    } catch (e) {
      console.error('Failed to get tasks', e);
      return [];
    }
  }

  async saveTask(task: TaskEntity): Promise<void> {
    const tasks = await this.getTasks();
    const isDuplicate = tasks.some(
      t => t.description === task.description && t.title === task.title,
    );
    if (isDuplicate) {
      throw new Error('Duplicate task');
    }
    const updatedTasks = [task, ...tasks];
    const encrypted = encryptObject(updatedTasks);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, encrypted);
  }
}
