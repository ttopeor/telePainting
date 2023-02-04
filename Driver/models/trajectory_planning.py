from tools.config import Config
#from config import Config
from scipy.spatial.transform import Rotation
import copy
import numpy as np
from math import pi, cos, sin, sqrt
from .Kinmatics import Inverse_kinematics, rotation_matrix, forward_kinematics
from .Simulation_visualization import animate


TRAJECTORY_SPEED = 0.1  # m/s
HZ = 200  # 1/s

HORIZONTAL_WORKSPACE_CENTER = [0, 0.33, 0.16, pi, 0, pi/2]
ZERO_POINT = forward_kinematics([0, 0, 0, 0, 0, 0])['tool_pos']


def from_zero_point_to_initial_point(initial_point):
    traj = []
    zeropoint = forward_kinematics([0, 0, 0, 0, 0, 0])['tool_pos']

    #traj = point_to_point_rotate_first(zeropoint, initial_point)
    traj = point_to_point_rotate_first(zeropoint, initial_point)
    return traj


def from_end_point_to_zero_point(end_point):
    traj = []
    zeropoint = forward_kinematics([0, 0, 0, 0, 0, 0])['tool_pos']

    traj = point_to_point_rotate_last(end_point, zeropoint)
    return traj


def point_to_point_rotate_first(previous_endpos, next_endpos, v=TRAJECTORY_SPEED, hz=int(1 / Config.WriteSpeedInterval)):
    rotate_time = 3
    traj = []
    position = copy.deepcopy(previous_endpos)
    next_endpos_dir_mod = copy.deepcopy(next_endpos)
    for i in [3, 4, 5]:
        if abs(next_endpos[i] - previous_endpos[i]) > abs(previous_endpos[i]-(next_endpos[i] + 2*pi)):
            next_endpos_dir_mod[i] = next_endpos[i] + 2*pi
        if abs(next_endpos[i] - previous_endpos[i]) > abs(previous_endpos[i]-(next_endpos[i] - 2*pi)):
            next_endpos_dir_mod[i] = next_endpos[i] - 2*pi
    # rotate
    Rx = np.linspace(
        previous_endpos[3], next_endpos_dir_mod[3], int(hz*rotate_time))
    Ry = np.linspace(
        previous_endpos[4], next_endpos_dir_mod[4], int(hz*rotate_time))
    Rz = np.linspace(
        previous_endpos[5], next_endpos_dir_mod[5], int(hz*rotate_time))

    for i in range(int(hz*rotate_time)):
        position[3] = Rx[i]
        position[4] = Ry[i]
        position[5] = Rz[i]
        traj.append(copy.deepcopy(position))
    # translation
    x_distance = abs(next_endpos[0]-previous_endpos[0])
    y_distance = abs(next_endpos[1]-previous_endpos[1])
    z_distance = abs(next_endpos[2]-previous_endpos[2])
    time = sqrt(x_distance**2 + y_distance**2 + z_distance**2)/v
    x = np.linspace(previous_endpos[0], next_endpos[0], num=int(hz*time))
    y = np.linspace(previous_endpos[1], next_endpos[1], num=int(hz*time))
    z = np.linspace(previous_endpos[2], next_endpos[2], num=int(hz*time))
    for i in range(int(hz*time)):
        position[0] = x[i]
        position[1] = y[i]
        position[2] = z[i]
        traj.append(copy.deepcopy(position))
    return traj


def point_to_point_rotate_last(previous_endpos, next_endpos, v=TRAJECTORY_SPEED, hz=int(1 / Config.WriteSpeedInterval)):
    rotate_time = 3
    traj = []
    position = copy.deepcopy(previous_endpos)
    # translation
    x_distance = abs(next_endpos[0]-previous_endpos[0])
    y_distance = abs(next_endpos[1]-previous_endpos[1])
    z_distance = abs(next_endpos[2]-previous_endpos[2])
    time = sqrt(x_distance**2 + y_distance**2 + z_distance**2)/v
    x = np.linspace(previous_endpos[0], next_endpos[0], num=int(hz*time))
    y = np.linspace(previous_endpos[1], next_endpos[1], num=int(hz*time))
    z = np.linspace(previous_endpos[2], next_endpos[2], num=int(hz*time))
    for i in range(int(hz*time)):
        position[0] = x[i]
        position[1] = y[i]
        position[2] = z[i]
        traj.append(copy.deepcopy(position))

    next_endpos_dir_mod = copy.deepcopy(next_endpos)
    for i in [3, 4, 5]:
        if abs(next_endpos[i] - position[i]) > abs(position[i]-(next_endpos[i] + 2*pi)):
            next_endpos_dir_mod[i] = next_endpos[i] + 2*pi
        if abs(next_endpos[i] - position[i]) > abs(position[i]-(next_endpos[i] - 2*pi)):
            next_endpos_dir_mod[i] = next_endpos[i] - 2*pi
    # rotate
    Rx = np.linspace(
        position[3], next_endpos_dir_mod[3], int(hz*rotate_time))
    Ry = np.linspace(
        position[4], next_endpos_dir_mod[4], int(hz*rotate_time))
    Rz = np.linspace(
        position[5], next_endpos_dir_mod[5], int(hz*rotate_time))

    for i in range(int(hz*rotate_time)):
        position[3] = Rx[i]
        position[4] = Ry[i]
        position[5] = Rz[i]
        traj.append(copy.deepcopy(position))
    return traj


