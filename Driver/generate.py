from models import Kinmatics
from scipy.spatial.transform import Rotation
from math import pi
import json
import math

if __name__ == '__main__':
    # for j4 in range(-90, 91, 45):
    #     for j5 in range(-90, 46, 45):
    #         for j6 in range(-180, 181, 45):
    #             Jangles = [0, 0, 0, j4, j5, j6]
    #             res = Kinmatics.calculate_fk(Jangles)
    #             print([j4, j5, j6], [round(x / pi * 180)
    #                   for x in res[3:]])
    # Jangles = [0, 0, 0, 0, 0, 0]
    # res = Kinmatics.calculate_fk(Jangles)
    # print(res[3:])
    # angle = Rotation.from_euler('XYZ', res[3:], degrees=False)
    # print(angle.as_euler('ZYX', degrees=True))
    a1 = Rotation.from_euler('ZYX', [0, -90, -90], True)
    a2 = Rotation.from_euler('ZYX', [-90, -90, 0], True)
    print(a1.as_quat())
    print(a2.as_quat())
