from math import pi, cos, sin, sqrt
import numpy as np
import copy
from scipy.spatial.transform import Rotation
#from Simulation_visualization import animate

AR4_CONFIG = [[pi / 2, 0.16977, 0.0642, pi / 2], [pi/2, 0, 0.305, 0],
              [0, 0, 0, pi / 2], [0, 0.22294, 0, -pi/2], [0, 0, 0, pi / 2], [0, 0.06156, 0, 0]]
RANGE_CONFIG = [[-2.9671, 2.9671], [-1.3, 0.819],
                [-1.22, 1.5533], [-1.57, 1.57], [-2, 0.6], [-3.1415, 3.1415]]
last_theta_list = [0, 0, 0, 0, 0, 0]


def get_dh_matrix(cfg):
    theta, d, a, alpha = cfg

    return np.matrix([[cos(theta), -sin(theta) * cos(alpha), sin(theta) * sin(alpha), a * cos(theta)],
                      [sin(theta), cos(theta) * cos(alpha), -
                       cos(theta) * sin(alpha), a * sin(theta)],
                      [0, sin(alpha), cos(alpha), d],
                      [0, 0, 0, 1]])


def forward_kinematics(angles, config=AR4_CONFIG):
    f_config = copy.deepcopy(config)
    f_config[0][0] = f_config[0][0]+angles[0]
    f_config[1][0] = f_config[1][0]+angles[1]
    f_config[2][0] = f_config[2][0]+angles[2]
    f_config[3][0] = f_config[3][0]+angles[3]
    f_config[4][0] = f_config[4][0]+angles[4]
    f_config[5][0] = f_config[5][0]+angles[5]
    H_0_1 = get_dh_matrix(f_config[0])
    H_1_2 = get_dh_matrix(f_config[1])
    H_2_3 = get_dh_matrix(f_config[2])
    H_3_4 = get_dh_matrix(f_config[3])
    H_4_5 = get_dh_matrix(f_config[4])
    H_5_6 = get_dh_matrix(f_config[5])

    T_1_2 = np.dot(H_0_1, H_1_2)
    T_2_3 = np.dot(T_1_2, H_2_3)
    T_3_4 = np.dot(T_2_3, H_3_4)
    T_4_5 = np.dot(T_3_4, H_4_5)
    T_5_6 = np.dot(T_4_5, H_5_6)
    final = T_5_6
    x = final[0, 3]
    y = final[1, 3]
    z = final[2, 3]
    # XYZ rotation angles from X0Z0Y0 to X6Z6Y6
    #R_0_6 = final[0:3, 0:3]
    #Rx = -np.arctan(-R_0_6[1, 2] / R_0_6[2, 2])
    #Ry = -np.arctan(R_0_6[0, 2] * np.cos(Rx) / R_0_6[2, 2])
    #Rz = -np.arctan(-R_0_6[0, 1] / R_0_6[0, 0])

    # tool_pos = [x, y, z, Rx, Ry, Rz]
    T_0_6 = final

    r = Rotation.from_matrix(final[0:3, 0:3])
    angles = r.as_euler("XYZ", degrees=False)

    tool_pos = [x, y, z, angles[0], angles[1], angles[2]]
    #tool_pos2 = [x, y, z, Rx, Ry, Rz]

    return {
        "T_0_6": T_0_6,
        "tool_pos": tool_pos,
        "Trans_matrix_list": [H_0_1, T_1_2, T_2_3, T_3_4, T_4_5, T_5_6]
    }


def Inverse_kinematics(T_0_6):
    global last_theta_list
    theta_list = []
    all_IK_solusion = get_all_IK_solusion(T_0_6)
    delta_distances = []
    if all_IK_solusion != None:
        for solusion in all_IK_solusion:
            delta_distance = abs(solusion[0] - last_theta_list[0]) + abs(solusion[1] - last_theta_list[1]) + abs(solusion[2] - last_theta_list[2]) + abs(
                solusion[3] - last_theta_list[3]) + abs(solusion[4] - last_theta_list[4]) + abs(solusion[5] - last_theta_list[5])
            delta_distances.append(delta_distance)
        min_value = min(delta_distances)
        min_index = delta_distances.index(min_value)
        theta_list = all_IK_solusion[min_index]

        last_theta_list = copy.deepcopy(theta_list)
        return theta_list
    return None


