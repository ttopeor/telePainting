import { App } from "../App";
import { Ar4ConstantSpeedController } from "../controllers/Ar4ConstantSpeedController";
import { Ar4TrajectoryController } from "../controllers/Ar4TrajectoryController";
import { ConfigDefinitions, ConfigType } from "../definitions/config";
import { Ar4Controller, IController } from "../definitions/IController";
import { IModule } from "../definitions/IModule";
import { Command } from "../definitions/transport";
import {
  ConfigManager_Instance,
  MqttManager_Instance,
  TransportManager_Instance,
} from "../managers";
import { CommandHandler } from "../managers/TransportManager";
import { Kalman } from "../tools/transports/Kalman";

const TeensyAddress = "/dev/ttyACM0";

export class AR4RobotArm implements IModule, CommandHandler {
  speed: number[] = [0, 0, 0, 0, 0, 0];
  destination: number[] = [0, 0, 0, 0, 0, 0];
  angles: number[] = [0, 0, 0, 0, 0, 0];

  sensorRefreshRate: number = 0;
  serverRefreshRate: number = 0;

  runningController: Ar4Controller | null = null;

  kalmans: Kalman[] = [
    new Kalman(),
    new Kalman(),
    new Kalman(),
    new Kalman(),
    new Kalman(),
    new Kalman(),
  ];

  lastUpdateTime = 0;
  lastSpeedTime = 0;
  async start() {
    await TransportManager_Instance.registerHandler(
      ConfigManager_Instance.getModuleConfig(this).SerialPort,
      this
    );
  }

  configDefinitions(): ConfigDefinitions {
    return {
      JointZeroPoint: {
        type: ConfigType.JOINT_VALUES,
        default: [157.86, 106.62, 88.7, 168.05, 159.7, 13.8],
      },
      JointStepsPerDegree: {
        type: ConfigType.JOINT_VALUES,
        default: [
          44.44444444444444, 55.55555556, 55.55555556, 42.72664356, 21.86024888,
          22.22222222,
        ],
      },
      JointMaxSpeed: {
        type: ConfigType.JOINT_VALUES,
        default: [3000, 3000, 3000, 4000, 1500, 3000],
      },
      JointReversed: {
        type: ConfigType.JOINT_SWITCH,
        default: [true, true, true, true, false, true],
      },
      JointSpeedReversed: {
        type: ConfigType.JOINT_SWITCH,
        default: [false, false, false, false, false, true],
      },
      TickInterval: {
        type: ConfigType.NUMBER,
        default: 2,
      },
      SpeedInterval: {
        type: ConfigType.NUMBER,
        default: 5,
      },
      UseKalman: {
        type: ConfigType.BOOLEAN,
        default: true,
      },
      SerialPort: {
        type: ConfigType.SERIAL_PORT,
        default: TeensyAddress,
      },
    };
  }

  receiveCommand(address: String, cmd: Command, payload: Buffer) {
    switch (cmd) {
      case Command.REPORT_JOINT:
        const angles = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 6; i++) {
          angles[i] = payload.readFloatLE(i * 4);
        }
        this.onAngleUpdate(angles);
        break;
      case Command.REPORT_PERFORMANCE:
        this.sensorRefreshRate = payload.readFloatLE();
        break;
    }
  }

  private onAngleUpdate(rawAngles: number[]) {
    const cfg = ConfigManager_Instance.getModuleConfig(this);
    const zpoints: number[] = cfg.JointZeroPoint;
    const reversed: boolean[] = cfg.JointReversed;
    const useKalman: boolean = cfg.UseKalman;

    const angles = rawAngles.map((r, i) => {
      let angle = (r - zpoints[i]) as number;
      if (angle < 0) {
        angle += 360;
      }
      if (angle > 360) {
        angle %= 360;
      }
      if (reversed[i]) {
        angle = 360 - angle;
      }
      if (angle > 180) {
        angle -= 360;
      }
      if (useKalman) {
        angle = this.kalmans[i].update(angle, this.speed[i]);
      }
      return angle;
    });
    this.angles = angles;
  }

  tick() {
    const dt = Date.now() - this.lastUpdateTime;

    if (dt < ConfigManager_Instance.getModuleConfig(this).TickInterval) {
      return;
    }

    this.lastUpdateTime = Date.now();
    this.serverRefreshRate = 1000 / dt;

    if (!App.instance.enabled || !this.runningController) {
      this.speed = [0, 0, 0, 0, 0, 0];
    } else if (!!this.runningController) {
      const newSpeed = this.runningController.tick(this.angles, dt);
      this.speed = newSpeed;
      this.destination = this.runningController.destination();
    }
    this.sendSpeed();
  }

  sendSpeed() {
    const dt = Date.now() - this.lastSpeedTime;

    if (dt < ConfigManager_Instance.getModuleConfig(this).SpeedInterval) {
      return;
    }

    this.lastSpeedTime = Date.now();

    const reverseSpeed =
      ConfigManager_Instance.getModuleConfig(this).JointSpeedReversed;
    const hardwareSpeed = this.speed.map((s, i) => (reverseSpeed[i] ? -s : s));

    const buff = Buffer.alloc(24);

    for (let i = 0; i < 6; i++) {
      buff.writeFloatLE(hardwareSpeed[i], i * 4);
    }

    TransportManager_Instance.sendCommand(
      ConfigManager_Instance.getModuleConfig(this).SerialPort,
      Command.SEND_SPEED,
      buff
    );
  }

  sendEndeffetor(value: number) {
    const buff = Buffer.from([value]);
    TransportManager_Instance.sendCommand(
      ConfigManager_Instance.getModuleConfig(this).SerialPort,
      Command.SEND_ENDEFFECTOR,
      buff
    );
  }

  request(type: string, input: any) {
    const c = App.instance.getControllerByName(type) as Ar4Controller;
    if (!!c) {
      c.start(input);
      this.runningController = c;
      return;
    }
    if (type === "eef") {
      this.sendEndeffetor(parseInt(input || "0") || 0);
    }
  }

  get availableControllers(): string[] {
    return [Ar4ConstantSpeedController, Ar4TrajectoryController].map(
      (cls) => cls.constructor.name
    );
  }

  get status() {
    return {
      sensorRefreshRate: Math.floor(this.sensorRefreshRate),
      serverRefreshRate: Math.floor(this.serverRefreshRate),
      currentAngles: this.angles,
      destinationAngles: this.destination,
      jointSpeed: this.speed,
      controller: !!this.runningController
        ? this.runningController.constructor.name
        : "NONE",
    };
  }
}
