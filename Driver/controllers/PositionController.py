from .ControllerBase import ControllerBase
import numpy as np
from models.Kinmatics import calculate_fk, calculate_ik
from tools.PID import PID
from tools.config import Config
from tools.utils import max_diff


class PositionController(ControllerBase):

    def __init__(self, robot) -> None:
        self.destinationAngles = np.zeros(6)
        self.end_pos = np.zeros(6)
        self.pid = PID()
        self.targetPositions = []
        super().__init__(robot)

    def set_input(self, positions):
      # initial_pos = calculate_fk(self.currentAngles)[:3] + positions[0][3:]
        # positions = [initial_pos] + positions
        #
        # interprolated_positions = np.array([positions[0]])

        # for i in range(len(positions) - 1):
        #     a = np.array(positions[i])
        #     b = np.array(positions[i + 1])

        #     distance = np.sqrt(abs(np.dot(a[:3], b[:3])))

        #     curr_interp_positions = np.linspace(
        #         positions[i], positions[i + 1], int(ceil(distance / STEP_INTERVAL)))

        #     interprolated_positions = np.append(
        #         interprolated_positions, curr_interp_positions, axis=0)

        self.targetPositions = []
        for p in positions:
            ik = calculate_ik(p)
            if ik is not None:
                self.targetPositions.append(ik)
        self.destinationAngles = self.robot.currentAngles
        self.end_pos = self.targetPositions[-1]
        self.pid.setTarget(input)

    def get_destination(self):
        return self.destinationAngles

    def tick(self, current_angles, dt):
        if max_diff(current_angles, self.destinationAngles) <= Config.SwitchTargetTolerance:
            if len(self.targetPositions) > 0:
                self.destinationAngles = self.targetPositions[0]
                self.destinationCartesianPos = calculate_fk(
                    self.destinationAngles)
                self.targetPositions = self.targetPositions[1:]
                print("POSITIONS advance points", len(
                    self.targetPositions), "remaining", self.destinationAngles)
                self.pid.setTarget(self.destinationAngles)
        return self.pid.update(current_angles, dt)
