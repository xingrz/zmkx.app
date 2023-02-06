import type { MessageD2H, MessageH2D } from '@/proto/comm.proto';

export interface IUsbCommTransport {
  open(): Promise<USBDevice | undefined>;
  close(): Promise<void>;
  send(req: MessageH2D): Promise<void>;
}

export type OnMessage = (res: MessageD2H) => void;

export type OnDisconnected = () => void;
