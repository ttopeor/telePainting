from models import Kinmatics
from flask import Flask, jsonify, request
import numpy as np
import copy
from math import pi
from scipy.spatial.transform import Rotation
app = Flask(__name__)

UNREALROBOT_BASE_POSITION = [-0.69, -3.17, 2.4]
UNREAL_TABLE_ZERO = [-69.4, -297, 258.95]
ZERO_POSITION = [0, 0.226, 0.15]
UNRAL_GLOBAL_BASE_POSITION = [UNREALROBOT_BASE_POSITION[0],
                              UNREALROBOT_BASE_POSITION[1] + 0.216, UNREALROBOT_BASE_POSITION[1] + 0.16]


def convertUnreal(waypoint):

    positionDiff = np.array([-(waypoint['position']['x'] - UNREAL_TABLE_ZERO[0]) /
                            100, (waypoint['position']['y'] - UNREAL_TABLE_ZERO[1]) /
                            100, (waypoint['position']['z'] - UNREAL_TABLE_ZERO[2]) /
                            100])
    zeroPos = np.array(ZERO_POSITION)

    x, y, z = (zeroPos + positionDiff).tolist()

    roll, pitch, yaw = waypoint['orientation']['roll'], waypoint['orientation']['pitch'], waypoint['orientation']['yaw']
    roll = -roll
    yaw = - yaw
    pitch = pitch

    rot = Rotation.from_euler(
        'ZYX', [yaw, pitch, roll], degrees=True).as_euler('XYZ', degrees=False)

    return [
        x, y, z,
        rot[0],
        rot[1],
        rot[2]
    ]


@ app.route("/")
def home():
    return jsonify({"message": "ok"})


@ app.route("/zero")
def zero():

    j = Kinmatics.calculate_fk([0, 0, 0, 0, -90, 0])

    end_pos = [ZERO_POSITION[0], ZERO_POSITION[1],
               ZERO_POSITION[2], j[3], j[4], j[5]]
    ik = Kinmatics.calculate_ik(end_pos)

    return jsonify(ik.tolist())


@ app.route("/planvr", methods=['POST'])
def plan():
    waypoints = request.json['waypoints']
    start = request.json['start']
    res = [start]
    last_working_j = copy.deepcopy(start)
    for pt in waypoints:
        j = Kinmatics.calculate_ik(convertUnreal(pt))
        if j is None:
            print("WARNING: Failed to calcuate IK for:", pt)
            j = copy.deepcopy(last_working_j)
        else:
            last_working_j = copy.deepcopy(j)
        j = j.tolist()
        j.append(pt['lightStatus'])
        res.append(j)
    return jsonify({"success": True, "points": res})


if __name__ == "__main__":
    from waitress import serve
    print("Start server at port=5002")
    serve(app, host="0.0.0.0", port=5002)
