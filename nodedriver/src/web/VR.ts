import { Application } from "express";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Environment } from "../Environment";
import {
  LogManager_Instance,
  PlanManager_Instance,
  TaskManager_Instance,
} from "../managers";
import { TextToSpeech } from "../modules/TextToSpeech";
import { ensureExists } from "../utils";

const VR_DIR = join(Environment.dataPath, "vr");
ensureExists(VR_DIR);

export function VR(app: Application) {
  app.get("/api/vr", (req, res) => {
    const files = readdirSync(VR_DIR);
    res.send(files);
  });

  app.post("/api/vr", (req, res) => {
    const body = req.body;
    const date = new Date().toISOString().replace(/\-|\:|\./g, "_") + ".json";
    LogManager_Instance.logger.info(`Save vr waypoint to file: ${date}`);
    writeFileSync(join(VR_DIR, date), JSON.stringify(body, null, 2));
    TextToSpeech.speak("收到VR轨迹");
    res.json({ file: date });
  });

  app.get("/api/vr/plan", async (req, res) => {
    const bodyString = readFileSync(
      join(VR_DIR, req.query.name as any)
    ).toString();
    const body = JSON.parse(bodyString);
    const points = await PlanManager_Instance.planWithPythonUnreal(
      body.waypoints
    );
    try {
      // TODO: remove
      TextToSpeech.speak("执行VR预设轨迹");
      TaskManager_Instance.runTask("VRFollow", points);
      res.json({
        message: "",
        points,
        waypoints: body.waypoints,
      });
    } catch (e: any) {
      LogManager_Instance.logger.warn(
        `Failed to calculate move plan: ${e.message}`
      );
      res.json({ message: `Failed to calculate move plan: ${e.message}` });
    }
  });
}
