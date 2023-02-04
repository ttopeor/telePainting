import numpy as np


class ControllerBase:

    def __init__(self, robot):
        self.robot = robot

    def set_input(self, input):
        pass

    def get_destination(self):
        return np.zeros(6)

    def tick(self, current_angles, dt):
        return np.zeros(6)
