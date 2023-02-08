import { ref } from 'vue';
import { defineStore } from 'pinia';
import { throttle } from 'throttle-debounce';

import { UsbComm } from '@/proto/comm.proto';
import { useUsbComm } from './usb';

export const useRgbStore = defineStore('rgb', () => {
  const state = ref<UsbComm.IRgbState>();

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

  function $resetState(): void {
    state.value = undefined;
  }

  return {
    state,
    sendRgbControl,
    getRgbState,
    setRgbState,
    setRgbStateThottled,
    $resetState,
  };
});
