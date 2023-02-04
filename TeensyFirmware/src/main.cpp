#include <Arduino.h>
#include <AS5600.h>
#include <AccelStepper.h>
#include "robot.h"
#include "transport.h"

Robot robotInstance;
Transport transportInstance;

void setup()
{
  Wire.begin();
  Serial.begin(921600);
  robotInstance.setup();
}

void loop()
{
  transportInstance.processInput();
  robotInstance.loop();
}