import { Application } from "express";
import { TaskManager_Instance } from "../managers";

export function Test(app: Application) {
  app.get("/api/test/test", async (req, res) => {
    await TaskManager_Instance.runTask("GCodeFollow", "test.nc");
    res.json({ message: "ok" });
  });
}
