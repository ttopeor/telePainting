import { LogManager_Instance } from ".";
import { App } from "../App";
import { ITask } from "../definitions/TaskBase";
import { objectToString } from "../utils";

export class TaskManager {
  task: ITask | null;
  constructor() {
    this.task = null;
    this.tick = this.tick.bind(this);
  }

  get running(): boolean {
    return !!this.task;
  }

  public start() {
    setTimeout(this.tick);
  }

  public async runTask(taskName: string, input: any) {
    const Cls = App.instance.taskClass[taskName];
    if (!!Cls) {
      const task = new Cls();
      LogManager_Instance.logger.info(`Task [${taskName}] start`);
      const success = await task.start(input);
      if (success) {
        this.task = task;
        return true;
      } else {
        LogManager_Instance.logger.warn(
          `Failed to start task: [${taskName}] with input: ${objectToString(
            input
          )}`
        );
        return false;
      }
    } else {
      LogManager_Instance.logger.warn(`Failed to find task: [${taskName}]`);
      return false;
    }
  }
  async tick(): Promise<void> {
    if (!!this.task) {
      const res = await this.task.tick();
      if (res) {
        LogManager_Instance.logger.info(`Task [${this.task.name}] complete!`);
        this.task = null;
      }
      setTimeout(this.tick);
    } else {
      setTimeout(this.tick, 10);
    }
  }

  killTask() {
    if (!!this.task) {
      LogManager_Instance.logger.info(`Task [${this.task.name}] was killed`);
      this.task = null;
    }
  }
  get runningTaskName(): string {
    return !!this.task ? this.task.name : "NO_TASK";
  }
  get status() {
    if (!!this.task) {
      return { runningTask: this.runningTaskName, status: this.task.status };
    } else {
      return {
        runningTask: this.runningTaskName,
        status: { total: 0, current: 0, stat: "" },
      };
    }
  }
}
