import { HistoricalData } from '@/utils/historicalData';
import { notification } from 'antd';
import mqtt from 'mqtt';
import { useAr4State } from './ar4';
import { useTaskStatus } from './task';
export const client = mqtt.connect('ws://mobility-lab.home:9001');

console.log('Connect to MQTT...');
client.on('connect', function () {
  console.log('Connection to MQTT established!');
  client.subscribe(['status', 'modules/ar4robotarm', 'tasks'], (err: Error) => {
    if (!!err) {
      console.error(`Failed to subscribe!:`, err);
      notification.error({
        message: 'Connect to MQTT failed: ' + err.message,
      });
    } else {
      notification.success({ message: 'Connect to MQTT success!!' });
    }
  });
});

let lastUpdateTime = Date.now();

setInterval(() => {
  if (Date.now() - lastUpdateTime > 800) {
    useAr4State.getState().updateHasUpdate(false);
  }
}, 200);

export const currentHistoricalData = new HistoricalData();
export const destinationHistoricalData = new HistoricalData();

export let enabledHistoricalData = true;
export function toggleRecord() {
  enabledHistoricalData = !enabledHistoricalData;
}

client.on('message', (topic: string, payload: Buffer) => {
  switch (topic) {
    case 'modules/ar4robotarm':
      const payloadData: any = JSON.parse(payload.toString());
      const newCurrent = payloadData.currentAngles;
      const newDestination = payloadData.destinationAngles;
      const jointSpeed = payloadData.jointSpeed;
      const newCurrentPos = payloadData.currentPos;
      const newDestinationPos = payloadData.destinationPos;
      const newTickRate = payloadData.sensorRefreshRate;
      const mode = payloadData.controller;
      if (enabledHistoricalData) {
        currentHistoricalData.addPoint(newCurrent);
        destinationHistoricalData.addPoint(newDestination);
      }
      useAr4State
        .getState()
        .updateAngles(newCurrent, newDestination, jointSpeed, newTickRate);
      useAr4State.getState().updateMode(mode);
      lastUpdateTime = Date.now();
      break;
    case 'status':
      const statusData: any = JSON.parse(payload.toString());
      useAr4State.getState().updateFps(statusData.fps);
      useAr4State.getState().updateEnabled(statusData.enabled);
      break;
    case 'tasks':
      const taskStatus = JSON.parse(payload.toString());
      useTaskStatus.getState().updateStatus(taskStatus);
      break;
  }
});
