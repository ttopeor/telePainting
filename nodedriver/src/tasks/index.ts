// This file is auto generated, DO NOT modify yourself
// Use 'yarn gen' to auto generate
import { App } from '../App';

import { Ar4EndEffector } from './Ar4EndEffector';
import { GCodeFollow } from './GCodeFollow';
import { PositionFollow } from './PositionFollow';
import { TrajectoryFollow } from './TrajectoryFollow';
import { VRFollow } from './VRFollow';

export function registerTasks(mainProc: App): void {
  mainProc.addTask(Ar4EndEffector);
  mainProc.addTask(GCodeFollow);
  mainProc.addTask(PositionFollow);
  mainProc.addTask(TrajectoryFollow);
  mainProc.addTask(VRFollow);
}
