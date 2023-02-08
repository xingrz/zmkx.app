import { ref, watch, } from 'vue';
import { defineStore } from 'pinia';
import { throttle } from 'throttle-debounce';

import sliceLast from '@/utils/sliceLast';

import { UsbComm } from '@/proto/comm.proto';
import { useUsbComm } from './usb';

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

export const useKnobStore = defineStore('knob', () => {
  const motorState = ref<UsbComm.IMotorState>();
  const knobConfig = ref<UsbComm.IKnobConfig>();
  const angleTimeline = ref<ITimedState[]>([]);
  const torqueTimeline = ref<ITimedState[]>([]);

  const comm = useUsbComm();

  watch(motorState, (motorState) => {
    if (motorState) {
      updateAngleTimeline(motorState);
      updateTorqueTimeline(motorState);
    }
  });

  function updateAngleTimeline({ timestamp, currentAngle, targetAngle, controlMode }: UsbComm.IMotorState): void {
    angleTimeline.value = updateTimeline(angleTimeline.value, [
      {
        timestamp: Math.round(timestamp / 1000),
        value: Math.sin(currentAngle),
        type: 'current',
      },
      {
        timestamp: Math.round(timestamp / 1000),
        value: controlMode == UsbComm.MotorState.ControlMode.ANGLE ? Math.sin(targetAngle) : undefined,
        type: 'target',
      },
    ], 500);
  }

  function updateTorqueTimeline({ timestamp, currentVelocity, targetVelocity }: UsbComm.IMotorState): void {
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

  async function getMotorState(): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.MOTOR_GET_STATE,
      nop: {},
    });
  }

  async function getKnobConfig(): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.KNOB_GET_CONFIG,
      nop: {},
    });
  }

  async function setKnobConfig(config: UsbComm.IKnobConfig): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.KNOB_SET_CONFIG,
      knobConfig: config,
    });
  }

  const setKnobConfigThottled = throttle(100, (config: UsbComm.IKnobConfig) => {
    knobConfig.value = config;
    setKnobConfig(config);
  });

  async function updateKnobPref(pref: UsbComm.KnobConfig.IPref): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.KNOB_UPDATE_PREF,
      knobPref: pref,
    });
  }

  const updateKnobPrefThottled = throttle(100, (pref: UsbComm.KnobConfig.IPref) => {
    $patchKnobPref(pref);
    updateKnobPref(pref);
  });

  function $patchKnobPref(pref: UsbComm.KnobConfig.IPref): void {
    if (knobConfig.value && knobConfig.value?.prefs?.[pref.layerId]) {
      const prefs = [...knobConfig.value.prefs];
      prefs[pref.layerId] = { ...prefs[pref.layerId], ...pref };
      knobConfig.value = {
        ...knobConfig.value,
        prefs,
      };
    }
  }

  function $resetState(): void {
    motorState.value = undefined;
    knobConfig.value = undefined;
    angleTimeline.value = [];
    torqueTimeline.value = [];
  }

  return {
    motorState,
    knobConfig,
    angleTimeline,
    torqueTimeline,
    resetTimelines,
    getMotorState,
    getKnobConfig,
    setKnobConfig,
    setKnobConfigThottled,
    updateKnobPref,
    updateKnobPrefThottled,
    $patchKnobPref,
    $resetState,
  };
});
