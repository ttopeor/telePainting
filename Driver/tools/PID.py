import numpy as np
from .utils import clamp
from .config import Config


class PID:
    def __init__(self) -> None:
        self.target = np.zeros(6)
        self.last_errors = np.zeros(6)

    def setTarget(self, target):
        self.last_errors = np.zeros(6)
        self.target = target

    def update(self, current_angles, delta):
        P = np.array(Config.P)
        D = np.array(Config.D)
        current = np.array(current_angles)
        current_error = self.target - current
        rated_error = current_error / delta
        efforts = np.zeros(6)

        # P calculation
        efforts = current_error * P

        # D calculation
        efforts += rated_error * D

        self.last_errors = current_error

        for (i, x) in enumerate(efforts):
            efforts[i] = clamp(x, -Config.JointMaxSpeed[i],
                               Config.JointMaxSpeed[i])

        return efforts
