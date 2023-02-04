import { Configtable } from "./config";

export interface IController extends Configtable {}

export interface Ar4Controller extends IController {
  start(input: any): boolean;
  tick(angles: number[], delta: number): number[];
  destination(): number[];
}
