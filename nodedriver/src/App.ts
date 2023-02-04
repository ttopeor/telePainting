import { registerController } from "./controllers";
import { IController } from "./definitions/IController";
import { IModule } from "./definitions/IModule";
import { IRule } from "./definitions/IRules";
import { ITask } from "./definitions/TaskBase";
import { Environment } from "./Environment";
import {
  ConfigManager_Instance,
  LogManager_Instance,
  MqttManager_Instance,
  TaskManager_Instance,
  WebManager_Instance,
} from "./managers";
import { registerModule } from "./modules";
import { TextToSpeech } from "./modules/TextToSpeech";
import { registerRule } from "./rules";
import { registerTasks } from "./tasks";

export class App {
  static instance: App = new App();

  public modules: IModule[] = [];
  public controllers: IController[] = [];
  public rules: IRule[] = [];

  public taskClass: Record<string, { new (): ITask }> = {};

  public enabled: boolean = true;
  public disableReasons: string[] = [];

  public tickCount = 0;
  public fps = 0;

  private lastMqttTime = Date.now();
  constructor() {
    this.tick = this.tick.bind(this);
  }

  public async start() {
    this.tickCount = 0;
    await WebManager_Instance.start();
    await MqttManager_Instance.start();

    registerController(this);
    registerRule(this);
    registerModule(this);
    registerTasks(this);
    ConfigManager_Instance.load();

    for (const module of this.modules) {
      await module.start();
    }
    MqttManager_Instance.register("request", (topic: string, payload: any) => {
      if (topic === "request") {
        try {
          const payloadJS = JSON.parse(payload);
          this.request(payloadJS.module, payloadJS.type, payloadJS.input);
        } catch (e: any) {
          LogManager_Instance.logger.warn(`MQTT request failed: ${e.message}`);
        }
      }
    });
    LogManager_Instance.logger.info(`Start main loop...`);
    TaskManager_Instance.start();
    this.tick();
    setInterval(() => {
      this.fps = this.tickCount;
      this.tickCount = 0;
    }, 1000);
  }

  private async tick() {
    try {
      for (const module of this.modules) {
        module.tick();
      }
      for (const rule of this.rules) {
        const disableReason = rule.tick();
        if (!!disableReason) {
          this.disable(disableReason);
        }
      }
      this.tickCount += 1;
      this.updateMqtt();
    } catch (e: any) {
      LogManager_Instance.logger.error(`Tick loop exception: ${e.message}`);
    } finally {
      setTimeout(this.tick);
    }
  }

  public addModule(module: IModule) {
    LogManager_Instance.logger.debug(`Add module [${module.constructor.name}]`);
    this.modules.push(module);
  }

  public addController(controller: IController) {
    LogManager_Instance.logger.debug(
      `Add controller [${controller.constructor.name}]`
    );
    this.controllers.push(controller);
  }

  public addRule(rule: IRule) {
    LogManager_Instance.logger.debug(`Add rule [${rule.constructor.name}]`);
    this.rules.push(rule);
  }

  public addTask(taskCls: { new (): ITask }) {
    LogManager_Instance.logger.debug(`Register task type [${taskCls.name}]`);
    const name = taskCls.name;
    this.taskClass[name] = taskCls;
  }

  public disable(reason: string = "No Reason") {
    TextToSpeech.speak(`系统已锁定，原因：${reason}`);
    this.enabled = false;
    this.disableReasons.push(reason);
    TaskManager_Instance.killTask();
    MqttManager_Instance.publish("enabled", {
      enabled: this.enabled,
      disableReason: this.disableReasons,
    });
  }

  public enable() {
    TextToSpeech.speak("系统已解锁");
    this.enabled = true;
    this.disableReasons = [];
    MqttManager_Instance.publish("enabled", {
      enabled: this.enabled,
      disableReason: this.disableReasons,
    });
  }

  public request(moduleName: string, type: string, input: any) {
    const module = this.modules.find(
      (m) => m.constructor.name.toLowerCase() === moduleName
    );
    if (!!module) {
      LogManager_Instance.logger.info(`Module Request: ${type}`);
      module.request(type, input);
      return true;
    } else {
      LogManager_Instance.logger.warn(
        `Failed to request: module [${moduleName}] not found`
      );
      return false;
    }
  }

  updateMqtt() {
    const dt = Date.now() - this.lastMqttTime;
    if (dt < Environment.mqttRefreshInterval) {
      return;
    }
    this.lastMqttTime = Date.now();
    for (const module of this.modules) {
      MqttManager_Instance.publish(
        `modules/${module.constructor.name.toLowerCase()}`,
        module.status
      );
    }
    MqttManager_Instance.publish("tasks", TaskManager_Instance.status);
    MqttManager_Instance.publish("status", this.status);
  }

  get status() {
    return {
      enabled: this.enabled,
      disableReasons: this.disableReasons,
      modules: this.modules.map((m) => m.constructor.name),
      rules: this.rules.map((r) => r.constructor.name),
      fps: this.fps,
      task: TaskManager_Instance.status,
    };
  }

  getControllerByName(name: string): IController | undefined {
    return this.controllers.find(
      (c) => c.constructor.name.toLowerCase() === name.toLowerCase()
    );
  }
  getModuleByName(name: string) {
    return this.modules.find(
      (m) => m.constructor.name.toLowerCase() === name.toLowerCase()
    );
  }
}
