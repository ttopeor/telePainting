import { Application } from "express";
import { App } from "../App";
import { Environment } from "../Environment";

export function Status(app: Application) {
  app.get("/api/status", (_, res) => {
    res.json(App.instance.status);
  });
  app.post("/api/enabled", (req, res) => {
    const { enabled, reason } = req.body;
    if (!!enabled) {
      App.instance.enable();
    } else {
      App.instance.disable(reason);
    }
    res.json(req.body);
  });
  app.get("/api/environment", (req, res) => {
    res.json(Environment);
  });
}
