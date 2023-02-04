import { spawn } from "child_process";
import { join } from "path";
import { LogManager_Instance } from ".";
//@ts-ignore
import winstonStream from "winston-stream";

export class ScannerManager {
  public inuse = false;

  async scan(
    radius: string,
    output: string = "last_scan.pts"
  ): Promise<number> {
    if (this.inuse) {
      LogManager_Instance.logger.warn(`Duplicate scanner request`);
      return 1;
    }
    this.inuse = true;
    return new Promise((resolve) => {
      LogManager_Instance.logger.info(
        `Start scanner with radius=${radius} output=${output}`
      );
      const procs = spawn(
        "/usr/bin/python3.8",
        [
          "../3DScanService/scan_function.py",
          "-o",
          join("public", output),
          "-r",
          radius,
        ],
        { env: { DISPLAY: ":0" }, shell: true }
      );
      procs.stdout.pipe(winstonStream(LogManager_Instance.logger, "info"));
      procs.on("close", (code) => {
        LogManager_Instance.logger.info(
          `Scanner process exited with code ${code}`
        );
        this.inuse = false;
        resolve(code || 0);
        if (!!code) {
          LogManager_Instance.logger.error("Scanner process error!");
        } else {
          LogManager_Instance.logger.info("Scan success!");
        }
      });
    });
  }
}