def point_to_point(previous_endpos, next_endpos, v=TRAJECTORY_SPEED, hz=int(1 / Config.WriteSpeedInterval)):
    traj = []
    position = copy.deepcopy(previous_endpos)
    x_distance = abs(next_endpos[0]-previous_endpos[0])
    y_distance = abs(next_endpos[1]-previous_endpos[1])
    z_distance = abs(next_endpos[2]-previous_endpos[2])
    time = sqrt(x_distance**2 + y_distance**2 + z_distance**2)/v
    x = np.linspace(previous_endpos[0], next_endpos[0], num=int(hz*time))
    y = np.linspace(previous_endpos[1], next_endpos[1], num=int(hz*time))
    z = np.linspace(previous_endpos[2], next_endpos[2], num=int(hz*time))

    next_endpos_dir_mod = copy.deepcopy(next_endpos)
    for i in [3, 4, 5]:
        if abs(next_endpos[i] - previous_endpos[i]) > abs(previous_endpos[i]-(next_endpos[i] + 2*pi)):
            next_endpos_dir_mod[i] = next_endpos[i] + 2*pi
        if abs(next_endpos[i] - previous_endpos[i]) > abs(previous_endpos[i]-(next_endpos[i] - 2*pi)):
            next_endpos_dir_mod[i] = next_endpos[i] - 2*pi

    Rx = np.linspace(previous_endpos[3],
                     next_endpos_dir_mod[3], num=int(hz*time))
    Ry = np.linspace(previous_endpos[4],
                     next_endpos_dir_mod[4], num=int(hz*time))
    Rz = np.linspace(previous_endpos[5],
                     next_endpos_dir_mod[5], num=int(hz*time))
    for i in range(int(hz*time)):
        position[0] = x[i]
        position[1] = y[i]
        position[2] = z[i]
        position[3] = Rx[i]
        position[4] = Ry[i]
        position[5] = Rz[i]
        traj.append(copy.deepcopy(position))
    return traj


def stay_for_1seconds(endpos, hz=int(1 / Config.WriteSpeedInterval)):
    traj = []
    for i in range(hz):
        traj.append(endpos)
    return traj


def stay_for_2seconds(endpos, hz=int(1 / Config.WriteSpeedInterval)):
    traj = []
    for i in range(2*hz):
        traj.append(endpos)
    return traj


def pick_and_place(center, point1, point2):
    point1_top = copy.deepcopy(point1)
    point1_top[2] = point1_top[2]+0.1
    point2_top = copy.deepcopy(point2)
    point2_top[2] = point2_top[2]+0.1
    traj = []
    zero_to_center = from_zero_point_to_initial_point(center)
    stay1 = stay_for_1seconds(center)
    center_to_point1 = point_to_point(center, point1)
    stay2 = stay_for_1seconds(point1)
    pick_up = point_to_point(point1, point1_top)
    stay3 = stay_for_1seconds(point1_top)
    move_to_point2 = point_to_point(point1_top, point2_top)
    stay4 = stay_for_1seconds(point2_top)
    place = point_to_point(point2_top, point2)
    stay5 = stay_for_1seconds(point2)
    back_to_zero = from_end_point_to_zero_point(point2)

    traj = zero_to_center + stay1+center_to_point1+stay2 + \
        pick_up+stay3+move_to_point2+stay4+place+stay5+back_to_zero
    return traj


def square(a=0.15, v=TRAJECTORY_SPEED, hz=int(1 / Config.WriteSpeedInterval)):
    num_of_points = a/v * hz
    steps = a/num_of_points
    initial_point = [0, 0.3886040843979182, 0.14710902076661908, -
                     1.5707963267948966, 0, -3.125535624471445]
    traj = from_zero_point_to_initial_point(initial_point)
    for i in range(int(num_of_points)):  # Y
        initial_point[1] = initial_point[1] + steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # X
        initial_point[0] = initial_point[0] + steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # Y
        initial_point[1] = initial_point[1] - steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # Y
        initial_point[1] = initial_point[1] - steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # X
        initial_point[0] = initial_point[0] - steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # X
        initial_point[0] = initial_point[0] - steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # Y
        initial_point[1] = initial_point[1] + steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # Y
        initial_point[1] = initial_point[1] + steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # X
        initial_point[0] = initial_point[0] + steps
        traj.append(copy.deepcopy(initial_point))
    for i in range(int(num_of_points)):  # Y
        initial_point[1] = initial_point[1] - steps
        traj.append(copy.deepcopy(initial_point))
    from_end_point_to_zero_point(traj[-1])

    return traj


