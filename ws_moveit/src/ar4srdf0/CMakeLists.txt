cmake_minimum_required(VERSION 3.1.3)
project(ar4srdf0)

find_package(catkin REQUIRED   
  roscpp
  rospy
  std_msgs
)
include_directories(
# include
  ${catkin_INCLUDE_DIRS}
)
catkin_package()
install(PROGRAMS
  src/service.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)
install(DIRECTORY launch DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}
  PATTERN "setup_assistant.launch" EXCLUDE)
install(DIRECTORY config DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION})
