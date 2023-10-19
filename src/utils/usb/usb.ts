import type { UsbComm } from '@/proto/comm.proto';

export interface IUsbCommTransport<T extends IUsbCommDevice> {
  pick(device: T): Promise<T | undefined>;
  request(): Promise<T | undefined>;
  close(): Promise<void>;
  send(req: UsbComm.IMessageH2D): Promise<void>;
}

export type IUsbCommDevice = USBDevice | HIDDevice;

export type OnList = (devices: IUsbCommDevice[]) => void;

export type OnMessage = (res: UsbComm.MessageD2H) => void;

export type OnDisconnected = () => void;
