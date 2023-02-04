#!/bin/bash
set -e

docker build . -t ar4_moveit 
docker run --rm -it -p 5000:5000 ar4_moveit