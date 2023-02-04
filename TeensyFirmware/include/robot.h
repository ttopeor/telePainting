#ifndef ROBOT_H_
#define ROBOT_H_
#include "Arduino.h"
#include "transport.h"

#define MAX_JOINT_SPEED 3000

class Robot
{
public:
  Robot(){};
  void onCommand(uint8_t cmd, byte *payload, uint8_t length);
  void loop();
  void setup();
};

#endif