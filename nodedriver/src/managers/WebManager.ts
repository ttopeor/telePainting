import express, { Application } from "express";
import http from "http";
import { Environment } from "../Environment";
import { join } from "path";
import { LogManager_Instance } from ".";
import { setupRoute } from "../web";
import { MyIpInfo, objectToString } from "../utils";
const publicPath = join("public/");

export class WebManager {
  private _app: express.Express;
  private _server: http.Server;

  constructor() {
    this._app = express();
    this._server = http.createServer(this._app);
    this._app.use(express.static(publicPath));
    this._app.use((req, res, next) => {
      LogManager_Instance.logger.debug(
        `[Web] ${req.method} ${req.path} ${objectToString(
          req.params
        )} ${objectToString(req.body)}`
      );
      next();
    });
    this._app.use(express.json({ limit: "50mb" }));
    setupRoute(this._app);
  }

  async start() {
    LogManager_Instance.logger.info("Starting Web Service...");
    return new Promise((resolve) => {
      this._server.listen(Environment.port, async () => {
        LogManager_Instance.logger.info(
          "Web Service running on: 0.0.0.0:" + Environment.port
        );
        LogManager_Instance.logger.info(
          `Local User  : http://localhost:${Environment.port}`
        );
        LogManager_Instance.logger.info(
          `Remote User : http://${await MyIpInfo()}:${Environment.port}`
        );
        resolve(null);
      });
    });
  }

  get app(): Application {
    return this._app;
  }
}