def get_theta1(T_0_6):
    config = np.matrix(AR4_CONFIG)
    O_0_c = np.matrix([T_0_6[0, 3] - config[5, 1]*T_0_6[0, 2],
                       T_0_6[1, 3] - config[5, 1]*T_0_6[1, 2],
                       T_0_6[2, 3] - config[5, 1]*T_0_6[2, 2]]).transpose()
    # theta1a theta1b
    theta1a = -np.arctan2(O_0_c[0, 0], O_0_c[1, 0])
    theta1b = pi-np.arctan2(O_0_c[0, 0], O_0_c[1, 0])
    return [theta1a, theta1b]


def get_theta3_theta2(T_0_6, theta1):
    config = np.matrix(AR4_CONFIG)
    O_0_c = np.matrix([T_0_6[0, 3] - config[5, 1]*T_0_6[0, 2],
                       T_0_6[1, 3] - config[5, 1]*T_0_6[1, 2],
                       T_0_6[2, 3] - config[5, 1]*T_0_6[2, 2]]).transpose()
    s = O_0_c[2, 0] - config[0, 1]

    x2 = -config[0, 2]*sin(theta1)
    y2 = config[0, 2]*cos(theta1)

    r = sqrt((O_0_c[0, 0] - x2)**2 + (O_0_c[1, 0] - y2)**2)
    r = -r if (O_0_c[0, 0] * x2) < 0 else r

    D = (r**2 + s**2 - config[1, 2]**2 -
         config[3, 1]**2)/(-2*config[1, 2]*config[3, 1])
    P = 1-D**2
    if (P <= 0) and (P > -0.001):
        P = 0
    if (P < 0):
        return [[None, None], [None, None]]
    phi3a = np.arctan2(sqrt(P), D)
    theta3a = phi3a - pi/2
    theta2a = np.arctan2(
        s, r)+np.arctan2(config[3, 1]*sin(pi-phi3a), config[1, 2] + config[3, 1]*cos(pi-phi3a)) - pi/2

    phi3b = np.arctan2(-sqrt(P), D)
    theta3b = phi3b - pi/2
    theta2b = np.arctan2(
        s, r)+np.arctan2(config[3, 1]*sin(pi-phi3b), config[1, 2] + config[3, 1]*cos(pi-phi3b)) - pi/2

    return [[theta3a, theta3b], [theta2a, theta2b]]


def get_theta5_theta4_theta6(T_0_6, theta1, theta2, theta3, last_theta_list=last_theta_list):
    if theta1 != None and theta2 != None and theta3 != None:
        F = T_0_6[0, 2]*(sin(theta1)*sin(theta2)*cos(theta3)+sin(theta1)*cos(theta2)*sin(theta3)) + \
            T_0_6[1, 2]*(-cos(theta1)*sin(theta2)*cos(theta3)-cos(theta1)*cos(theta2)*sin(theta3)) + \
            T_0_6[2, 2]*(-sin(theta2)*sin(theta3)+cos(theta2)*cos(theta3))
        G = T_0_6[0, 2]*cos(theta1)+T_0_6[1, 2]*sin(theta1)
        E = T_0_6[0, 2]*(sin(theta1)*sin(theta2)*sin(theta3)-sin(theta1)*cos(theta2)*cos(theta3)) + \
            T_0_6[1, 2]*(cos(theta1)*cos(theta2)*cos(theta3)-cos(theta1)*sin(theta2)*sin(theta3)) + \
            T_0_6[2, 2]*(cos(theta2)*sin(theta3)+sin(theta2)*cos(theta3))
        H = -T_0_6[0, 0]*(sin(theta1)*sin(theta2)*sin(theta3)-sin(theta1)*cos(theta2)*cos(theta3)) - \
            T_0_6[1, 0]*(cos(theta1)*cos(theta2)*cos(theta3)-cos(theta1)*sin(theta2)*sin(theta3)) - \
            T_0_6[2, 0]*(cos(theta2)*sin(theta3)+sin(theta2)*cos(theta3))
        K = T_0_6[0, 1]*(sin(theta1)*sin(theta2)*sin(theta3)-sin(theta1)*cos(theta2)*cos(theta3)) + \
            T_0_6[1, 1]*(cos(theta1)*cos(theta2)*cos(theta3)-cos(theta1)*sin(theta2)*sin(theta3)) + \
            T_0_6[2, 1]*(cos(theta2)*sin(theta3)+sin(theta2)*cos(theta3))
        R_0_3_t = np.matrix([[sin(theta1)*sin(theta2)*cos(theta3)+sin(theta1)*cos(theta2)*sin(theta3), cos(theta1), sin(theta1)*sin(theta2)*sin(theta3)-sin(theta1)*cos(theta2)*cos(theta3)],
                             [-cos(theta1)*sin(theta2)*cos(theta3)-cos(theta1)*cos(theta2)*sin(theta3), sin(
                              theta1), cos(theta1)*cos(theta2)*cos(theta3)-cos(theta1)*sin(theta2)*sin(theta3)],
                             [-sin(theta2)*sin(theta3)+cos(theta2)*cos(theta3), 0, cos(theta2)*sin(theta3)+sin(theta2)*cos(theta3)]]).transpose()
        R_0_6 = T_0_6[0:3, 0:3]
        R_3_6 = np.dot(R_0_3_t, R_0_6)
        r = Rotation.from_matrix(R_3_6[0:3, 0:3])

        L = 1-E**2
        if (L <= 0) and (L >= -0.001):
            L = 0
        theta5a = np.arctan2(sqrt(L), E)
        if sin(theta5a) > 0:
            theta4a = np.arctan2(G, F)
            theta6a = np.arctan2(K, H)
        elif sin(theta5a) < 0:
            theta4a = np.arctan2(-G, -F)
            theta6a = np.arctan2(-K, -H)
        elif sin(theta5a) == 0:
            angles = r.as_euler("XYZ", degrees=False)
            gamma = angles[2]
            theta4a = last_theta_list[3]
            theta6a = gamma-theta4a

        theta5b = np.arctan2(-sqrt(L), E)
        if sin(theta5b) > 0:
            theta4b = np.arctan2(G, F)
            theta6b = np.arctan2(K, H)
        elif sin(theta5b) < 0:
            theta4b = np.arctan2(-G, -F)
            theta6b = np.arctan2(-K, -H)
        elif sin(theta5b) == 0:
            angles = r.as_euler("XYZ", degrees=False)
            gamma = angles[2]
            theta4b = last_theta_list[3]
            theta6b = gamma-theta4b

        return [[theta5a, theta5b], [theta4a, theta4b], [theta6a, theta6b]]
    else:
        return [[None, None], [None, None], [None, None]]


