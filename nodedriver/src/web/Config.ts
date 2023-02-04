import { Application } from "express";
import { SerialPort } from "serialport";
import { ConfigManager_Instance } from "../managers";

export function Config(app: Application) {
  app.get("/api/config", (req, res) => {
    res.json({
      config: ConfigManager_Instance.config,
      definition: ConfigManager_Instance.definitions,
    });
  });
  app.post("/api/config", (req, res) => {
    const newConfig = req.body;
    ConfigManager_Instance.update(newConfig);
    res.json({
      config: ConfigManager_Instance.config,
      definition: ConfigManager_Instance.definitions,
    });
  });
  app.get("/api/serialports", async (req, res) => {
    const ports = (await SerialPort.list()).filter(
      (p) => p.manufacturer || p.vendorId || p.productId
    );
    res.json(ports);
  });
}
