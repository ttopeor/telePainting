import copy
import json
from types import SimpleNamespace

MAX_SPEED = [4000, 4000, 4000, 4000, 4000, 4000]
SWITCH_TARGET_TOLERANCE = 0.02
TRAJECTORY_INTERVAL = 0.005
WRITE_SPEED_INTERVAL = 0.005


P = [80, 80, 120, 150, 80, 100]
D = [0.04, 0.04, 0.04, 0.04, 0.04, 0.04]

# TODO: This does find some sensor error
SENSOR_TOLERANCE = 360

JOINT_ZERO_POINT = [157.86, 106.62, 88.7, 168.05, 159.7, 13.8]
JOINT_STEPS_PER_DEGREE = [44.44444444444444, 55.55555556,
                          55.55555556, 42.72664356, 21.86024888, 22.22222222]
JOINT_REVERSE = [False, True, True, False, False, False]
SPEED_REVERSE = [-1, 1, 1, -1, 1, 1]

STEP_INTERVAL = 0.05
MQTT_INTERVAL = 0.016


class Config:
    P = copy.copy(P)
    D = copy.copy(D)
    JointZeroPoint = copy.copy(JOINT_ZERO_POINT)
    JointStepsPerDegree = copy.copy(JOINT_STEPS_PER_DEGREE)
    JointReverse = copy.copy(JOINT_REVERSE)
    JointMaxSpeed = copy.copy(MAX_SPEED)
    SpeedReverse = copy.copy(SPEED_REVERSE)
    StepInterval = STEP_INTERVAL
    SensorTolerance = SENSOR_TOLERANCE
    WriteSpeedInterval = WRITE_SPEED_INTERVAL
    TrajectoryInterval = TRAJECTORY_INTERVAL
    SwitchTargetTolerance = SWITCH_TARGET_TOLERANCE
    MQTTInterval = MQTT_INTERVAL

    @classmethod
    def to_json(self):
        return {
            "P": self.P,
            "D": self.D,
            "JointZeroPoint": self.JointZeroPoint,
            "JointStepsPerDegree": self.JointStepsPerDegree,
            "JointReverse": self.JointReverse,
            "JointMaxSpeed": self.JointMaxSpeed,
            "SpeedReverse": self.SpeedReverse,
            "StepInterval": self.StepInterval,
            "SensorTolerance": self.SensorTolerance,
            "WriteSpeedInterval": self.WriteSpeedInterval,
            "TrajectoryInterval": self.TrajectoryInterval,
            "SwitchTargetTolerance": self.SwitchTargetTolerance,
            "MQTTInterval": self.MQTTInterval
        }

    @classmethod
    def from_json(self, config):
        self.P = config['P']
        self.D = config['D']
        self.JointZeroPoint = config['JointZeroPoint']
        self.JointStepsPerDegree = config['JointStepsPerDegree']
        self.JointReverse = config['JointReverse']
        self.JointMaxSpeed = config['JointMaxSpeed']
        self.SpeedReverse = config['SpeedReverse']
        self.StepInterval = config['StepInterval']
        self.SensorTolerance = config['SensorTolerance']
        self.WriteSpeedInterval = config['WriteSpeedInterval']
        self.TrajectoryInterval = config['TrajectoryInterval']
        self.SwitchTargetTolerance = config['SwitchTargetTolerance']
        self.MQTTInterval = config["MQTTInterval"]

    @classmethod
    def load(self):
        try:
            config = json.load(open('config.json'))
            self.from_json(config)
        except Exception as ex:
            print("Failed to load config file: %s, creating a new one... " % ex)

    @classmethod
    def save(self):
        try:
            json.dump(self.to_json(), open('config.json', 'w+'))
        except Exception as ex:
            print("Failed to save config : %s" % ex)

    @classmethod
    def reset(self):
        self.P = copy.copy(P)
        self.D = copy.copy(D)
        self.JointZeroPoint = copy.copy(JOINT_ZERO_POINT)
        self.JointStepsPerDegree = copy.copy(JOINT_STEPS_PER_DEGREE)
        self.JointReverse = copy.copy(JOINT_REVERSE)
        self.JointMaxSpeed = copy.copy(MAX_SPEED)
        self.SpeedReverse = copy.copy(SPEED_REVERSE)
        self.StepInterval = STEP_INTERVAL
        self.SensorTolerance = SENSOR_TOLERANCE
        self.WriteSpeedInterval = WRITE_SPEED_INTERVAL
        self.TrajectoryInterval = TRAJECTORY_INTERVAL
        self.SwitchTargetTolerance = SWITCH_TARGET_TOLERANCE
        self.MQTTInterval = MQTT_INTERVAL


if __name__ == '__main__':
    print(Config.MQTTInterval)
    Config.MQTTInterval = 22
    print(Config.MQTTInterval)
    print(Config == Config)
