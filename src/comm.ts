import { MessageD2H, MessageH2D } from './proto/comm.proto';

const MAX_PACKET_SIZE = 64;

export async function query(device: USBDevice, ep: number, req: MessageH2D): Promise<MessageD2H | undefined> {
  const write = await device.transferOut(ep, MessageH2D.encode(req).finish());
  if (write.status != 'ok') return;

  const read = await device.transferIn(ep, MAX_PACKET_SIZE);
  if (read.status != 'ok' || !read.data) return;

  const res = MessageD2H.decode(new Uint8Array(read.data.buffer));
  if (res.action != req.action) return;

  return res;
}
