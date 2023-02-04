import create from 'zustand';

import { produce } from 'immer';

export interface AR4Status {
  enabled: boolean;
  current: number[];
  currentPos: number[];
  destination: number[];
  destinationPos: number[];
  jointSpeed: number[];
  fps: number;
  sensorRate: number;
  hasUpdate: boolean;
  mode: string;
}

export function DefaultAR4Status(): AR4Status {
  return {
    enabled: false,
    current: [0, 0, 0, 0, 0, 0],
    currentPos: [0, 0, 0, 0, 0, 0],
    destination: [0, 0, 0, 0, 0, 0],
    destinationPos: [0, 0, 0, 0, 0, 0],
    jointSpeed: [0, 0, 0, 0, 0, 0],
    fps: 0,
    sensorRate: 0,
    hasUpdate: false,
    mode: 'MODE_SPEED',
  };
}

export interface AR4Store {
  status: AR4Status;
  updateStatus(newStatus: Partial<AR4Status>): void;
  updateFps(newFps: number): void;
  updateEnabled(enabled: boolean): void;
  updateAngles(
    current: number[],
    destination: number[],
    jointSpeed: number[],

    sensorRate: number
  ): void;
  updateHasUpdate(hasUpdate: boolean): void;
  updateMode(mode: string): void;
}

export const useAr4State = create<AR4Store>((set, get) => ({
  status: DefaultAR4Status(),
  updateStatus: (newStatus: Partial<AR4Status>) =>
    set({ status: { ...get().status, ...newStatus } }),
  updateFps: (newFps: number) =>
    set((state) => ({ status: { ...state.status, fps: newFps } })),
  updateEnabled: (enabled: boolean) =>
    set((state) => ({ status: { ...state.status, enabled } })),
  updateMode: (mode: string) =>
    set((state) => ({ status: { ...state.status, mode } })),
  updateAngles: (
    current: number[],
    destination: number[],
    jointSpeed: number[],
    sensorRate: number
  ) =>
    set(
      produce((state) => {
        state.status.current[0] = current[0];
        state.status.current[1] = current[1];
        state.status.current[2] = current[2];
        state.status.current[3] = current[3];
        state.status.current[4] = current[4];
        state.status.current[5] = current[5];
        state.status.destination[0] = destination[0];
        state.status.destination[1] = destination[1];
        state.status.destination[2] = destination[2];
        state.status.destination[3] = destination[3];
        state.status.destination[4] = destination[4];
        state.status.destination[5] = destination[5];
        // state.status.currentPos[0] = currentPos[0];
        // state.status.currentPos[1] = currentPos[1];
        // state.status.currentPos[2] = currentPos[2];
        // state.status.currentPos[3] = currentPos[3];
        // state.status.currentPos[4] = currentPos[4];
        // state.status.currentPos[5] = currentPos[5];
        // state.status.destinationPos[0] = destinationPos[0];
        // state.status.destinationPos[1] = destinationPos[1];
        // state.status.destinationPos[2] = destinationPos[2];
        // state.status.destinationPos[3] = destinationPos[3];
        // state.status.destinationPos[4] = destinationPos[4];
        // state.status.destinationPos[5] = destinationPos[5];
        state.status.jointSpeed[0] = jointSpeed[0];
        state.status.jointSpeed[1] = jointSpeed[1];
        state.status.jointSpeed[2] = jointSpeed[2];
        state.status.jointSpeed[3] = jointSpeed[3];
        state.status.jointSpeed[4] = jointSpeed[4];
        state.status.jointSpeed[5] = jointSpeed[5];
        state.status.hasUpdate = true;
        state.status.sensorRate = sensorRate;
      })
    ),
  updateHasUpdate: (hasUpdate: boolean) =>
    set(
      produce((state) => {
        state.status.hasUpdate = hasUpdate;
      })
    ),
}));
