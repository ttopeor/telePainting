FROM moveit/moveit:noetic-release
WORKDIR /ros_ws
RUN apt-get update && apt upgrade && apt-get install python3-pip -y && pip3 install Flask waitress
COPY src /ros_ws/src
COPY scripts /scripts
RUN /ros_entrypoint.sh && chmod +x /scripts/run.sh && chmod +x /scripts/build.sh
RUN cd /ros_ws && rosdep install --from-paths src --ignore-src -r -y
RUN /scripts/build.sh

ENTRYPOINT '/scripts/run.sh'