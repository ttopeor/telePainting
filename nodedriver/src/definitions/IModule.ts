import { Configtable } from "./config";

export interface IModule extends Configtable {
  start(): Promise<void>;
  tick(): void;
  status: any;
  request(type: string, input: any): void;
}
