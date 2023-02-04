import { ConfigDefinitions } from "../definitions/config";
import { Ar4Controller } from "../definitions/IController";

export class Ar4ConstantSpeedController implements Ar4Controller {
  constructor(private _speed: number[] = [0, 0, 0, 0, 0, 0]) {}

  configDefinitions(): ConfigDefinitions {
    return {};
  }

  start(input: any): boolean {
    if (typeof input === "object" && input.length === 6) {
      this._speed = input;
      return true;
    }
    return false;
  }

  tick(angles: number[], delta: number): number[] {
    return this._speed;
  }

  destination(): number[] {
    return [0, 0, 0, 0, 0, 0];
  }
}
