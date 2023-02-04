// This file is auto generated, DO NOT modify yourself
// Use 'yarn gen' to auto generate
import { App } from '../App';

import { AR4RobotArm } from './AR4RobotArm';
import { TextToSpeech } from './TextToSpeech';

export function registerModule(mainProc: App): void {
  mainProc.addModule(new AR4RobotArm());
  mainProc.addModule(new TextToSpeech());
}
