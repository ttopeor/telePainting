import { App } from "../App";
import { ITask, TaskStatus } from "../definitions/TaskBase";
import { LogManager_Instance } from "../managers";
import { AR4RobotArm } from "../modules/AR4RobotArm";

export class Ar4EndEffector implements ITask {
  name: string = "Ar4EndEffector";
  input: number = 0;
  module: AR4RobotArm;
  constructor() {
    this.module = App.instance.getModuleByName("ar4robotarm") as AR4RobotArm;
  }

  async start(input: any): Promise<boolean> {
    this.input = input;
    return true;
  }
  async tick(): Promise<boolean> {
    LogManager_Instance.logger.debug(`Set J7 ${this.input}`);
    this.module.request("eef", this.input);
    return true;
  }
  status: TaskStatus = { total: 0, current: 0, stat: "" };
}
