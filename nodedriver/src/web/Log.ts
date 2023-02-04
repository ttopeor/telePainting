import { Application } from "express";
import path from "path";
import { LogManager_Instance } from "../managers";
import { SystemLogPath } from "../managers/LogManager";

export function Log(app: Application) {
  app.get("/api/logs", (req, res) => {
    res.json(LogManager_Instance.getLogList());
  });
  app.get("/api/logs/:name", (req, res) => {
    const fileName = req.params.name;
    res.sendFile(path.join(process.cwd(), SystemLogPath, fileName));
  });
}