def zero_angles(currentanlge, hz=int(1 / Config.WriteSpeedInterval)):
    angel_traj = []
    angle = [0] * 6
    theta1 = np.linspace(currentanlge[0], 0, hz)
    theta2 = np.linspace(currentanlge[1], 0, hz)
    theta3 = np.linspace(currentanlge[2], 0, hz)
    theta4 = np.linspace(currentanlge[3], 0, hz)
    theta5 = np.linspace(currentanlge[4], 0, hz)
    theta6 = np.linspace(currentanlge[5], 0, hz)
    for i in range(hz):
        angle[0] = theta1[i]
        angle[1] = theta2[i]
        angle[2] = theta3[i]
        angle[3] = theta4[i]
        angle[4] = theta5[i]
        angle[5] = theta6[i]
        angel_traj.append(copy.deepcopy(angle))
    return angel_traj


def test_traj(tra, hz=int(1 / Config.WriteSpeedInterval)):
    num_of_point = len(tra)
    num_of_workspace_error = 0
    count = 0
    for point in tra:
        mtx = rotation_matrix(point)
        ik = Inverse_kinematics(mtx)
        if ik is not None:
            res = [round((x * 180 / pi), 2) for x in ik]
            count = count + 1
            if count % (hz/10) == 0:
                print(res)
        else:
            print(["No solution", "No solution", "No solution",
                  "No solution", "No solution", "No solution"])
            num_of_workspace_error += 1
    print("Number of points solved:", num_of_point)
    print("Number of points out of workspace:", num_of_workspace_error)
    print("out of workspace persentage:",
          num_of_workspace_error*100/num_of_point, "%")
    print("Time to act:", num_of_point/hz)


def rotation_test():
    center = [0, 0.3886040843979182, 0.24710902076661908, -pi/2, 0, -pi]
    Ry_N_90 = [0, 0.3886040843979182, 0.24710902076661908, -pi/2, -pi/6, -pi]
    Ry_90 = [0, 0.3886040843979182, 0.24710902076661908, -pi/2, pi/6, -pi]
    Rx_N_90 = [0, 0.3886040843979182, 0.24710902076661908, -pi/2-pi/6, 0, -pi]
    Rx_90 = [0, 0.3886040843979182, 0.24710902076661908, -pi/2+pi/6, 0, -pi]
    Rz_N_90 = [0, 0.3886040843979182, 0.24710902076661908, -pi/2, 0, -pi-pi/6]
    Rz_90 = [0, 0.3886040843979182, 0.24710902076661908, -pi/2, 0, -pi+pi/6]

    traj = []
    zero_to_center = from_zero_point_to_initial_point(center)
    stay0 = stay_for_2seconds(center)

    to_Ry_N_90 = point_to_point(center, Ry_N_90)
    stay1 = stay_for_2seconds(Ry_N_90)
    to_Ry_90 = point_to_point(Ry_N_90, Ry_90)
    stay2 = stay_for_2seconds(Ry_90)
    Ry_90_to_center = point_to_point(Ry_90, center)
    stay3 = stay_for_2seconds(center)

    to_Rx_N_90 = point_to_point(center, Rx_N_90)
    stay4 = stay_for_2seconds(Rx_N_90)
    to_Rx_90 = point_to_point(Rx_N_90, Rx_90)
    stay5 = stay_for_2seconds(Rx_90)
    Rx_90_to_center = point_to_point(Rx_90, center)
    stay6 = stay_for_2seconds(center)

    to_Rz_N_90 = point_to_point(center, Rz_N_90)
    stay7 = stay_for_2seconds(Rz_N_90)
    to_Rz_90 = point_to_point(Rz_N_90, Rz_90)
    stay8 = stay_for_2seconds(Rz_90)
    Rz_90_to_center = point_to_point(Rz_90, center)
    stay9 = stay_for_2seconds(center)

    traj = zero_to_center+stay0 +\
        to_Ry_N_90+stay1+to_Ry_90+stay2+Ry_90_to_center+stay3 +\
        to_Rx_N_90+stay4+to_Rx_90+stay5+Rx_90_to_center+stay6 +\
        to_Rz_N_90+stay7+to_Rz_90+stay8+Rz_90_to_center+stay9
    return traj


def yue_traj():

    tra = pick_and_place_example()
    return tra


def pick_and_place_example():
    point1 = [0.17, 0.33, 0.16, pi, 0, pi/2]
    point2 = [-0.17, 0.33, 0.16, pi, 0, pi/2]
    tra = pick_and_place(HORIZONTAL_WORKSPACE_CENTER, point1, point2)
    return tra


if __name__ == "__main__":
    print("test begining")
    tra = pick_and_place_example()
    for i in tra[::50]:
        print(i)
    print(tra[-1])
    # test_traj(tra)
    animate(tra, repeat=True)
