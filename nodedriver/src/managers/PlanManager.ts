import { spawn } from "child_process";
import { ConfigManager_Instance, LogManager_Instance } from ".";
import { App } from "../App";
import { AR4RobotArm } from "../modules/AR4RobotArm";
import { JointTrajectory, Pose } from "../tasks/TrajectoryFollow";
import { degreeToRad } from "../utils/math";
import { request } from "../utils/request";

export class PlanManager {
  constructor() {}

  async planWithPythonUnreal(waypoints: Pose[]): Promise<number[][]> {
    const module = App.instance.modules.find(
      (m) => m.constructor.name.toLowerCase() === "ar4robotarm"
    ) as AR4RobotArm;
    const res = await request("http://localhost:5002/planvr", "POST", {
      waypoints,
      start: module.status.currentAngles,
    });
    if (res.success) {
      return res.points;
    } else {
      LogManager_Instance.logger.warn(`Failed to plan with python!`);
      return [];
    }
  }

  async planWithPython(waypoints: Pose[]): Promise<number[][]> {
    const module = App.instance.modules.find(
      (m) => m.constructor.name.toLowerCase() === "ar4robotarm"
    ) as AR4RobotArm;
    const res = await request("http://localhost:5002/plan", "POST", {
      waypoints,
      start: module.status.currentAngles,
    });
    if (res.success) {
      return res.points;
    } else {
      LogManager_Instance.logger.warn(`Failed to plan with python!`);
      return [];
    }
  }

  async planWithMoveit(
    waypoints: Pose[],
    start?: number[]
  ): Promise<JointTrajectory[]> {
    const module = App.instance.modules.find(
      (m) => m.constructor.name.toLowerCase() === "ar4robotarm"
    ) as AR4RobotArm;
    const startAngles = !!start
      ? start.map((a) => degreeToRad(a))
      : module.status.currentAngles.map((a) => degreeToRad(a));
    const payload = {
      step: ConfigManager_Instance.config.general.MoveitStep,
      jump: ConfigManager_Instance.config.general.MoveitJump,
      start: startAngles,
      waypoints: waypoints,
    };
    const moveit_response = (await request(
      "http://localhost:5001/plan",
      "POST",
      payload
    )) as any;
    return moveit_response.plan.joint_trajectory.points;
  }
}
