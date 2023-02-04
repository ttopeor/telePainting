from .ControllerBase import ControllerBase
import numpy as np


class SpeedController(ControllerBase):

    def __init__(self, robot) -> None:
        self.speed = np.zeros(6)
        super().__init__(robot)

    def set_input(self, input):
        self.speed = np.array(input)
        print("Set speed to", self.speed)

    def tick(self, current_angles, dt):
        return self.speed
