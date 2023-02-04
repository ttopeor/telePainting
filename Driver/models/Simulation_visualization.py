from math import pi, cos, sin, sqrt
import numpy as np
import copy
from scipy.spatial.transform import Rotation
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.patches import FancyArrowPatch
from mpl_toolkits.mplot3d import proj3d
from functools import partial
from matplotlib.animation import FuncAnimation
from .Kinmatics import forward_kinematics, Inverse_kinematics, rotation_matrix

# from trajectory_planning import point_to_point
HZ = 200
FPS = 20
#HORIZONTAL_WORKSPACE_CENTER = [0, 0.33, 0.16, pi, 0, pi/2]
#ZERO_POINT = forward_kinematics([0, 0, 0, 0, 0, 0])['tool_pos']


class Arrow3D(FancyArrowPatch):
    def __init__(self, xs, ys, zs, *args, **kwargs):
        FancyArrowPatch.__init__(self, (0, 0), (0, 0), *args, **kwargs)
        self._verts3d = xs, ys, zs

    def do_3d_projection(self, renderer=None):
        xs3d, ys3d, zs3d = self._verts3d
        xs, ys, zs = proj3d.proj_transform(xs3d, ys3d, zs3d, self.axes.M)
        self.set_positions((xs[0], ys[0]), (xs[1], ys[1]))
        return np.min(zs)


def get_vector(x0, y0, z0, x1, y1, z1, color, arrow_size=10):
    vector = Arrow3D([x0, x1], [y0, y1],
                     [z0, z1], mutation_scale=arrow_size,
                     lw=1, arrowstyle="-|>", color=color)
    return vector


def get_coordinate(T):
    x_axis0 = np.matrix([50, 0, 0]).transpose()
    y_axis0 = np.matrix([0, 50, 0]).transpose()
    z_axis0 = np.matrix([0, 0, 50]).transpose()

    x_axis_rot = np.dot(np.linalg.inv(T[0:3, 0:3]), x_axis0)
    y_axis_rot = np.dot(np.linalg.inv(T[0:3, 0:3]), y_axis0)
    z_axis_rot = np.dot(np.linalg.inv(T[0:3, 0:3]), z_axis0)

    x0 = T[0, 3]*1000
    y0 = T[1, 3]*1000
    z0 = T[2, 3]*1000
    offset = 0.08
    # print([x0, y0, z0, x0+x_axis_rot[0, 0], y0 +
    #     y_axis_rot[0, 0], z0+z_axis_rot[0, 0]])
    x_axis = get_vector(
        x0-offset*x_axis_rot[0, 0], y0-offset*y_axis_rot[0, 0], z0-offset*z_axis_rot[0, 0], x0+x_axis_rot[0, 0], y0 + y_axis_rot[0, 0], z0+z_axis_rot[0, 0], "red")
    y_axis = get_vector(
        x0-offset*x_axis_rot[1, 0], y0-offset*y_axis_rot[1, 0], z0-offset*z_axis_rot[1, 0], x0+x_axis_rot[1, 0], y0+y_axis_rot[1, 0], z0+z_axis_rot[1, 0], "green")
    z_axis = get_vector(
        x0-offset*x_axis_rot[2, 0], y0-offset*y_axis_rot[2, 0], z0-offset*z_axis_rot[2, 0], x0+x_axis_rot[2, 0], y0+y_axis_rot[2, 0], z0+z_axis_rot[2, 0], "blue")

    return [x_axis, y_axis, z_axis]


def get_coordinates(Trans_matrix_list):
    components = []
    Global_x_axis = get_vector(
        -8, 0, 0, 200, 0, 0, "red")
    Global_y_axis = get_vector(
        0, -8, 0, 0, 200, 0, "green")
    Global_z_axis = get_vector(
        0, 0, -8, 0, 0, 200, "blue")
    components.append(Global_x_axis)
    components.append(Global_y_axis)
    components.append(Global_z_axis)
    x0 = 0
    y0 = 0
    z0 = 0
    for i in range(6):
        # for i in range(len(Trans_matrix_list)):
        x1 = Trans_matrix_list[i][0, 3]*1000
        y1 = Trans_matrix_list[i][1, 3]*1000
        z1 = Trans_matrix_list[i][2, 3]*1000
        link = get_vector(x0, y0, z0, x1, y1, z1, color="grey", arrow_size=1)
        components.append(link)
        x0 = x1
        y0 = y1
        z0 = z1
        for axis in get_coordinate(Trans_matrix_list[i]):
            components.append(axis)

    return components


def display_all(traj):
    fig = plt.figure(figsize=(7, 7))
    ax = fig.add_subplot(111, projection='3d')
    for cartesian_pos in traj[::100]:
        matrix = rotation_matrix(cartesian_pos)
        joint_pos = Inverse_kinematics(matrix)
        if (joint_pos is not None):
            Trans_matrix_list = forward_kinematics(joint_pos)[
                "Trans_matrix_list"]
            one_pose = get_coordinates(Trans_matrix_list)
            for vectors in one_pose:
                ax.add_artist(vectors)
    ax.set_xlabel('x_values')
    ax.set_ylabel('y_values')
    ax.set_zlabel('z_values')
    ax.set_xlim(-300, 300)
    ax.set_ylim(-100, 500)
    ax.set_zlim(-100, 500)
    plt.title('vectors')
    plt.show()


def get_frame(num, traj):
    frame = []
    cartesian_pos = traj[num]
    matrix = rotation_matrix(cartesian_pos)
    joint_pos = Inverse_kinematics(matrix)
    if (joint_pos is not None):
        Trans_matrix_list = forward_kinematics(joint_pos)[
            "Trans_matrix_list"]
        one_pose = get_coordinates(Trans_matrix_list)
        for vectors in one_pose:
            frame.append(vectors)
    return frame


def animate(traj, hz=HZ, fps=FPS, repeat=True):
    fig = plt.figure(figsize=(7, 7))
    ax = fig.add_subplot(111, projection='3d')
    ax.set_xlabel('x_values')
    ax.set_ylabel('y_values')
    ax.set_zlabel('z_values')
    ax.set_xlim(-300, 300)
    ax.set_ylim(-100, 500)
    ax.set_zlim(-100, 500)
    plt.title('AR4 Mod')

    traj_len = len(traj)
    frames = [get_frame(num, traj) for num in range(traj_len)[::int(hz/fps)]]

    anim = FuncAnimation(fig,
                         partial(update_plot, frames=frames, ax=ax),
                         frames=np.arange(0, len(frames)),
                         init_func=partial(init_func, ax=ax), interval=1000/fps, repeat=repeat)
    plt.show()


def init_func(ax):
    ax.clear()


def update_plot(i, frames, ax):
    if (len(frames[i]) > 0):
        ax.clear()
        ax.set_xlabel('x_values')
        ax.set_ylabel('y_values')
        ax.set_zlabel('z_values')
        ax.set_xlim(-300, 300)
        ax.set_ylim(-100, 500)
        ax.set_zlim(-100, 500)
        for vector in frames[i]:
            ax.add_artist(vector)


if __name__ == "__main__":
    theta1 = 0
    theta2 = 0
    theta3 = 0
    theta4 = pi/2
    theta5 = -pi/6
    theta6 = pi/6
    # Trans_matrix_list = forward_kinematics([theta1, theta2, theta3, theta4, theta5, theta6])[
    #    "Trans_matrix_list"]
    # visualize_coordinates(Trans_matrix_list)
    # animate()
