#include <Arduino.h>
#include "robot.h"

#include <AS5600.h>
#include <AccelStepper.h>

extern Transport transportInstance;

const int J1stepPin = 0;
const int J1dirPin = 1;
const int J2stepPin = 2;
const int J2dirPin = 3;
const int J3stepPin = 4;
const int J3dirPin = 5;
const int J4stepPin = 6;
const int J4dirPin = 7;
const int J6stepPin = 8;
const int J6dirPin = 9;
const int J5stepPin = 10;
const int J5dirPin = 11;

AccelStepper Stepper1(1, J1stepPin, J1dirPin);
AccelStepper Stepper2(1, J2stepPin, J2dirPin);
AccelStepper Stepper3(1, J3stepPin, J3dirPin);
AccelStepper Stepper4(1, J4stepPin, J4dirPin);
AccelStepper Stepper5(1, J5stepPin, J5dirPin);
AccelStepper Stepper6(1, J6stepPin, J6dirPin);

AccelStepper Steppers[6] = {Stepper1, Stepper2, Stepper3, Stepper4, Stepper5, Stepper6};

AS5600L J1(0x41);
AS5600L J2(0x42);
AS5600L J3(0x45);
AS5600L J4(0x44);
AS5600 J6;
AS5600L J5(0x46);

AS5600 angleReader[6] = {J1, J2, J3, J4, J5, J6};

const uint8_t J7Pin = 40;
const uint8_t SupplyVoltagePinP = 21;
const uint8_t SupplyVoltagePinN = 22;

elapsedMillis updateSpeedInterval;

elapsedMicros reportAngleInterval;
elapsedMicros readAngleInterval;

void Robot::setup()
{
  for (int i = 0; i < 6; i++)
  {
    Steppers[i].setMaxSpeed(MAX_JOINT_SPEED);
    Steppers[i].setMinPulseWidth(5);
  }
  pinMode(J7Pin, OUTPUT);
  pinMode(SupplyVoltagePinP, OUTPUT);
  pinMode(SupplyVoltagePinN, OUTPUT);
}

float angles[6] = {0, 0, 0, 0, 0, 0};
uint8_t angleIdx = 0;

uint8_t endEffectorValue = 0;

void Robot::loop()
{
  digitalWrite(SupplyVoltagePinP, HIGH);
  digitalWrite(SupplyVoltagePinN, LOW);
  digitalWrite(J7Pin, endEffectorValue);
  if (readAngleInterval > 1100)
  {
    angles[angleIdx] = angleReader[angleIdx].rawAngle() * AS5600_RAW_TO_DEGREES;
    angleIdx++;
    if (angleIdx >= 6)
    {
      angleIdx = 0;
      transportInstance.sendCommand(REPORT_JOINT, (byte *)angles, 6 * sizeof(float));
      float fps = 1000000.0f / ((float)(reportAngleInterval));
      transportInstance.sendCommand(REPORT_PERFORMANCE, (byte *)(&fps), sizeof(float));
      reportAngleInterval = 0;
    }
    readAngleInterval = 0;
  }

  if (updateSpeedInterval < 200)
  {
    for (int i = 0; i < 6; i++)
    {
      Steppers[i].runSpeed();
    }
  }
  else
  {
    for (int i = 0; i < 6; i++)
    {
      Steppers[i].stop();
    }
  }
}

void Robot::onCommand(uint8_t cmd, byte *payload, uint8_t length)
{
  if (cmd == SEND_SPEED)
  {
    for (int i = 0; i < 6; i++)
    {
      float speed = 0;
      memcpy(&speed, payload + i * sizeof(float), sizeof(float));
      Steppers[i].setSpeed(speed);
    }
    updateSpeedInterval = 0;
  }
  if (cmd == SEND_ENDEFFECTOR)
  {
    endEffectorValue = payload[0];
  }
}