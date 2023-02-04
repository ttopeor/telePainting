import { LogManager_Instance } from ".";
import { Command } from "../definitions/transport";
import { SerialTransport } from "../tools/transports/SerialTransport";

export interface CommandHandler {
  receiveCommand(address: string, cmd: Command, payload: Buffer): void;
}

export class TransportManager {
  public connections: Record<string, SerialTransport>;

  constructor() {
    this.connections = {};
  }

  async registerHandler(address: string, callback: CommandHandler) {
    if (!this.connections[address]) {
      this.connections[address] = new SerialTransport(address, 921600);
      await this.connections[address].connect();
    }
    this.connections[address].listeners.push(callback);
  }

  sendCommand(address: string, cmd: Command, payload: Buffer) {
    if (!this.connections[address]) {
      LogManager_Instance.logger.warn(
        `Failed to send command, serial connection [${address}] not existed`
      );
    }
    this.connections[address]?.sendCommand(cmd, payload);
  }
}
