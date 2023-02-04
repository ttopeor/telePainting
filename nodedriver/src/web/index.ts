// This file is auto generated, DO NOT modify yourself
// Use 'yarn gen' to auto generate
import { Application } from 'express';

import { Config } from './Config';
import { Log } from './Log';
import { Modules } from './Modules';
import { Planner } from './Planner';
import { Scanner } from './Scanner';
import { Status } from './Status';
import { Task } from './Task';
import { Test } from './Test';
import { VR } from './VR';

export function setupRoute(app: Application): void {
  Config(app);
  Log(app);
  Modules(app);
  Planner(app);
  Scanner(app);
  Status(app);
  Task(app);
  Test(app);
  VR(app);
}
