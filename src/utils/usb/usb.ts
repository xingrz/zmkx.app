import type { UsbComm } from '@/proto/comm.proto';

export interface IUsbCommTransport<T extends IUsbCommDevice> {
  open(): Promise<T | undefined>;
  close(): Promise<void>;
  send(req: UsbComm.IMessageH2D): Promise<void>;
}

export type IUsbCommDevice = USBDevice | HIDDevice;

export type OnMessage = (res: UsbComm.MessageD2H) => void;

export type OnDisconnected = () => void;
