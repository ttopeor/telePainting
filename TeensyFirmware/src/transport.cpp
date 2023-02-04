#include "transport.h"

extern Robot robotInstance;

uint8_t stage = 0;
uint8_t cmd = 0;
uint8_t length = 0;

void Transport::processInput()
{
  if (stage == 0)
  {
    if (Serial.available())
    {
      byte input = Serial.read();
      if (input == DELIMITER)
      {
        stage = 1;
      }
    }
  }

  if (stage == 1)
  {
    if (Serial.available() >= 2)
    {
      length = Serial.read();
      cmd = Serial.read();
      stage = 2;
    }
  }

  if (stage == 2)
  {
    if (Serial.available() > length)
    {
      char payload[length];
      Serial.readBytes(payload, length);
      uint8_t checksum = Serial.read();
      uint8_t thisSum = DELIMITER + length + cmd;
      for (uint8_t i = 0; i < length; i++)
      {
        thisSum += payload[i];
      }
      if (thisSum == checksum)
      {
        robotInstance.onCommand(cmd, (byte *)payload, length);
      }
      stage = 0;
    }
  }
}

void Transport::sendCommand(uint8_t cmd, byte *payload, uint8_t length)
{
  byte packet[length + 4];
  uint8_t checksum = DELIMITER + length + cmd;

  for (uint8_t i = 0; i < length; i++)
  {
    checksum += payload[i];
  }

  packet[0] = DELIMITER;
  packet[1] = length;
  packet[2] = cmd;
  packet[length + 3] = checksum;
  memcpy(packet + 3, payload, length);
  Serial.write(packet, length + 4);
}