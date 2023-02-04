from math import floor
import time
from .ControllerBase import ControllerBase
import numpy as np
from models.Kinmatics import calculate_fk, calculate_ik
from models.trajectory_planning import test_traj, yue_traj, zero_angles
from tools.PID import PID
from tools.config import Config


class TrajectoryController(ControllerBase):

    def __init__(self, robot) -> None:
        self.destinationAngles = np.zeros(6)
        self.pid = PID()
        self.trajectory = np.zeros((1, 6))
        self.end_pos = np.zeros(6)
        self.trajectoryStartTime = time.time()
        super().__init__(robot)

    def set_input(self, input):
        self.destinationAngles = input
        self.pid.setTarget(input)
        positions = yue_traj()
        self.trajectory = []
        test_traj(positions)
        for p in positions:
            ik = calculate_ik(p)
            if ik is not None:
                self.trajectory.append(ik)
        self.trajectory.extend(zero_angles(self.robot.currentAngles))
        self.trajectory = np.array(self.trajectory)
        self.end_pos = self.trajectory[-1]
        self.trajectoryStartTime = time.time()
        self.destinationAngles = self.trajectory[0]

        self.pid.setTarget(self.destinationAngles)

    def get_destination(self):
        return self.destinationAngles

    def tick(self, current_angles, dt):
        idx = floor((time.time() - self.trajectoryStartTime) /
                    Config.TrajectoryInterval)

        if idx >= len(self.trajectory):
            idx = len(self.trajectory) - 1

        change_trajectory = False
        for i in range(len(self.destinationAngles)):
            if self.destinationAngles[i] != self.trajectory[idx, i]:
                change_trajectory = True
                break

        if change_trajectory:
            newTraj = self.trajectory[idx]
            self.destinationAngles = newTraj
            self.pid.setTarget(self.destinationAngles)
        return self.pid.update(current_angles, dt)
