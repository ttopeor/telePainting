export type JointValues = [number, number, number, number, number, number];
export type JointSwitch = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean
];

export enum ConfigType {
  BOOLEAN = "BOOLEAN",
  NUMBER = "NUMBER",
  STRING = "STRING",
  JOINT_VALUES = "JOINT_VALUES",
  JOINT_SWITCH = "JOINT_SWITCH",
  SERIAL_PORT = "SERIAL_PORT",
}

export interface ConfigDefinition {
  type: ConfigType;
  default: JointValues | JointSwitch | boolean | number | string;
  category?: string;
}

export type ConfigDefinitions = Record<string, ConfigDefinition>;

export interface Config {
  modules: Record<string, Record<string, any>>;
  controllers: Record<string, Record<string, any>>;
  rules: Record<string, Record<string, any>>;
  general: Record<string, any>;
}

export interface Configtable {
  configDefinitions(): ConfigDefinitions;
}

export interface AllConfigDefinition {
  modules: Record<string, ConfigDefinitions>;
  controllers: Record<string, ConfigDefinitions>;
  rules: Record<string, ConfigDefinitions>;
  general: ConfigDefinitions;
}
