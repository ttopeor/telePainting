from .ControllerBase import ControllerBase
import numpy as np
from tools.PID import PID


class AngleController(ControllerBase):

    def __init__(self, robot) -> None:
        self.destinationAngles = np.zeros(6)
        self.pid = PID()
        super().__init__(robot)

    def set_input(self, input):
        self.destinationAngles = input
        self.pid.setTarget(input)

    def get_destination(self):
        return self.destinationAngles

    def tick(self, current_angles, dt):
        return self.pid.update(current_angles, dt)
