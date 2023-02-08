import { onMounted, ref, toRef, watch } from 'vue';
import { defineStore } from 'pinia';

import type { IUsbCommDevice, IUsbCommTransport } from '@/utils/usb/usb';
import { UsbCommVendorTransport } from '@/utils/usb/usb-vendor';
import { UsbCommHidTransport } from '@/utils/usb/usb-hid';

import type { UsbComm } from '@/proto/comm.proto';
import { useVersionStore } from './version';
import { useKnobStore } from './knob';
import { useRgbStore } from './rgb';
import { useEinkStore } from './eink';

export enum TransportType {
  USB_VENDOR,
  USB_HID,
}

export const useUsbComm = defineStore('usb', () => {
  const device = ref<IUsbCommDevice>();

  const versionStore = useVersionStore();
  const knobStore = useKnobStore();
  const rgbStore = useRgbStore();
  const einkStore = useEinkStore();

  let comm: IUsbCommTransport<IUsbCommDevice> | undefined;

  function handleTransferIn(res: UsbComm.MessageD2H): void {
    if (res.payload == 'version' && res.version) {
      versionStore.$patch({ version: res.version });
    }
    if (res.payload == 'motorState' && res.motorState) {
      knobStore.$patch({ motorState: res.motorState });
    }
    if (res.payload == 'knobConfig' && res.knobConfig) {
      knobStore.$patch({ knobConfig: res.knobConfig });
    }
    if (res.payload == 'knobPref' && res.knobPref) {
      knobStore.$patchKnobPref(res.knobPref);
    }
    if (res.payload == 'rgbState' && res.rgbState) {
      rgbStore.$patch({ state: res.rgbState });
    }
    if (res.payload == 'einkImage' && res.einkImage) {
      einkStore.$patch({ einkImage: res.einkImage });
    }
  }

  function handleDisconnected(): void {
    $resetState();
    versionStore.$resetState();
    knobStore.$resetState();
    rgbStore.$resetState();
    einkStore.$resetState();
  }

  async function open(type: TransportType = TransportType.USB_VENDOR): Promise<void> {
    if (type == TransportType.USB_VENDOR) {
      comm = new UsbCommVendorTransport(handleTransferIn, handleDisconnected);
    } else if (type == TransportType.USB_HID) {
      comm = new UsbCommHidTransport(handleTransferIn, handleDisconnected);
    } else {
      throw new Error(`Unsupported transport: ${TransportType[type]}`);
    }

    device.value = await comm.open();
    if (!device.value) {
      throw new Error('Device not supported');
    }
  }

  async function close(): Promise<void> {
    await comm?.close();
  }

  async function send(message: UsbComm.IMessageH2D) {
    await comm?.send(message);
  }

  function $resetState(): void {
    device.value = undefined;
  }

  return {
    device,
    open,
    close,
    send,
    $resetState,
  };
});

type IUsbCommStore = ReturnType<typeof useUsbComm>;

export function onDeviceConnected(store: IUsbCommStore, callback: (device: IUsbCommDevice) => void) {
  const device = toRef(store, 'device');

  function onConnected() {
    setTimeout(() => {
      if (device.value) {
        callback(device.value);
      }
    }, 10);
  }

  onMounted(onConnected);
  watch(device, onConnected);
}
