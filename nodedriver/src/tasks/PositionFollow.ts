import { App } from "../App";
import { ITask } from "../definitions/TaskBase";
import { LogManager_Instance } from "../managers";
import { AR4RobotArm } from "../modules/AR4RobotArm";
import { radToDegree } from "../utils/math";

export class PositionFollow implements ITask {
  name = "PositionFollow";
  points: number[][] = [];
  total: number = 0;
  module: AR4RobotArm;
  current: number = -1;
  lastUpdate: number = 0;
  constructor() {
    this.module = App.instance.getModuleByName("ar4robotarm")! as AR4RobotArm;
  }

  async start(points: number[][]) {
    if (points.length > 0) {
      this.points = points;
      this.total = points.length;
      this.current = -1;
      this.lastUpdate = 0;
      return true;
    } else {
      return false;
    }
  }

  async tick() {
    const dt = Date.now() - this.lastUpdate;
    if (dt > 100) {
      this.lastUpdate = Date.now();
      let newIdx = this.current + 1;
      newIdx = Math.min(this.total - 1, newIdx);
      if (newIdx !== this.current) {
        this.current = newIdx;
        LogManager_Instance.logger.debug(
          `Position follow ${newIdx + 1} / ${this.total}`
        );
        App.instance.request(
          "ar4robotarm",
          "Ar4TrajectoryController",
          this.points[newIdx]
        );
      }
    }

    return this.current === this.total - 1;
  }

  get status() {
    return {
      total: this.total,
      current: this.current + 1,
      stat: "",
    };
  }
}
