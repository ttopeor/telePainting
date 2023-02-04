#ifndef TRANSPORT_H_
#define TRANSPORT_H_
#include "Arduino.h"
#include "robot.h"
#define DELIMITER 0xff

enum Command
{
  NONE = 0x00,
  REPORT_JOINT = 0x11,
  REPORT_PERFORMANCE = 0x12,
  SEND_SPEED = 0xa1,
  SEND_ENDEFFECTOR = 0xa2,
};

class Transport
{
public:
  Transport(){};

  void processInput();
  void sendCommand(uint8_t cmd, byte *payload, uint8_t length);
};

#endif