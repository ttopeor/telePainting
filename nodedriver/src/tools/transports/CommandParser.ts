import { Command } from "../../definitions/transport";
import { LogManager_Instance } from "../../managers";

export const TransportDelimiter = 0xff;

enum ParseStage {
  NONE,
  LENGTH,
  CMD,
  PAYLOAD,
}

export class CommandParser {
  private buffer: Buffer = Buffer.alloc(0);
  private stage: ParseStage = ParseStage.NONE;
  private length = 0;
  private cmd: Command = Command.NONE;

  constructor(private callback: (cmd: Command, payload: Buffer) => void) {}

  onBuffer(buffer: Buffer) {
    this.buffer = Buffer.concat([this.buffer, buffer]);
    while (this.buffer.length > 0) {
      switch (this.stage) {
        case ParseStage.NONE:
          if (this.buffer[0] === TransportDelimiter) {
            this.buffer = this.buffer.subarray(1);
            this.stage = ParseStage.LENGTH;
          }
          break;
        case ParseStage.LENGTH:
          this.length = this.buffer[0];
          this.buffer = this.buffer.subarray(1);
          this.stage = ParseStage.CMD;
          break;
        case ParseStage.CMD:
          this.stage = ParseStage.PAYLOAD;
          this.cmd = this.buffer[0];
          this.buffer = this.buffer.subarray(1);
          break;
        case ParseStage.PAYLOAD:
          if (this.buffer.length > this.length) {
            const payload = this.buffer.subarray(0, this.length);
            const checksum = this.buffer[this.length];
            const thisSum =
              [TransportDelimiter, this.length, this.cmd, ...payload].reduce(
                (p, i) => p + i
              ) & 0xff;
            if (checksum === thisSum) {
              this.callback(this.cmd, payload);
            } else {
              LogManager_Instance.logger.warn(
                `Failed to parse packet, checksum not matched [${checksum}] != [${thisSum}] ${payload.toString(
                  "hex"
                )} ${this.cmd} ${this.length} ${TransportDelimiter.toString(
                  16
                )}`
              );
            }
            this.buffer = this.buffer.subarray(this.length + 1);
            this.stage = ParseStage.NONE;
          }
          break;
      }
    }
  }

  reset() {
    this.buffer = Buffer.alloc(0);
    this.stage = ParseStage.NONE;
    this.cmd = Command.NONE;
    this.length = 0;
  }

  static serializedCommand(cmd: Command, payload: Buffer) {
    const length = payload.length;
    if (length <= 255) {
      const buff = Buffer.from([
        TransportDelimiter,
        length,
        cmd,
        ...payload,
        0,
      ]); // last byte is checksum
      buff[buff.length - 1] = buff.subarray().reduce((p, v) => p + v) & 0xff;
      return buff;
    } else {
      LogManager_Instance.logger.warn(
        `Failed to create serial packet, payload length exccess 251`
      );
      return Buffer.alloc(0);
    }
  }
}
