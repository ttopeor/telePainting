import { ConfigDefinitions, ConfigType } from "../definitions/config";
import { Ar4Controller } from "../definitions/IController";
import nj from "numjs";
import { ConfigManager_Instance } from "../managers";
import { clamp, cloneDeep } from "lodash";

export class Ar4TrajectoryController implements Ar4Controller {
  _destination: number[] = [0, 0, 0, 0, 0, 0];

  start(input: any): boolean {
    this._destination = input;

    return true;
  }

  tick(angles: number[], delta: number): number[] {
    const curr = nj.array(cloneDeep(angles));
    const dest = nj.array(this._destination);
    const Ps = nj.array(ConfigManager_Instance.getControllerConfig(this).P);
    const Ds = nj.array(ConfigManager_Instance.getControllerConfig(this).D);
    const errors = dest.subtract(curr);
    const ratedErrors = errors.divide(delta);
    const pEffort = errors.multiply(Ps);
    const dEffort = ratedErrors.multiply(Ds);

    const res = pEffort
      .add(dEffort)
      .tolist()
      .map((sp) => clamp(sp, -3000, 3000));

    return res;
  }

  destination(): number[] {
    return this._destination;
  }

  configDefinitions(): ConfigDefinitions {
    return {
      P: {
        type: ConfigType.JOINT_VALUES,
        default: [200, 200, 200, 200, 150, 200],
      },
      D: {
        type: ConfigType.JOINT_VALUES,
        default: [0, 0, 0, 0, 0, 0],
      },
    };
  }
}
