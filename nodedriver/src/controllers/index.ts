// This file is auto generated, DO NOT modify yourself
// Use 'yarn gen' to auto generate
import { App } from '../App';

import { Ar4ConstantSpeedController } from './Ar4ConstantSpeedController';
import { Ar4TrajectoryController } from './Ar4TrajectoryController';

export function registerController(mainProc: App): void {
  mainProc.addController(new Ar4ConstantSpeedController());
  mainProc.addController(new Ar4TrajectoryController());
}
