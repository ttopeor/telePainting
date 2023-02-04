import { Configtable } from "./config";

export interface IRule extends Configtable {
  tick(): string | null;
}
