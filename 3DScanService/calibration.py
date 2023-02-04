import open3d as o3d
import sys
import time
import json
import numpy as np
from os.path import join
import math
import copy
import sympy
import utility

CONFIG_PATH = 'config'

SETUP_CONFIG_PATH = utility.get_path(join(CONFIG_PATH, 'setup.json'))
K4A_CONFIG_PATH = utility.get_path(join(CONFIG_PATH, 'config.json'))
CALIBRATE_MATRIX_PATH = utility.get_path(join(CONFIG_PATH, 'calibrate.json'))
VOXEL_RADIUS = 0.005
SNAPSHOT_ITER = 10
TABLE_SIZE_X = 0.58  # m
TABLE_SIZE_Y = 0.43  # m
TABLE_SIZE_Z = 0.3  # m
cloud_color = [np.array([1, 0, 0]), np.array([0, 1, 0])]


def load_json(file_path):
    with open(file_path) as f:
        js = json.load(f)
    return js


def get_point_cloud_by_camera(st, save_to_file=False):
    k4a_config = o3d.io.read_azure_kinect_sensor_config(K4A_CONFIG_PATH)
    camera_intrinsic_path = utility.get_path(
        join(CONFIG_PATH, st['intrinsic']))
    camera_transformation = st['transformation']
    camera_id = st['id']
    camera_intrinsic = o3d.io.read_pinhole_camera_intrinsic(
        camera_intrinsic_path)
    print('Camera Transformation:', camera_transformation)
    print('Camera Intrinsic', camera_intrinsic)

    sensor = o3d.io.AzureKinectSensor(k4a_config)
    print('Connecting to device...')
    if not sensor.connect(camera_id):
        raise RuntimeError('Failed to connect to sensor ' + str(camera_id))
        exit(1)

    pcds = o3d.geometry.PointCloud()
    iter_remain = SNAPSHOT_ITER
    while iter_remain > 0:
        rgbd = None
        while rgbd is None:
            time.sleep(0.1)
            rgbd = sensor.capture_frame(True)

        rgbd_image = o3d.geometry.RGBDImage.create_from_color_and_depth(
            rgbd.color, rgbd.depth, convert_rgb_to_intensity=False)
        pcd = o3d.geometry.PointCloud.create_from_rgbd_image(
            rgbd_image, camera_intrinsic)
        pcd.transform(camera_transformation)
        pcd = pcd.crop(o3d.geometry.AxisAlignedBoundingBox(np.array(
            [-TABLE_SIZE_X/1.8, -0.1, -0.005]), np.array([TABLE_SIZE_X/1.8, TABLE_SIZE_Y, TABLE_SIZE_Z])))
        pcd, removed = pcd.remove_statistical_outlier(
            nb_neighbors=5, std_ratio=0.2)
        iter_remain = iter_remain - 1
        time.sleep(0.005)
        pcds += pcd

    pcds = pcds.voxel_down_sample(VOXEL_RADIUS)
    pcds.paint_uniform_color(cloud_color[camera_id])
    if save_to_file:
        o3d.io.write_point_cloud(utility.get_path(
            join('pcds', str(camera_id)+".pcd")), pcds)

    # model, inliers = pcds.segment_plane(distance_threshold=0.02,
    #                                   ransac_n=5,
    #                                   num_iterations=1000)
    # in_cloud = pcds.select_by_index(inliers)
    # calibrated_transform1 = registrate(in_cloud, o3d.io.read_point_cloud('RubberSheet.pcd'), True)
    # # boundingBox = in_cloud.get_axis_aligned_bounding_box()
    # # pcds = pcds.translate(boundingBox.get_center() * -1 + np.array([0,TABLE_SIZE_Y/2,0]))
    # pcds = pcds.transform(calibrated_transform1)
    # calibrated_transform2 = registrate(pcds, o3d.io.read_point_cloud('calibrate.pcd'), True)
    # pcds = pcds.transform(calibrated_transform2)
    return pcds


