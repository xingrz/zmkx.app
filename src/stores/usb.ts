import { ref } from 'vue';
import { defineStore } from 'pinia';

import { transferOut } from '@/utils/usb';

import {
  Action,
  MessageH2D,
  MotorControlMode,
  type KnobConfig,
  type MessageD2H,
  type MotorState,
  type Version,
} from '@/proto/comm.proto';
import sliceLast from '@/utils/sliceLast';

export interface ITimedState {
  timestamp: number;
  value: number | undefined;
  type: 'current' | 'target';
}

export const useUsbComm = defineStore('usb', () => {
  const version = ref<Version | null>(null);
  const motorState = ref<MotorState>();
  const knobConfig = ref<KnobConfig>();
  const angleTimeline = ref<ITimedState[]>([]);
  const torqueTimeline = ref<ITimedState[]>([]);

  function handleTransferIn(res: MessageD2H | undefined): void {
    if (res?.version) {
      version.value = res.version;
    }
    if (res?.motorState) {
      motorState.value = res.motorState;
      updateAngleTimeline(res.motorState);
      updateTorqueTimeline(res.motorState);
    }
    if (res?.knobConfig) {
      knobConfig.value = res.knobConfig;
    }
  }

  function updateAngleTimeline({ timestamp, currentAngle, targetAngle, controlMode }: MotorState): void {
    angleTimeline.value = sliceLast([
      ...angleTimeline.value,
      {
        timestamp: timestamp,
        value: Math.sin(currentAngle),
        type: 'current',
      },
      {
        timestamp: timestamp,
        value: controlMode == MotorControlMode.ANGLE ? Math.sin(targetAngle) : undefined,
        type: 'target',
      },
    ], 500);
  }

  function updateTorqueTimeline({ timestamp, currentVelocity, targetVelocity }: MotorState): void {
    torqueTimeline.value = sliceLast([
      ...torqueTimeline.value,
      {
        timestamp: timestamp,
        value: currentVelocity,
        type: 'current',
      },
      {
        timestamp: timestamp,
        value: targetVelocity,
        type: 'target',
      },
    ], 500);
  }

  async function getVersion(device: USBDevice, ep: number): Promise<void> {
    await transferOut(device, ep, MessageH2D.create({
      action: Action.VERSION,
    }));
  }

  async function getMotorState(device: USBDevice, ep: number): Promise<void> {
    await transferOut(device, ep, MessageH2D.create({
      action: Action.GET_MOTOR_STATE,
    }));
  }

  async function getKnobConfig(device: USBDevice, ep: number): Promise<void> {
    await transferOut(device, ep, MessageH2D.create({
      action: Action.GET_KNOB_CONFIG,
    }));
  }

  async function setKnobConfig(device: USBDevice, ep: number, config: KnobConfig): Promise<void> {
    await transferOut(device, ep, MessageH2D.create({
      action: Action.SET_KNOB_CONFIG,
      knobConfig: config,
    }));
  }

  return {
    version,
    motorState,
    knobConfig,
    angleTimeline,
    torqueTimeline,
    getVersion,
    getMotorState,
    getKnobConfig,
    setKnobConfig,
    handleTransferIn,
  };
});
