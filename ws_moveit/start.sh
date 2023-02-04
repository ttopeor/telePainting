#!/bin/bash

docker container rm -f ar4_moveit_service
docker run -p 5001:5000 --restart=always --name=ar4_moveit_service -d ar4_moveit