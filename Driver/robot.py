import serial
import struct
import numpy as np
import time
import sys
from threading import Lock

from controllers.AngleController import AngleController
from controllers.ControllerBase import ControllerBase
from controllers.PositionController import PositionController
from controllers.SpeedController import SpeedController
from controllers.TrajectoryController import TrajectoryController
from tools.utils import adjust_angles
from models.Kinmatics import calculate_fk, calculate_ik
from tools.kalman import Kalman
from tools.config import Config
from safety.sensorRule import SensorRule
from tools.ticker import Ticker

MODE_SPEED = 'MODE_SPEED'
MODE_ANGLE = 'MODE_ANGLE'
MODE_POSITIONS = 'MODE_POSITIONS'
MODE_TRAJECTORY = 'MODE_TRAJECTORY'


shared_resource_lock = Lock()


class Robot:
    def __init__(self, port, onError) -> None:

        self.rules = [SensorRule(self)]
        self.controllers = {
            MODE_ANGLE: AngleController(self),
            MODE_SPEED: SpeedController(self),
            MODE_POSITIONS: PositionController(self),
            MODE_TRAJECTORY: TrajectoryController(self)
        }

        self.kalman = [Kalman(), Kalman(), Kalman(),
                       Kalman(), Kalman(), Kalman()]

        self.currentAngles = np.zeros(6)
        self.currentCartesianPos = calculate_fk(self.currentAngles)
        self.destinationAngles = np.zeros(6)
        self.destinationCartesianPos = calculate_fk(
            self.destinationAngles)

        self.currentSpeed = np.zeros(6)
        self.enabled = True
        self.fps = 0
        self.tickRate = 0
        self.mode = MODE_SPEED
        self.onError = onError
        self.last_tick = time.time()
        self.write_speed_ticker = Ticker(Config.WriteSpeedInterval)
        self.J7Enabled = 0
        print("Connecting to serial", port)
        self.ser = serial.Serial(port, 921600)
        print("Serial connection established")

    def on_config_change(self):
        self.write_speed_ticker = Ticker(Config.WriteSpeedInterval)

    def update_angles(self):
        with shared_resource_lock:
            plaindata =  self.ser.read(7 * 4)
            checksum = self.ser.read(1)
            if sum(plaindata) & 0xff == int.from_bytes(checksum, 'little'):
              
                newAngles = np.array(adjust_angles(
                struct.unpack('6f',plaindata[:6 * 4])))
                
                [self.fps] = struct.unpack('f', plaindata[6 * 4 : 7 * 4])
                
                self.currentAngles = newAngles
                
                for i in range(len(self.kalman)):
                    self.currentAngles[i] = self.kalman[i].update(
                        self.currentAngles[i], self.currentSpeed[i] / Config.JointStepsPerDegree[i])
                fks = calculate_fk(self.currentAngles)
                self.currentCartesianPos = fks
            else:
                print("Failed to read angle, checksum not match")

    def write_speed(self):
        if self.write_speed_ticker.shouldTick():
            robot_speed = [0, 0, 0, 0, 0, 0]
            for i in range(len(robot_speed)):
                robot_speed[i] = self.currentSpeed[i] * Config.SpeedReverse[i]
            payload = b'\xff' + struct.pack("6f", *robot_speed) + (b'\x01' if self.J7Enabled else b'\x00')
            checksum = sum(payload[1:]) & 0xff
            payload += checksum.to_bytes(1, 'little')
            self.ser.write(payload)

    def tick(self):
        start = time.time()
        self.update_angles()
        self.tick_controller()
        self.write_speed()
        end = time.time()
        self.tickRate = 1 / (end - start)

    def requestSpeed(self, newSpeed):
        self.mode = MODE_SPEED
        self.running_controller().set_input(np.array(newSpeed))

    def setEnable(self, enabled):
        self.enabled = enabled
        self.currentSpeed = np.zeros(6)

    def running_controller(self) -> ControllerBase:
        return self.controllers[self.mode]

    def requestAngle(self, newAngle):
        with shared_resource_lock:
            self.mode = MODE_ANGLE
            self.running_controller().set_input(np.array(newAngle))

    def requestPositions(self, positions):
        if len(positions) == 0:
            return
        with shared_resource_lock:
            self.mode = MODE_POSITIONS
            self.running_controller().set_input(np.array(positions))

    def requestTrajectory(self, positions):
        # if len(trajectory) == 0:
        #     return
        with shared_resource_lock:
            self.mode = MODE_TRAJECTORY
            self.running_controller().set_input(positions)

    def tick_controller(self):
        if not self.enabled:
            self.currentSpeed = np.zeros(6)
            return
        with shared_resource_lock:
            curr = time.time()
            dt = curr - self.last_tick
            self.currentSpeed = self.running_controller().tick(self.currentAngles, dt)
            self.destinationAngles = self.running_controller().get_destination()
            self.destinationCartesianPos = calculate_fk(self.destinationAngles)
            for rule in self.rules:
                rule.tick(dt)
            self.last_tick = time.time()
