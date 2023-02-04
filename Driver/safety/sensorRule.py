from tools.config import Config
from tools.utils import angle_distances


class SensorRule:
    def __init__(self, robot) -> None:
        self.robot = robot
        self.prev_angles = None

    def tick(self, dt):
        if self.prev_angles is None:
            self.prev_angles = self.robot.currentAngles

        for i in range(len(self.robot.currentAngles)):
            if angle_distances(self.prev_angles[i], self.robot.currentAngles[i]) > Config.SensorTolerance:
                print("Disable robot because angle sensor is wrong",
                      self.prev_angles, self.robot.currentAngles)
                self.robot.onError(
                    "Disable robot because angle sensor is wrong")
                self.robot.setEnable(False)
