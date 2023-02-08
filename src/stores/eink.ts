import { ref, } from 'vue';
import { defineStore } from 'pinia';

import { UsbComm } from '@/proto/comm.proto';
import { useUsbComm } from './usb';

export const useEinkStore = defineStore('eink', () => {
  const einkImage = ref<UsbComm.IEinkImage>();

  const comm = useUsbComm();

  async function setEinkImage(id: number, bits: Uint8Array): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.EINK_SET_IMAGE,
      einkImage: { id, bitsLength: bits.length, bits },
    });
  }

  function $resetState(): void {
    einkImage.value = undefined;
  }

  return {
    einkImage,
    setEinkImage,
    $resetState,
  };
});
