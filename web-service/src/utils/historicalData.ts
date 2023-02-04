

export class HistoricalData {
  public data: number[][] = []
  private staging: number[][] = []
  private lastPush: number = 0
  constructor(private dataLength = 200, public data_interval = 100) {

  }
  public addPoint(val: number[]) {
    const currentTime = Date.now();
    if ((currentTime - this.lastPush) > this.data_interval) {
      this.data.push(this.mergeStaging());
      this.lastPush = currentTime;
      if (this.data.length > this.dataLength) {
        this.data.shift()
      }
    }
    this.staging.push(val);
  }

  private mergeStaging(): number[] {
    if (this.staging.length === 0) {
      return []
    }

    const newPoints = new Array(this.staging[0].length);
    newPoints.fill(0);
    for (let row = 0; row < this.staging.length; row++) {
      for (let col = 0; col < this.staging[0].length; col++) {
        newPoints[col] += this.staging[row][col];
      }
    }

    for (let col = 0; col < this.staging[0].length; col++) {
      newPoints[col] = newPoints[col] / this.staging.length;
    }

    this.staging = []
    return newPoints
  }
}