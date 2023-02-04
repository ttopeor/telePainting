import { SerialPort } from "serialport";
import { Command } from "../../definitions/transport";
import { LogManager_Instance } from "../../managers";
import { CommandHandler } from "../../managers/TransportManager";
import { CommandParser } from "./CommandParser";

export class SerialTransport {
  private serialPort: SerialPort | null = null;
  private parser: CommandParser;
  public listeners: CommandHandler[];
  private reconnect = true;
  get isOpen(): boolean {
    return !!this.serialPort?.isOpen;
  }

  constructor(private address: string, private baudRate = 115200) {
    LogManager_Instance.logger.info(
      `Create Serial Transport instance [${this.address}, baudRate=${this.baudRate}]`
    );
    this.listeners = [];
    this.onCommand = this.onCommand.bind(this);
    this.parser = new CommandParser(this.onCommand);
  }

  private onCommand(cmd: Command, payload: Buffer) {
    this.listeners.forEach((l) => l.receiveCommand(this.address, cmd, payload));
  }

  public sendCommand(cmd: Command, payload: Buffer) {
    if (this.isOpen) {
      const buff = CommandParser.serializedCommand(cmd, payload);
      if (buff.length > 0) {
        this.serialPort?.write(buff);
      }
    } else {
      LogManager_Instance.logger.warn(
        `Failed to send command: Serial port not opened`
      );
    }
  }

  public async connect(): Promise<void> {
    this.parser.reset();
    await this.disconnect();

    return new Promise((resolve) => {
      this.reconnect = true;
      LogManager_Instance.logger.info(
        `Connecting to Board at ${this.address} with baudRate: ${this.baudRate}...`
      );
      this.serialPort = new SerialPort(
        { path: this.address, baudRate: this.baudRate },
        (err) => {
          if (!!err) {
            LogManager_Instance.logger.error(
              `Failed to open serial port: ${err.message}`
            );
            resolve();
          }
        }
      );

      this.serialPort.on("open", () => {
        LogManager_Instance.logger.info(`Serial Port opened!`);
        resolve();
      });

      this.serialPort.on("close", () => {
        LogManager_Instance.logger.info(`Serial Port closed!`);
        if (this.reconnect) {
          LogManager_Instance.logger.info(
            `Attempt to reconnect ${this.address} after 3s`
          );
          setTimeout(() => {
            LogManager_Instance.logger.info(
              `Reconnecting to ${this.address}...`
            );
            this.connect();
          }, 3000);
        }
      });

      this.serialPort.on("error", (err) => {
        LogManager_Instance.logger.error(`SerialPort Error: ${err.message}`);
      });

      this.serialPort.on("data", (buffer: Buffer) => {
        this.parser.onBuffer(buffer);
      });
    });
  }

  public async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOpen) {
        this.reconnect = false;
        LogManager_Instance.logger.info(`Closing serial port...`);
        this.serialPort?.close((err) => {
          if (!!err) {
            LogManager_Instance.logger.error(
              `Failed to close serial port: ${err.message}`
            );
          }
          LogManager_Instance.logger.info(`Serial port closed!`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