def calibration(save=False, visualize=False):
    setup_config = load_json(SETUP_CONFIG_PATH)
    reference = o3d.io.read_point_cloud('calibrate.pcd')
    reference.paint_uniform_color(np.array([0, 0, 1]))
    raw_pcds = []
    calibrate_matrix = {}
    for key, st in setup_config.items():
        print("Snapshotting", key, "...")
        pcd = get_point_cloud_by_camera(st)
        transformation_rough = utility.calculate_calibrate_transform(
            pcd, reference)
        pcd = pcd.transform(transformation_rough)
        transformation_detailed = utility.calculate_transform_icp(
            pcd, reference, 0.03, transformation_rough)
        pcd = pcd.transform(transformation_detailed)
        transformation_final = np.matmul(
            transformation_rough, transformation_detailed)

        # manual calibration
        # if key == "fr":
        #     x_offset = 0
        #     y_offset = 0
        #     z_offset = 0
        #     roll_offset = 0
        #     pitch_offset = 0
        #     yaw_offset = 0
        # if key == "rl":
        #     x_offset = 0
        #     y_offset = 0
        #     z_offset = 0
        #     roll_offset = 0
        #     pitch_offset = 0
        #     yaw_offset = 0
        # transformation_xyzrpy = transform_to_xyzrpy(transformation_final)
        # transformation_xyzrpy[0] = transformation_xyzrpy[0] - x_offset
        # transformation_xyzrpy[1] = transformation_xyzrpy[1] - y_offset
        # transformation_xyzrpy[2] = transformation_xyzrpy[2] - z_offset
        # transformation_xyzrpy[3] = transformation_xyzrpy[3] - roll_offset
        # transformation_xyzrpy[4] = transformation_xyzrpy[4] - pitch_offset
        # transformation_xyzrpy[5] = transformation_xyzrpy[5] - yaw_offset
        # transformation = transform_matrix(*transformation_xyzrpy)
        # pcd = pcd.transform(transformation)
        calibrate_matrix[key] = {
            'calibrate': transformation_final.tolist()
        }
        raw_pcds.append(pcd)
    if save:
        print('Saving calibration data to file...')
        with open(CALIBRATE_MATRIX_PATH, 'w') as f:
            json_string = json.dumps(calibrate_matrix)
            f.write(json_string)

    if visualize:
        mesh_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(size=1, origin=[
                                                                       0, 0, 0])
        raw_pcds.append(mesh_frame)
        raw_pcds.append(reference)
        o3d.visualization.draw_geometries(raw_pcds, zoom=0.3412,
                                          front=[
                                              0.096927975261234173, -0.9690471930937371, 0.22705176759696721],
                                          lookat=[
                                              0.30521282540611194, -0.30539666178497488, 0.35091430250748173],
                                          up=[-0.11907845739256506, 0.21519646780619231, 0.96928365364775737])


def transform_matrix(x, y, z, roll, pitch, yaw):
    # Create rotation matrices for roll, pitch, and yaw
    R_x = np.array([[1, 0, 0],
                    [0, np.cos(roll), -np.sin(roll)],
                    [0, np.sin(roll), np.cos(roll)]])
    R_y = np.array([[np.cos(pitch), 0, np.sin(pitch)],
                    [0, 1, 0],
                    [-np.sin(pitch), 0, np.cos(pitch)]])
    R_z = np.array([[np.cos(yaw), -np.sin(yaw), 0],
                    [np.sin(yaw), np.cos(yaw), 0],
                    [0, 0, 1]])

    # Compute the transformation matrix
    R = np.matmul(R_z, np.matmul(R_y, R_x))
    T = np.array([[x], [y], [z]])
    transform = np.hstack((R, T))
    transform = np.vstack((transform, [0, 0, 0, 1]))

    return transform


def transform_to_xyzrpy(transform):
    # Extract the rotation matrix and translation vector from the transformation matrix
    R = transform[:3, :3]
    T = transform[:3, 3:]
    print(R)
    print(T)
    # Extract the x, y, and z values from the translation vector
    x = T[0, 0]
    y = T[1, 0]
    z = T[2, 0]

    # Compute the roll, pitch, and yaw angles from the rotation matrix
    roll = np.arctan2(R[2, 1], R[2, 2])
    pitch = np.arcsin(-R[2, 0])
    yaw = np.arctan2(R[1, 0], R[0, 0])

    return [x, y, z, roll, pitch, yaw]


if __name__ == "__main__":
    utility.quit_if_scanner_busy()
    calibration(True, True)