def get_all_IK_solusion(T_0_6, cfg=AR4_CONFIG, range_config=RANGE_CONFIG):
    theta1 = get_theta1(T_0_6)
    theta1a = theta1[0]
    theta1b = theta1[1]

    theta3ab_theta2ab = get_theta3_theta2(T_0_6, theta1a)
    theta3cd_theta2cd = get_theta3_theta2(T_0_6, theta1b)
    theta3a = theta3ab_theta2ab[0][0]
    theta3b = theta3ab_theta2ab[0][1]
    theta2a = theta3ab_theta2ab[1][0]
    theta2b = theta3ab_theta2ab[1][1]

    theta3c = theta3cd_theta2cd[0][0]
    theta3d = theta3cd_theta2cd[0][1]
    theta2c = theta3cd_theta2cd[1][0]
    theta2d = theta3cd_theta2cd[1][1]

    theta5ab_theta4ab_theta6ab = get_theta5_theta4_theta6(
        T_0_6, theta1a, theta2a, theta3a)
    theta5cd_theta4cd_theta6cd = get_theta5_theta4_theta6(
        T_0_6, theta1a, theta2b, theta3b)
    theta5ef_theta4ef_theta6ef = get_theta5_theta4_theta6(
        T_0_6, theta1b, theta2c, theta3c)
    theta5gh_theta4gh_theta6gh = get_theta5_theta4_theta6(
        T_0_6, theta1b, theta2d, theta3d)
    theta5a = theta5ab_theta4ab_theta6ab[0][0]
    theta5b = theta5ab_theta4ab_theta6ab[0][1]
    theta4a = theta5ab_theta4ab_theta6ab[1][0]
    theta4b = theta5ab_theta4ab_theta6ab[1][1]
    theta6a = theta5ab_theta4ab_theta6ab[2][0]
    theta6b = theta5ab_theta4ab_theta6ab[2][1]

    theta5c = theta5cd_theta4cd_theta6cd[0][0]
    theta5d = theta5cd_theta4cd_theta6cd[0][1]
    theta4c = theta5cd_theta4cd_theta6cd[1][0]
    theta4d = theta5cd_theta4cd_theta6cd[1][1]
    theta6c = theta5cd_theta4cd_theta6cd[2][0]
    theta6d = theta5cd_theta4cd_theta6cd[2][1]

    theta5e = theta5ef_theta4ef_theta6ef[0][0]
    theta5f = theta5ef_theta4ef_theta6ef[0][1]
    theta4e = theta5ef_theta4ef_theta6ef[1][0]
    theta4f = theta5ef_theta4ef_theta6ef[1][1]
    theta6e = theta5ef_theta4ef_theta6ef[2][0]
    theta6f = theta5ef_theta4ef_theta6ef[2][1]

    theta5g = theta5gh_theta4gh_theta6gh[0][0]
    theta5h = theta5gh_theta4gh_theta6gh[0][1]
    theta4g = theta5gh_theta4gh_theta6gh[1][0]
    theta4h = theta5gh_theta4gh_theta6gh[1][1]
    theta6g = theta5gh_theta4gh_theta6gh[2][0]
    theta6h = theta5gh_theta4gh_theta6gh[2][1]

    sol1 = [theta1a, theta2a, theta3a, theta4a, theta5a, theta6a]
    sol2 = [theta1a, theta2a, theta3a, theta4b, theta5b, theta6b]
    sol3 = [theta1a, theta2b, theta3b, theta4c, theta5c, theta6c]
    sol4 = [theta1a, theta2b, theta3b, theta4d, theta5d, theta6d]
    sol5 = [theta1b, theta2c, theta3c, theta4e, theta5e, theta6e]
    sol6 = [theta1b, theta2c, theta3c, theta4f, theta5f, theta6f]
    sol7 = [theta1b, theta2d, theta3d, theta4g, theta5g, theta6g]
    sol8 = [theta1b, theta2d, theta3d, theta4h, theta5h, theta6h]

    sol_list = [sol1, sol2, sol3, sol4, sol5, sol6, sol7, sol8]
    # for sol in sol_list:
    #    print("sol", sol)
    IK_sols = []
    in_range = False
    j = 0
    i = 0
    while j < 8:
        while i < 6:
            if sol_list[j][i] != None:
                if sol_list[j][i] > range_config[i][0] and sol_list[j][i] < range_config[i][1]:
                    in_range = True
                    i = i+1
                else:
                    i = 6
                    in_range = False
            else:
                i = 6
                in_range = False
        if in_range:
            IK_sols.append(sol_list[j])
            in_range = False
        i = 0
        j = j+1
    if len(IK_sols) == 0:
        x = T_0_6[0, 3]
        y = T_0_6[1, 3]
        z = T_0_6[2, 3]
        r = Rotation.from_matrix(T_0_6[0:3, 0:3])
        angles = r.as_euler("XYZ", degrees=False)
        tool_pos = [x, y, z, angles[0], angles[1], angles[2]]

        print("out of workspace:", tool_pos)
        return None
    return IK_sols


