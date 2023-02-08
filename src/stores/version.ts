import { computed, ref, type ComputedRef } from 'vue';
import { defineStore } from 'pinia';

import { UsbComm } from '@/proto/comm.proto';
import { useUsbComm } from './usb';

export const useVersionStore = defineStore('version', () => {
  const version = ref<UsbComm.IVersion>();

  const comm = useUsbComm();

  async function getVersion(): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.VERSION,
      nop: {},
    });
  }

  function useFeature(feature: keyof UsbComm.Version.IFeatures): ComputedRef<boolean> {
    return computed(() => !!version.value?.features?.[feature]);
  }

  function $resetState(): void {
    version.value = undefined;
  }

  return {
    version,
    getVersion,
    useFeature,
    $resetState,
  };
});
