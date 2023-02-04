import create from 'zustand';

export interface TaskStatus {
  runningTask: string;
  status: {
    total: number;
    current: number;
    stat: string;
  };
}

export interface TaskStore {
  status: TaskStatus;
  updateStatus(newStatus: Partial<TaskStatus>): void;
}

export const useTaskStatus = create<TaskStore>((set, get) => ({
  status: {
    runningTask: 'NO_TASK',
    status: { total: 0, current: 0, stat: '' },
  },
  updateStatus: (newStatus: Partial<TaskStatus>) =>
    set((old) => ({ ...old, status: { ...old.status, ...newStatus } })),
}));
