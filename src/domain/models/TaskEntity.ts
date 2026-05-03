export interface Subtask {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface TaskEntity {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  priority: string;
  category: string;
  status: string;
  startDate?: Date;
  dueDate?: Date;
  tag?: string;
  colorIndex: number;
  sourceApp?: string;
  groupId?: string;
  subtasks?: Subtask[];
}
