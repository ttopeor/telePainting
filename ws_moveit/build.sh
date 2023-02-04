#!/bin/bash
docker builder prune -f
docker build . -t ar4_moveit --no-cache