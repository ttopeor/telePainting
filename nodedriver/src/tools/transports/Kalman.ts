export class Kalman {
  lastAngle = 0;
  lastSpeed = 0;
  varOfPrediction = 0.1;
  uncertaintyOfSpeedEstimate = 0.1;
  varOfMeansurement = 30;
  noiseVariance = 0.01;
  lastUpdateTime = 0.001 * Date.now();

  reset() {
    this.lastAngle = 0;
    this.varOfMeansurement = 50;
    this.uncertaintyOfSpeedEstimate = 0.1;
    this.varOfPrediction = 0.1;
    this.noiseVariance = 0.1;
    this.lastUpdateTime = 0.001 * Date.now();
  }

  update(sensorAngle: number, speed: number, delay = 0) {
    const dt = 0.001 * Date.now() - this.lastUpdateTime;
    if (dt < delay) {
      return this.lastAngle;
    }
    this.lastAngle = this.lastAngle + dt * this.lastSpeed;
    this.lastSpeed = speed*0.01;
    this.varOfPrediction =
      this.varOfPrediction +
      dt * dt * this.uncertaintyOfSpeedEstimate +
      this.noiseVariance;
    const kalmanGain =
      this.varOfPrediction / (this.varOfPrediction + this.varOfMeansurement);
    this.lastAngle =
      this.lastAngle + kalmanGain * (sensorAngle - this.lastAngle);
    this.varOfPrediction = (1 - kalmanGain) * this.varOfPrediction;
    this.lastUpdateTime = 0.001 * Date.now();
    return this.lastAngle;
  }
}
