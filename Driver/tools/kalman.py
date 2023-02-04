import time
import random
import numpy as np
import pandas
import math


class Kalman:
    def __init__(self) -> None:
        self.lastAngle = 0
        self.lastSpeed = 0
        self.var_of_prediction = 0.1  # var of prediction
        self.uncertainty_of_speed_estimate = 0.001  # Uncertainty of the speed Estimate
        self.var_of_meansurement = 10  # var of meansurement
        self.noise_variance = 0.01  # Noise Variance of speed
        self.last_update_time = time.time()

    def reset(self):
        self.lastAngle = 0
        self.var_of_prediction = 0.1  # var of prediction
        self.uncertainty_of_speed_estimate = 0.01  # Uncertainty of the speed Estimate
        self.var_of_meansurement = 0.1  # var of meansurement
        self.noise_variance = 0.1  # Noise Variance
        self.last_update_time = time.time()

    def update(self, sensorAngle, speed, delay=0):
        dt = 0
        while dt <= delay:
            current_time = time.time()
            dt = current_time - self.last_update_time
            print(dt)
        # State Transition Equation (Dynamic Model or Prediction Model)
        self.lastAngle = self.lastAngle + dt*self.lastSpeed
        self.lastSpeed = speed
        # Predicted Covariance equation
        self.var_of_prediction = self.var_of_prediction + \
            (dt**2 * self.uncertainty_of_speed_estimate) + self.noise_variance
        # kalman_gain close to 0: places more weight on the model predictions
        kalman_gain = self.var_of_prediction / \
            (self.var_of_prediction + self.var_of_meansurement)

        self.lastAngle = self.lastAngle + kalman_gain * \
            (sensorAngle - self.lastAngle)             # State Update
        self.var_of_prediction = (1 - kalman_gain) * self.var_of_prediction
        self.last_update_time = current_time

        return self.lastAngle


def get_noise_sensor_reading_set(speed, noise_varience, size, dt):
    sensor_noise_set = np.random.normal(
        loc=0.0, scale=math.sqrt(noise_varience), size=size)
    sensor_reading_set = []
    real_pos_set = []
    for i in range(size):
        real_pos_set.append(i*dt*speed)
        sensor_reading_set.append(i*dt*speed + sensor_noise_set[i])
    speed_set = [speed for x in range(size)]
    return sensor_reading_set, speed_set, real_pos_set


if __name__ == "__main__":

    print("test begining")
    dt = 0.1
    sensor_set_zeros, speed_set_zeros, real_pos_set_zeros = get_noise_sensor_reading_set(
        speed=0, noise_varience=0.5, size=10, dt=dt)
    sensor_set_speed, speed_set_speed, real_pos_set_speed = get_noise_sensor_reading_set(
        speed=10, noise_varience=0.5, size=30, dt=dt)
    sensor_set = sensor_set_zeros + sensor_set_speed
    speed_set = speed_set_zeros + speed_set_speed
    real_pos_set = real_pos_set_zeros + real_pos_set_speed
    sensor_set = [round(x, 2) for x in sensor_set]
    output_set = []
    filter = Kalman()
    for i in range(len(sensor_set)):
        output_set.append(filter.update(
            sensorAngle=sensor_set[i], speed=speed_set[i], delay=dt))
    output_set = [round(x, 2) for x in output_set]
    output = [sensor_set, real_pos_set, speed_set, output_set]
    row_labels = ['input', 'real pos', 'speed', 'output']
    column_labels = [x for x in range(len(sensor_set))]
    df = pandas.DataFrame(output, columns=column_labels, index=row_labels)
    print(df)
