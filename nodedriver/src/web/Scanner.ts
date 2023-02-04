import { Application } from "express";
import { ScannerManager_Instance } from "../managers";
import { TextToSpeech } from "../modules/TextToSpeech";

export function Scanner(app: Application) {
  app.get("/api/heartbeat", (req, res) => {
    res.sendStatus(200);
  });
  app.get("/api/scan", async (req, res) => {
    await TextToSpeech.speak(`3D扫描开始`);
    const radius = (req.query.radius as string) || "0.001";
    const path = (req.query.path as string) || "last_scan.pts";
    const code = await ScannerManager_Instance.scan(radius, path);
    await TextToSpeech.speak(`3D扫描结束`);
    res.json({ code });
  });
}
