from bottle import route, run, template, static_file, response, request
import open3d as o3d
import pathlib
import json
import numpy as np
import scan_function
import base64
from os.path import join, realpath, dirname

ROOT = dirname(realpath(__file__))
SNAP_SHOT_FILE = 'last_snapshot.pts'
SNAP_SHOT_PATH = join(ROOT, SNAP_SHOT_FILE)


@route("/")
def index():
    response.content_type = 'application/json'
    return json.dumps({'message': 'hello'})


is_scanning = False


@route('/scan', method='GET')
def scan():
    response.content_type = 'application/json'
    global is_scanning
    if is_scanning:
        response.status = 400
        return json.dumps({'message': 'Device Busy'})
    print('scan reqest start!')
    is_scanning = True
    pcd = scan_function.get_mesh()
    print('Saving point cloud...')

    is_scanning = False
    return json.dumps({'message': 'Scan Complete', "points": len(pcd.points)})


@route('/last_scan', method='GET')
def last_scan():
    return static_file(SNAP_SHOT_FILE, root=ROOT, download=SNAP_SHOT_FILE)


run(host='0.0.0.0', port=8080)
