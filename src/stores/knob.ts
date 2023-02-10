import { ref } from 'vue';
import { defineStore } from 'pinia';
import { throttle } from 'throttle-debounce';

import { UsbComm } from '@/proto/comm.proto';
import { useUsbComm } from './usb';

export const useKnobStore = defineStore('knob', () => {
  const motorState = ref<UsbComm.IMotorState>();
  const knobConfig = ref<UsbComm.IKnobConfig>();

  const comm = useUsbComm();

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
  }

  return {
    motorState,
    knobConfig,
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
