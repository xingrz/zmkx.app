import { ref } from 'vue';
import { defineStore } from 'pinia';

import { UsbCommManager } from '@/utils/usb';

import {
  Action,
  MessageH2D,
  MotorState,
  type KnobConfig,
  type MessageD2H,
  type Version,
} from '@/proto/comm.proto';
import sliceLast from '@/utils/sliceLast';

export interface ITimedState {
  timestamp: number;
  value: number | undefined;
  type: 'current' | 'target';
}

function updateTimeline(current: ITimedState[], items: ITimedState[], limit: number): ITimedState[] {
  if (current.length > 0 && items[0].timestamp < current[current.length - 1].timestamp) {
    current = [];
  }
  return sliceLast([
    ...current,
    ...items,
  ], limit);
}

export const useUsbComm = defineStore('usb', () => {
  const device = ref<USBDevice>();

  const version = ref<Version>();
  const motorState = ref<MotorState>();
  const knobConfig = ref<KnobConfig>();
  const angleTimeline = ref<ITimedState[]>([]);
  const torqueTimeline = ref<ITimedState[]>([]);

  const comm = new UsbCommManager(handleTransferIn, handleDisconnected);

  function handleTransferIn(res: MessageD2H): void {
    if (res.payload == 'version' && res.version) {
      version.value = res.version;
    }
    if (res.payload == 'motorState' && res.motorState) {
      motorState.value = res.motorState;
      updateAngleTimeline(res.motorState);
      updateTorqueTimeline(res.motorState);
    }
    if (res.payload == 'knobConfig' && res.knobConfig) {
      knobConfig.value = res.knobConfig;
    }
  }

  function handleDisconnected(): void {
    device.value = undefined;
  }

  function updateAngleTimeline({ timestamp, currentAngle, targetAngle, controlMode }: MotorState): void {
    angleTimeline.value = updateTimeline(angleTimeline.value, [
      {
        timestamp: Math.round(timestamp / 1000),
        value: Math.sin(currentAngle),
        type: 'current',
      },
      {
        timestamp: Math.round(timestamp / 1000),
        value: controlMode == MotorState.ControlMode.ANGLE ? Math.sin(targetAngle) : undefined,
        type: 'target',
      },
    ], 500);
  }

  function updateTorqueTimeline({ timestamp, currentVelocity, targetVelocity }: MotorState): void {
    torqueTimeline.value = updateTimeline(torqueTimeline.value, [
      {
        timestamp: Math.round(timestamp / 1000),
        value: currentVelocity,
        type: 'current',
      },
      {
        timestamp: Math.round(timestamp / 1000),
        value: targetVelocity,
        type: 'target',
      },
    ], 500);
  }

  function resetTimelines() {
    angleTimeline.value = [];
    torqueTimeline.value = [];
  }

  async function open(): Promise<void> {
    device.value = await comm.open();
  }

  async function close(): Promise<void> {
    await comm.close();
  }

  async function getVersion(): Promise<void> {
    await comm.send(MessageH2D.create({
      action: Action.VERSION,
      payload: 'nop',
      nop: {},
    }));
  }

  async function getMotorState(): Promise<void> {
    await comm.send(MessageH2D.create({
      action: Action.MOTOR_GET_STATE,
      payload: 'nop',
      nop: {},
    }));
  }

  async function getKnobConfig(): Promise<void> {
    await comm.send(MessageH2D.create({
      action: Action.KNOB_GET_CONFIG,
      payload: 'nop',
      nop: {},
    }));
  }

  async function setKnobConfig(config: KnobConfig): Promise<void> {
    await comm.send(MessageH2D.create({
      action: Action.KNOB_SET_CONFIG,
      payload: 'knobConfig',
      knobConfig: config,
    }));
  }

  return {
    device,
    version,
    motorState,
    knobConfig,
    angleTimeline,
    torqueTimeline,
    resetTimelines,
    open,
    close,
    getVersion,
    getMotorState,
    getKnobConfig,
    setKnobConfig,
  };
});
