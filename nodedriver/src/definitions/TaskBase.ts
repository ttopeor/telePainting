export interface TaskStatus {
  total: number;
  current: number;
  stat: string;
}

export interface ITask {
  name: string;
  start(input: any): Promise<boolean>;
  tick(): Promise<boolean>;
  status: TaskStatus;
}

export class MultiTask implements ITask {
  name = "TaskBase";
  constructor() {}
  async start(input: any) {
    return true;
  }
  async tick() {
    return true;
  }
  status = {
    total: 0,
    current: 0,
    stat: "",
  };
}
