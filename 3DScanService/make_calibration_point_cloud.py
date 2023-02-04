import open3d as o3d
import math
import numpy as np
import utility

pcd = o3d.geometry.PointCloud()

# add rubber base
rubber = o3d.io.read_point_cloud('RubberSheet.pcd')
pcd += rubber

# add mesh rare right
mesh1 = o3d.geometry.TriangleMesh.create_box(0.105, 0.235, 0.07)
pcd1 = mesh1.sample_points_poisson_disk(8000)

pcd1 = pcd1.translate([0.1, 0.1, 0])
pcd += pcd1


# add mesh front left
mesh2 = o3d.geometry.TriangleMesh.create_box(0.175, 0.120, 0.035)
pcd2 = mesh2.sample_points_poisson_disk(2000)

pcd2 = pcd2.translate([-0.20, 0.25, 0])
pcd += pcd2
pcd.paint_uniform_color([0, 0, 1])

mesh_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(size=1, origin=[
                                                               0, 0, 0])
o3d.io.write_point_cloud(utility.get_path('calibrate.pcd'), pcd)
o3d.visualization.draw_geometries([pcd, mesh_frame], zoom=0.3412,
                                  front=[0.096927975261234173, -
                                         0.9690471930937371, 0.22705176759696721],
                                  lookat=[0.30521282540611194, -
                                          0.30539666178497488, 0.35091430250748173],
                                  up=[-0.11907845739256506, 0.21519646780619231, 0.96928365364775737])
