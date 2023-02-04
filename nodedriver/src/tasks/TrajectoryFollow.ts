import _ from "lodash";
import { App } from "../App";
import { ITask } from "../definitions/TaskBase";
import { LogManager_Instance } from "../managers";
import { AR4RobotArm } from "../modules/AR4RobotArm";
import { radToDegree } from "../utils/math";

export interface JointTrajectory {
  positions: number[];
  time_from_start: { nsecs: number; secs: number };
  velocities: number[];
  accelerations: number[];
  J7?: number;
}

export interface Pose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

function RosTimeToMs(time_from_start: { nsecs: number; secs: number }): number {
  return time_from_start.nsecs / 1e6 + time_from_start.secs * 1000;
}

export class TrajectoryFollow implements ITask {
  name = "TrajectoryFollow";
  points: JointTrajectory[] = [];
  total: number = 0;
  module: AR4RobotArm;
  current: number = -1;
  startTime: number = 0;
  constructor() {
    this.module = App.instance.getModuleByName("ar4robotarm")! as AR4RobotArm;
  }

  async start(points: JointTrajectory[]) {
    if (points.length > 0) {
      this.points = points;
      this.total = points.length;
      this.current = -1;
      this.startTime = Date.now();
      return true;
    } else {
      return false;
    }
  }

  async tick() {
    let newIdx = Math.max(this.current, 0);
    newIdx = Math.min(this.total - 1, newIdx);
    const timeElasped = Date.now() - this.startTime;
    while (
      RosTimeToMs(this.points[newIdx].time_from_start) < timeElasped &&
      newIdx < this.total - 1
    ) {
      newIdx++;
    }

    if (newIdx !== this.current) {
      this.current = newIdx;
      LogManager_Instance.logger.debug(
        `Trajectory follow ${newIdx + 1} / ${this.total}`
      );
      App.instance.request(
        "ar4robotarm",
        "Ar4TrajectoryController",
        this.points[newIdx].positions.map(radToDegree)
      );
    }
    if (this.current === this.total - 1) {
      const destination = this.module.destination;
      const current = this.module.angles;
      const diff = _.clone(destination).reduce(
        (k, c, i) => k + Math.abs(c - current[i]),
        0
      );
      return diff < 1;
    } else {
      return false;
    }
  }

  get status() {
    return {
      total: this.total,
      current: this.current + 1,
      stat: "",
    };
  }
}
