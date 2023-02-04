#!/usr/bin/env python3

import time
import yaml
from flask import Flask, request, jsonify
from waitress import serve
import sys
import copy
import rospy
import moveit_commander
import moveit_msgs.msg
import geometry_msgs.msg
from math import pi
from std_msgs.msg import String, Header
from trajectory_msgs.msg import JointTrajectory
from moveit_commander.conversions import pose_to_list
from moveit_msgs.msg import RobotState
from sensor_msgs.msg import JointState


def all_close(goal, actual, tolerance):
    """
    Convenience method for testing if a list of values are within a tolerance of their counterparts in another list
    @param: goal       A list of floats, a Pose or a PoseStamped
    @param: actual     A list of floats, a Pose or a PoseStamped
    @param: tolerance  A float
    @returns: bool
    """
    all_equal = True
    if type(goal) is list:
        for index in range(len(goal)):
            if abs(actual[index] - goal[index]) > tolerance:
                return False

    elif type(goal) is geometry_msgs.msg.PoseStamped:
        return all_close(goal.pose, actual.pose, tolerance)

    elif type(goal) is geometry_msgs.msg.Pose:
        return all_close(pose_to_list(goal), pose_to_list(actual), tolerance)

    return True


moveit_commander.roscpp_initialize(sys.argv)
rospy.init_node('ar4_http_service_node', anonymous=True)

robot = moveit_commander.RobotCommander()
scene = moveit_commander.PlanningSceneInterface()
group_name = "arm"
move_group = moveit_commander.MoveGroupCommander(group_name)

app = Flask(__name__)


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@app.route("/plan", methods=['POST'])
def plan():
    waypoints = request.json['waypoints']
    step = request.json['step'] or 0.005
    jump = request.json['jump'] or 0
    start_pos = request.json['start']
    wps = []
    for p in waypoints:
        pose_goal = geometry_msgs.msg.Pose()
        pose_goal.orientation.x = p['orientation']['x']
        pose_goal.orientation.y = p['orientation']['y']
        pose_goal.orientation.z = p['orientation']['z']
        pose_goal.orientation.w = p['orientation']['w']
        pose_goal.position.x = p['position']['x']
        pose_goal.position.y = p['position']['y']
        pose_goal.position.z = p['position']['z']
        wps.append(pose_goal)
    try:
        joint_state = JointState()
        joint_state.header = Header()
        joint_state.header.stamp = rospy.Time.now()
        joint_state.name = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6']
        joint_state.position = start_pos
        moveit_robot_state = RobotState()
        moveit_robot_state.joint_state = joint_state
        move_group.set_start_state(moveit_robot_state)
        (plan, fraction) = move_group.compute_cartesian_path(
            wps,   # waypoints to follow
            step,        # eef_step
            jump)         # jump_threshold
        plan = yaml.load(str(plan))
        return jsonify({'plan': plan, 'fraction': fraction})
    except Exception as e:
        print("Exception", e)
        return jsonify({'error': str(e)})


serve(app, host="0.0.0.0", port=5000)
