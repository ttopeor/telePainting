import open3d as o3d
import time
import json
import numpy as np
from os.path import join, realpath, dirname
from os import getcwd
import math
import copy
import argparse

from utility import quit_if_scanner_busy, get_path


SNAP_SHOT_FILE = 'last_snapshot.pts'
SNAP_SHOT_PATH = join(getcwd(), SNAP_SHOT_FILE)

CONFIG_PATH = 'config'

SETUP_CONFIG_PATH = get_path(join(CONFIG_PATH, 'setup.json'))
K4A_CONFIG_PATH = get_path(join(CONFIG_PATH, 'config.json'))
CALIBRATE_MATRIX_PATH = get_path(join(CONFIG_PATH, 'calibrate.json'))

VOXEL_RADIUS = 0.001
SNAPSHOT_ITER = 20
TABLE_SIZE_X = 0.58  # m
TABLE_SIZE_Y = 0.43  # m
TABLE_SIZE_Z = 0.5  # m


def load_json(file_path):
    with open(file_path) as f:
        js = json.load(f)
    return js


def get_point_cloud_by_camera(st, save_to_file=False):
    k4a_config = o3d.io.read_azure_kinect_sensor_config(K4A_CONFIG_PATH)
    camera_intrinsic_path = get_path(join(CONFIG_PATH, st['intrinsic']))
    camera_transformation = st['transformation']
    camera_id = st['id']
    camera_intrinsic = o3d.io.read_pinhole_camera_intrinsic(
        camera_intrinsic_path)
    sensor = o3d.io.AzureKinectSensor(k4a_config)
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
        # apply initial transition and rough crop
        pcd.transform(camera_transformation)
        pcd = pcd.crop(o3d.geometry.AxisAlignedBoundingBox(np.array(
            [-TABLE_SIZE_X * 2, -TABLE_SIZE_Y * 2, -TABLE_SIZE_Z * 2]), np.array([TABLE_SIZE_X * 2, TABLE_SIZE_Y * 2, TABLE_SIZE_Z * 2])))
        pcd, removed = pcd.remove_statistical_outlier(
            nb_neighbors=5, std_ratio=0.2)

        iter_remain = iter_remain - 1
        time.sleep(0.005)
        pcds += pcd
    return pcds


def get_mesh(radius, output):
    setup_config = load_json(SETUP_CONFIG_PATH)
    calibrate_matric = load_json(CALIBRATE_MATRIX_PATH)
    final_pcd = o3d.geometry.PointCloud()
    print('Running with radius/resolution:', radius)
    for key, st in setup_config.items():
        print('Snapshot from camera', key)
        pcd = get_point_cloud_by_camera(st)
        calib_mtx = calibrate_matric[key]['calibrate']
        pcd.transform(calib_mtx)
        pcd = pcd.crop(o3d.geometry.AxisAlignedBoundingBox(np.array(
            [-TABLE_SIZE_X/2, 0, 0]), np.array([TABLE_SIZE_X/2, TABLE_SIZE_Y, TABLE_SIZE_Z])))
        final_pcd += pcd
    print('Processing final point cloud...')
    final_pcd = final_pcd.voxel_down_sample(radius)
    print('3D scan completed:', final_pcd)
    output = join(getcwd(), output)
    print('Saving to file', output)
    o3d.io.write_point_cloud(output, final_pcd, write_ascii=False)
    return final_pcd


def get_args():
    parser = argparse.ArgumentParser(
        description='Azure Kinect Point Cloud Scanner')
    parser.add_argument('-r', '--radius', type=float,
                        default=VOXEL_RADIUS, help='the down sampling voxel radius')

    parser.add_argument(
        '-o', '--output', default=SNAP_SHOT_PATH, help='The output point cloud file path')

    parser.add_argument('-s', '--show', action='store_true',
                        help='Should draw the output in 3D view')

    return parser.parse_args()


if __name__ == "__main__":

    args = get_args()

    quit_if_scanner_busy()

    mesh = get_mesh(args.radius, args.output)

    if args.show:
        mesh_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(size=0.1, origin=[
            0, 0, 0])
        o3d.visualization.draw_geometries([mesh, mesh_frame], zoom=0.3412,
                                          front=[0.096927975261234173, -
                                                 0.9690471930937371, 0.22705176759696721],
                                          lookat=[0.30521282540611194, -
                                                  0.30539666178497488, 0.35091430250748173],
                                          up=[-0.11907845739256506, 0.21519646780619231, 0.96928365364775737])
