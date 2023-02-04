import { Application } from "express";
import { LogManager_Instance, PlanManager_Instance } from "../managers";

export function Planner(app: Application) {
  app.post("/api/moveit/pt", async (req, res) => {
    const body = req.body;
    const points = PlanManager_Instance.planWithMoveit(body.waypoints);
    try {
      res.json({
        message: "",
        points: points,
      });
    } catch (e: any) {
      LogManager_Instance.logger.warn(
        `Failed to calculate move plan: ${e.message}`
      );
      res.json({ message: `Failed to calculate move plan: ${e.message}` });
    }
  });
}
