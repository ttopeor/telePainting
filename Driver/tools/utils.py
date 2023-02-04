import math
import numpy as np
from .config import Config


def clamp(value, min, max):
    if value < min:
        return min
    if value > max:
        return max
    if abs(value) < 1:
        return 0
    return value


def angle_distances(a, b):

    return min(abs(a - b), abs((a - 360) - b), abs((a + 360) - b))


def adjust_angles(angles):
    adjusted_angles = [0, 0, 0, 0, 0, 0]
    for i in range(len(angles)):
        zero_point = Config.JointZeroPoint[i]
        reverse = Config.JointReverse[i]
        x = angles[i]
        res = x - zero_point
        while res > 360:
            res -= 360
        while res < 0:
            res += 360
        if reverse:
            res = 360 - res
        if res > 180:
            res -= 360
        adjusted_angles[i] = res
    return adjusted_angles


def max_diff(curr, desire):
    return np.absolute(np.array(curr) - np.array(desire)).max()
