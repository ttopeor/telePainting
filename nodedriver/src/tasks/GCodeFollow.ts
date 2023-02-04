import { join } from "path";
import { ITask } from "../definitions/TaskBase";
import { Environment } from "../Environment";
import { ensureExists, objectToString } from "../utils";
//@ts-ignore
import * as parser from "gcode-parser";
import { LogManager_Instance, PlanManager_Instance } from "../managers";
import { JointTrajectory, Pose, TrajectoryFollow } from "./TrajectoryFollow";
import _ from "lodash";
import { App } from "../App";
import { AR4RobotArm } from "../modules/AR4RobotArm";

const data_path = join(Environment.dataPath, "gcode");
ensureExists(data_path);

const EEF_DOWN_ORIENTATION = {
  x: -0.7071068,
  y: -0.7071068,
  z: 0,
  w: 0,
};

const ZERO_POS = [0, 0.426, 0.25];

export interface GCodeLine {
  line: string;
  words: [string, number][];
}

export class GCodeFollow implements ITask {
  name: string = "GCodeFollow";
  fileName: string = "";

  codes: GCodeLine[] = [];
  current = -1;

  subTask: TrajectoryFollow | null = null;

  lastPos = _.clone(ZERO_POS);

  async start(input: any): Promise<boolean> {
    this.fileName = input;
    return new Promise((resolve) => {
      const file_path = join(data_path, input);
      parser.parseFile(file_path, async (err: any, results: GCodeLine[]) => {
        if (!!err) {
          LogManager_Instance.logger.warn(
            `Failed to parse GCode file: ${input}`
          );
          resolve(false);
        } else {
          this.codes = results.filter((l) => l.words.length > 0);
          this.current = -1;
          this.lastPos = _.clone(ZERO_POS);
          resolve(true);
        }
      });
    });
  }

  async tick(): Promise<boolean> {
    if (this.subTask) {
      const res = await this.subTask?.tick();
      if (!res) {
        return false;
      } else {
        this.subTask = null;
      }
    }

    this.current += 1;
    if (this.current >= this.codes.length) {
      return true;
    }

    const line = this.codes[this.current];
    LogManager_Instance.logger.debug(`Execute GCode: ${line.line}`);
    if (
      line.words[0][0] === "G" &&
      [0, 1].includes(line.words[0][1]) &&
      this.isMove(line.words.slice(1))
    ) {
      this.lastPos = this.calculateNext(this.lastPos, line.words.slice(1));
      const destination = {
        position: {
          x: this.lastPos[0],
          y: this.lastPos[1],
          z: this.lastPos[2],
        },
        orientation: EEF_DOWN_ORIENTATION,
      };
      LogManager_Instance.logger.debug(
        `[GCODE] move to ${objectToString(destination.position)}`
      );
      const traj = await PlanManager_Instance.planWithMoveit([destination]);
      this.subTask = new TrajectoryFollow();
      await this.subTask.start(traj);
    } else if (line.words[0][0] === "M") {
      const lightStatus = line.words[0][1] === 3;
      const ar4Module = App.instance.getModuleByName(
        "ar4robotarm"
      ) as AR4RobotArm;
      if (!!ar4Module) {
        LogManager_Instance.logger.debug(`[GCODE] set J7 ${lightStatus}`);
        ar4Module.sendEndeffetor(lightStatus ? 1 : 0);
      }
    }
    return false;
  }

  isMove(words: [string, number][]) {
    const commands = words.map((w) => w[0]);
    for (const c of commands) {
      if (["X", "Y", "Z"].includes(c)) {
        return true;
      }
    }
    return false;
  }

  calculateNext(lastPos: number[], words: [string, number][]): number[] {
    const res = _.clone(lastPos);
    for (const word of words) {
      const value = (word[1] / 1000) as number;
      if (word[0] === "X") {
        res[0] = value + ZERO_POS[0];
      }
      if (word[0] === "Y") {
        res[1] = value + ZERO_POS[1];
      }
      if (word[0] === "Z") {
        res[2] = value + ZERO_POS[2];
      }
    }
    return res;
  }

  get status() {
    return {
      total: this.codes.length,
      current: this.current + 1,
      stat: this.fileName,
    };
  }
}
