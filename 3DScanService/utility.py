import open3d as o3d
import numpy as np
import fcntl
import os
import sys
from os.path import join, realpath,dirname

voxel_size = 0.015
max_correspondence_distance_coarse = voxel_size * 15
max_correspondence_distance_fine = voxel_size * 1.5


def get_path(p):
    return join(dirname(realpath(__file__)), p)

def quit_if_scanner_busy():
    if instance_already_running():
        print('Scanner is in use, quitting...')
        exit(1)


def instance_already_running(label="scanner"):
    """
    Detect if an an instance with the label is already running, globally
    at the operating system level.

    Using `os.open` ensures that the file pointer won't be closed
    by Python's garbage collector after the function's scope is exited.

    The lock will be released when the program exits, or could be
    released if the file pointer were closed.
    """

    lock_file_pointer = os.open(
        f"/tmp/instance_{label}.lock", os.O_WRONLY | os.O_CREAT)

    try:
        fcntl.lockf(lock_file_pointer, fcntl.LOCK_EX | fcntl.LOCK_NB)
        already_running = False
    except IOError:
        already_running = True

    return already_running


def pairwise_registration(source, target):
    print("Apply point-to-plane ICP")
    icp_coarse = o3d.pipelines.registration.registration_icp(
        source, target, max_correspondence_distance_coarse, np.identity(4),
        o3d.pipelines.registration.TransformationEstimationPointToPlane())
    icp_fine = o3d.pipelines.registration.registration_icp(
        source, target, max_correspondence_distance_fine,
        icp_coarse.transformation,
        o3d.pipelines.registration.TransformationEstimationPointToPlane())
    transformation_icp = icp_fine.transformation
    information_icp = o3d.pipelines.registration.get_information_matrix_from_point_clouds(
        source, target, max_correspondence_distance_fine,
        icp_fine.transformation)
    return transformation_icp, information_icp


def full_registration(pcds, max_correspondence_distance_coarse,
                      max_correspondence_distance_fine):
    pose_graph = o3d.pipelines.registration.PoseGraph()
    odometry = np.identity(4)
    pose_graph.nodes.append(o3d.pipelines.registration.PoseGraphNode(odometry))
    n_pcds = len(pcds)
    for source_id in range(n_pcds):
        for target_id in range(source_id + 1, n_pcds):
            transformation_icp, information_icp = pairwise_registration(
                pcds[source_id], pcds[target_id])
            print("Build o3d.pipelines.registration.PoseGraph")
            if target_id == source_id + 1:  # odometry case
                odometry = np.dot(transformation_icp, odometry)
                pose_graph.nodes.append(
                    o3d.pipelines.registration.PoseGraphNode(
                        np.linalg.inv(odometry)))
                pose_graph.edges.append(
                    o3d.pipelines.registration.PoseGraphEdge(source_id,
                                                             target_id,
                                                             transformation_icp,
                                                             information_icp,
                                                             uncertain=False))
            else:  # loop closure case
                pose_graph.edges.append(
                    o3d.pipelines.registration.PoseGraphEdge(source_id,
                                                             target_id,
                                                             transformation_icp,
                                                             information_icp,
                                                             uncertain=True))
    return pose_graph


def calculate_calibrate_transform(source, reference):

    pcds_down = []

    for pcd in [reference, source]:
        pcd_down = pcd.voxel_down_sample(voxel_size=voxel_size)
        pcd_down.estimate_normals(
            o3d.geometry.KDTreeSearchParamHybrid(radius=voxel_size * 2, max_nn=30))
        pcds_down.append(pcd_down)

    with o3d.utility.VerbosityContextManager(
            o3d.utility.VerbosityLevel.Debug) as cm:
        pose_graph = full_registration(pcds_down,
                                       max_correspondence_distance_coarse,
                                       max_correspondence_distance_fine)

        print("Optimizing PoseGraph ...")
        option = o3d.pipelines.registration.GlobalOptimizationOption(
            max_correspondence_distance=max_correspondence_distance_fine,
            edge_prune_threshold=0.25,
            reference_node=0)

        o3d.pipelines.registration.global_optimization(
            pose_graph,
            o3d.pipelines.registration.GlobalOptimizationLevenbergMarquardt(),
            o3d.pipelines.registration.GlobalOptimizationConvergenceCriteria(),
            option)

        return pose_graph.nodes[1].pose

def calculate_transform_icp(source, reference, threshold, trans_init):
    reg_p2p = o3d.pipelines.registration.registration_icp(
    source, reference, threshold, trans_init,
    o3d.pipelines.registration.TransformationEstimationPointToPoint(),
    o3d.pipelines.registration.ICPConvergenceCriteria(max_iteration=4000))
    print(reg_p2p)
    return reg_p2p.transformation

if __name__ == '__main__':
    reference = o3d.io.read_point_cloud('calibrate.pcd')
    final_pcds = [reference]
    for pcd_path in ['pcds/0.pcd', 'pcds/1.pcd']:
        source = o3d.io.read_point_cloud(pcd_path)
        transform = calculate_calibrate_transform(source, reference)
        final_pcds.append(source.transform(transform))
    mesh_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(size=1, origin=[
                                                                   0, 0, 0])
    final_pcds.append(mesh_frame)
    o3d.visualization.draw_geometries(final_pcds, zoom=0.3412,
                                      front=[
                                          0.096927975261234173, -0.9690471930937371, 0.22705176759696721],
                                      lookat=[
                                          0.30521282540611194, -0.30539666178497488, 0.35091430250748173],
                                      up=[-0.11907845739256506, 0.21519646780619231, 0.96928365364775737])
