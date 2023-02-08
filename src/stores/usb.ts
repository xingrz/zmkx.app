import { onMounted, ref, toRef, watch } from 'vue';
import { defineStore } from 'pinia';

import type { IUsbCommDevice, IUsbCommTransport } from '@/utils/usb/usb';
import { UsbCommVendorTransport } from '@/utils/usb/usb-vendor';
import { UsbCommHidTransport } from '@/utils/usb/usb-hid';
import sliceLast from '@/utils/sliceLast';

import { UsbComm } from '@/proto/comm.proto';

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

export enum TransportType {
  USB_VENDOR,
  USB_HID,
}

export const useUsbComm = defineStore('usb', () => {
  const device = ref<IUsbCommDevice>();

  const version = ref<UsbComm.IVersion>();
  const motorState = ref<UsbComm.IMotorState>();
  const knobConfig = ref<UsbComm.IKnobConfig>();
  const angleTimeline = ref<ITimedState[]>([]);
  const torqueTimeline = ref<ITimedState[]>([]);
  const rgbState = ref<UsbComm.IRgbState>();
  const einkImage = ref<UsbComm.IEinkImage>();

  let comm: IUsbCommTransport<IUsbCommDevice> | undefined;

  function handleTransferIn(res: UsbComm.MessageD2H): void {
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
    if (res.payload == 'knobPref' && res.knobPref) {
      if (knobConfig.value && knobConfig.value?.prefs?.[res.knobPref.layerId]) {
        const prefs = [...knobConfig.value.prefs];
        prefs[res.knobPref.layerId] = { ...[res.knobPref.layerId], ...res.knobPref };
        knobConfig.value = UsbComm.KnobConfig.create({
          ...knobConfig.value,
          prefs,
        });
      }
    }
    if (res.payload == 'rgbState' && res.rgbState) {
      rgbState.value = res.rgbState;
    }
    if (res.payload == 'einkImage' && res.einkImage) {
      einkImage.value = res.einkImage;
    }
  }

  function handleDisconnected(): void {
    device.value = undefined;
    version.value = undefined;
  }

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

  async function getVersion(): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.VERSION,
      nop: {},
    });
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

  async function updateKnobPref(pref: UsbComm.KnobConfig.IPref): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.KNOB_UPDATE_PREF,
      knobPref: pref,
    });
  }

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

  async function setEinkImage(id: number, bits: Uint8Array): Promise<void> {
    await comm?.send({
      action: UsbComm.Action.EINK_SET_IMAGE,
      einkImage: { id, bitsLength: bits.length, bits },
    });
  }

  return {
    device,
    version,
    motorState,
    knobConfig,
    angleTimeline,
    torqueTimeline,
    rgbState,
    einkImage,
    resetTimelines,
    open,
    close,
    getVersion,
    getMotorState,
    getKnobConfig,
    setKnobConfig,
    updateKnobPref,
    sendRgbControl,
    getRgbState,
    setRgbState,
    setEinkImage,
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