def rotation_matrix(tool_position):
    angles = [tool_position[3], tool_position[4], tool_position[5]]
    r = Rotation.from_euler("XYZ", angles, degrees=False)
    new_rotation_matrix = r.as_matrix()

    pos = np.matrix([tool_position[0], tool_position[1],
                    tool_position[2]]).transpose()
    null_trans = np.matrix([0, 0, 0, 1])

    T = np.hstack((new_rotation_matrix, pos))
    T = np.vstack((T, null_trans))

    return T


def calculate_ik(position):

    # mtx = np.matrix([[-6.1232340e-17, 1.0000000e+00,  1.2246468e-16, position[0]],
    #                  [6.1232340e-17, - 1.2246468e-16,
    #                      1.0000000e+00,  position[1]],
    #                  [1.0000000e+00,  6.1232340e-17, - 6.1232340e-17,  position[2]],
    #                  [0.0000000e+00,  0.0000000e+00,  0.0000000e+00, 1.0000000e+00]])

    mtx = rotation_matrix(position)
    ik = Inverse_kinematics(mtx)
    if ik is not None:
        res = [(x * 180 / pi) for x in ik]
        return np.array(res)
    else:
        return None


def calculate_fk(angles):
    # angle =Z
    #print("FK", angles)
    pos = forward_kinematics([(x * pi / 180) for x in angles])
    return np.array(pos['tool_pos'])


if __name__ == "__main__":
    print("test begining")
    # AR4 DH - config [theta, d, a, alpha]
    theta1 = 0
    theta2 = 0
    theta3 = 0
    theta4 = 0
    theta5 = 0
    theta6 = 0
    theta_list = [theta1, theta2, theta3, theta4, theta5, theta6]
    # print("input angles:", [round((x * 180 / pi), 3) for x in theta_list])
    # print("output angles:", [round((x * 180 / pi), 3) for x in Inverse_kinematics(rotation_matrix(
    #     forward_kinematics(theta_list, AR4_CONFIG)["tool_pos"]))])
    Trans_matrix_list = forward_kinematics(
        [theta1, theta2, theta3, theta4, theta5, theta6])
    print(Rotation.from_euler(
        "XYZ", Trans_matrix_list['tool_pos'][3:], False).as_quat())
    # print(Trans_matrix_list['tool_pos'])
    # animate([Trans_matrix_list])
