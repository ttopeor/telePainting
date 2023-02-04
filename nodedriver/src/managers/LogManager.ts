import { Logger, transports, format, loggers } from "winston";
import Transport from "winston-transport";
import { Environment } from "../Environment";
import { join } from "path";
import { exists, readFile, readFileSync } from "fs";
import DailyRotateFile from "winston-daily-rotate-file";
import moment from "moment";
import { objectToString } from "../utils";

const { combine, timestamp, label, colorize, printf } = format;

export const SystemLogPath = join(Environment.dataPath, "logs/system");

const logLevel = Environment.isProduction ? "info" : "debug";

class RelayToHttpTransport extends Transport {
  public streams: NodeJS.WritableStream[] = [];

  log(info: any, callback: any) {
    setImmediate(() => {
      this.streams.forEach((s) => s.write(objectToString(info)));
    });
    callback();
  }
}

export class LogManager {
  public streamHolder: RelayToHttpTransport | null = null;

  constructor() {
    this.createLogger();
  }

  public createLogger() {
    const printFormat = printf((info) => {
      return `${moment(info.timestamp).format("YYYY-MM-DD HH:mm:ss")} [${
        info.label
      }][${info.level}] ${info.message}`;
    });
    const transportMain = [
      new DailyRotateFile({
        filename: `${Environment.hostName}_%DATE%.log`,
        dirname: SystemLogPath,
        zippedArchive: false,
        datePattern: "YYYY-MM-DD",
        format: printFormat,
        maxSize: "20m",
        maxFiles: "14d",
        auditFile: join(SystemLogPath, "audit.json"),
        level: logLevel,
      }),
      new transports.Console({
        format: combine(colorize({ message: true }), printFormat),
        level: logLevel,
      }),
    ];

    loggers.add("main", {
      transports: transportMain,
      format: combine(timestamp(), label({ label: "SERVER" })),
    });

    if (Environment.isProduction) {
      process.on("uncaughtException", (e) => {
        this.logger.error(`Unhandled Exception: ${e.stack}`);
      });

      process.on("unhandledRejection", (e) => {
        this.logger.error(`Unhandled Rejection: ${e}`);
      });
    }
  }

  public attachStream(out: NodeJS.WritableStream) {
    this.streamHolder?.streams.push(out);
  }

  public detachStream(out: NodeJS.WritableStream) {
    if (!!this.streamHolder) {
      this.streamHolder.streams = this.streamHolder.streams.filter(
        (s) => s !== out
      );
    }
  }

  public logInitialInfo() {
    this.logger.info(`
==================================================
      ${Environment.appName}
--------------------------------------------------                                                        
* Version       : ${Environment.buildVersion} Running On Nodejs ${
      process.version
    }
* Mode          : ${Environment.isProduction ? "Production" : "Development"}
* HostName      : ${Environment.hostName}
* dataPath      : ${Environment.dataPath}
* WebServicePort: ${Environment.port}
* MQTT Endpoint : ${Environment.mqttAddress} @ ${Math.floor(
      1000 / Environment.mqttRefreshInterval
    )} fps
==================================================
`);
  }

  public get logger(): Logger {
    return loggers.get("main");
  }

  public getLogList() {
    const audit = JSON.parse(
      readFileSync(join(SystemLogPath, "audit.json")).toString()
    );
    return audit.files.map((file: any) => {
      const fileNames = (file.name as string).split(/\\|\//);
      return fileNames[fileNames.length - 1];
    });
  }

  public getLogData(logFile: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const logFilePath = join(SystemLogPath, logFile);
      exists(logFilePath, (exists) => {
        if (exists) {
          readFile(logFilePath, (err, data) => {
            if (err) {
              this.logger.error(`Failed to read log file: ${err}`);
            } else {
              resolve(data.toString());
            }
          });
        } else {
          reject("Log file not exist!");
        }
      });
    });
  }
}
