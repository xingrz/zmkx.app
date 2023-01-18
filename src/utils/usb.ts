import { MessageD2H, MessageH2D } from '@/proto/comm.proto';

const MAX_PACKET_SIZE = 64;

export async function transferOut(device: USBDevice, ep: number, req: MessageH2D): Promise<boolean> {
  const buf = MessageH2D.encode(req).finish();
  if (buf.length > MAX_PACKET_SIZE) {
    throw new Error('Request message is too long');
  }

  const write = await device.transferOut(ep, buf);
  return write.status == 'ok';
}

export async function transferIn(device: USBDevice, ep: number): Promise<MessageD2H | undefined> {
  const read = await device.transferIn(ep, MAX_PACKET_SIZE);
  if (read.status != 'ok' || !read.data) return;

  const res = MessageD2H.decode(new Uint8Array(read.data.buffer));
  return res;
}
