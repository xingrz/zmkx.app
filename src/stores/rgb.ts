import { ref } from 'vue';
import { defineStore } from 'pinia';
import { throttle } from 'throttle-debounce';

import { UsbComm } from '@/proto/comm.proto';
import { useUsbComm } from './usb';

export const useRgbStore = defineStore('rgb', () => {
  const state = ref<UsbComm.IRgbState>();
  const indicator = ref<UsbComm.IRgbIndicator>();

  const comm = useUsbComm();

  async function sendRgbControl(command: UsbComm.RgbControl.Command): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.RGB_CONTROL,
      rgbControl: { command },
    });
  }

  async function getRgbState(): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.RGB_GET_STATE,
      nop: {},
    });
  }

  async function setRgbState(state: UsbComm.IRgbState): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.RGB_SET_STATE,
      rgbState: state,
    });
  }

  const setRgbStateThottled = throttle(100, (rgbState: UsbComm.IRgbState) => {
    state.value = rgbState;
    setRgbState(rgbState);
  });

  async function getRgbIndicator(): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.RGB_GET_INDICATOR,
      nop: {},
    });
  }

  async function setRgbIndicator(rgbIndicator: UsbComm.IRgbIndicator): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.RGB_SET_INDICATOR,
      rgbIndicator: rgbIndicator,
    });
  }

  const setRgbIndicatorThottled = throttle(100, (rgbIndicator: UsbComm.IRgbIndicator) => {
    indicator.value = { ...indicator.value, ...rgbIndicator };
    setRgbIndicator(rgbIndicator);
  });

  function $resetState(): void {
    state.value = undefined;
    indicator.value = undefined;
  }

  return {
    state,
    indicator,
    sendRgbControl,
    getRgbState,
    setRgbState,
    setRgbStateThottled,
    getRgbIndicator,
    setRgbIndicator,
    setRgbIndicatorThottled,
    $resetState,
  };
});
