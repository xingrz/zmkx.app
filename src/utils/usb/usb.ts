import type { MessageD2H, MessageH2D } from '@/proto/comm.proto';

export interface IUsbCommTransport<T extends IUsbCommDevice> {
  open(): Promise<T | undefined>;
  close(): Promise<void>;
  send(req: MessageH2D): Promise<void>;
}

export type IUsbCommDevice = USBDevice | HIDDevice;

export type OnMessage = (res: MessageD2H) => void;

export type OnDisconnected = () => void;
