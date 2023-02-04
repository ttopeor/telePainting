import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { LogManager_Instance } from ".";
import { App } from "../App";
import {
  AllConfigDefinition,
  Config,
  ConfigDefinitions,
  Configtable,
  ConfigType,
} from "../definitions/config";
import { Environment } from "../Environment";
import * as _ from "lodash";
import { IModule } from "../definitions/IModule";
import { IController } from "../definitions/IController";
import { IRule } from "../definitions/IRules";

export const ConfigPath = path.join(
  process.cwd(),
  Environment.dataPath,
  "config.json"
);

function DefaultConfig() {
  return {
    modules: {},
    rules: {},
    controllers: {},
    general: {},
  };
}

export class ConfigManager implements Configtable {
  config: Config = DefaultConfig();

  constructor() {}

  configDefinitions(): ConfigDefinitions {
    return {
      MoveitStep: {
        type: ConfigType.NUMBER,
        default: 0.005,
      },
      MoveitJump: {
        type: ConfigType.NUMBER,
        default: 0,
      },
    };
  }

  update(config: Partial<Config>) {
    LogManager_Instance.logger.info(`Update configs`);
    this.config = _.merge(this.calculateDefaults(), this.config, config);
    this.save();
  }

  get definitions(): AllConfigDefinition {
    const def: AllConfigDefinition = {
      modules: {},
      controllers: {},
      rules: {},
      general: this.configDefinitions(),
    };

    for (const module of App.instance.modules) {
      const definition = module.configDefinitions();
      if (Object.keys(definition).length > 0) {
        def.modules[module.constructor.name] = definition;
      }
    }

    for (const controller of App.instance.controllers) {
      const definition = controller.configDefinitions();
      if (Object.keys(definition).length > 0) {
        def.controllers[controller.constructor.name] = definition;
      }
    }

    for (const rule of App.instance.rules) {
      const definition = rule.configDefinitions();
      if (Object.keys(definition).length > 0) {
        def.rules[rule.constructor.name] = definition;
      }
    }

    return def;
  }

  calculateDefaults() {
    const cfg: any = {
      modules: {},
      rules: {},
      controllers: {},
      general: {},
    };

    for (const module of App.instance.modules) {
      const definition = module.configDefinitions();
      const defaults: any = {};
      for (const key of Object.keys(definition)) {
        defaults[key] = definition[key].default;
      }
      cfg.modules[module.constructor.name] = defaults;
    }

    for (const controller of App.instance.controllers) {
      const definition = controller.configDefinitions();
      const defaults: any = {};
      for (const key of Object.keys(definition)) {
        defaults[key] = definition[key].default;
      }
      cfg.controllers[controller.constructor.name] = defaults;
    }

    for (const rule of App.instance.rules) {
      const definition = rule.configDefinitions();
      const defaults: any = {};
      for (const key of Object.keys(definition)) {
        defaults[key] = definition[key].default;
      }
      cfg.rules[rule.constructor.name] = defaults;
    }

    const generalDef = this.configDefinitions();
    for (const key of Object.keys(generalDef)) {
      cfg.general[key] = generalDef[key].default;
    }
    return cfg;
  }

  load() {
    try {
      LogManager_Instance.logger.info(`Loading config file: ${ConfigPath}`);
      const config = JSON.parse(readFileSync(ConfigPath, { encoding: "utf8" }));
      this.update(config);
    } catch (e) {
      LogManager_Instance.logger.warn("Unable to read config file");
      this.update({});
    }
  }

  save() {
    try {
      LogManager_Instance.logger.info(`Save config file to: ${ConfigPath}`);
      writeFileSync(ConfigPath, JSON.stringify(this.config, null, 2));
    } catch (e: any) {
      LogManager_Instance.logger.error(
        "Failed to save config file" + e.message
      );
    }
  }

  getModuleConfig(module: IModule) {
    return _.cloneDeep(this.config.modules[module.constructor.name]);
  }

  getControllerConfig(c: IController) {
    return _.cloneDeep(this.config.controllers[c.constructor.name]);
  }

  getRuleConfig(r: IRule) {
    return _.cloneDeep(this.config.rules[r.constructor.name]);
  }
}
