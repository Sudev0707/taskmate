import { TaskRepository } from '../../data/repositories/TaskRepository';
import { ShareIntentData } from '../models/ShareData';
import { TaskEntity } from '../models/TaskEntity';

export class TaskCreationUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(shareData: ShareIntentData): Promise<TaskEntity> {
    if (!shareData.url && !shareData.text && !shareData.title) {
      throw new Error('Empty share data');
    }

    const newTask: TaskEntity = {
      id: Date.now(),
      title: shareData.title || 'Shared content',
      description: shareData.url || shareData.text || '',
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(),
      priority: 'medium',
      category: 'work',
      status: 'to-do',
      colorIndex: Math.floor(Math.random() * 3),
      sourceApp: shareData.sourceApp,
      groupId: 'Inbox', // assign to default Inbox group
    };

    await this.taskRepository.saveTask(newTask);
    return newTask;
  }
}
