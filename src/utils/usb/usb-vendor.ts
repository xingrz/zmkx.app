import type { IUsbCommTransport, OnDisconnected, OnMessage } from './usb';
import { Action, MessageD2H, MessageH2D } from '@/proto/comm.proto';

const USB_VID = 0x1d50;
const USB_PID = 0x615e;

const USB_COMM_INTF_CLASS = 0xff;
const USB_COMM_INTF_SUBCLASS = 0;
const USB_COMM_INTF_PROTOCOL = 0;

export class UsbCommVendorTransport implements IUsbCommTransport<USBDevice> {

  private device: USBDevice | undefined;

  private epIn: USBEndpoint | undefined;
  private epOut: USBEndpoint | undefined;

  private queueIn: Uint8Array | undefined;

  constructor(
    private readonly onMessage: OnMessage,
    private readonly onDisconnected: OnDisconnected,
  ) {
    navigator.usb?.addEventListener('disconnect', () => {
      this.onDisconnected();
      this.device = undefined;
    });
  }

  async open(): Promise<USBDevice | undefined> {
    const device = await navigator.usb?.requestDevice({
      filters: [
        { vendorId: USB_VID, productId: USB_PID },
      ],
    });

    await device.open();

    const eps = await configure(device);
    if (!eps) {
      await device.close();
      return undefined;
    }

    await sync(device, eps[1]);

    this.epIn = eps[0];
    this.epOut = eps[1];
    this.device = device;

    setTimeout(() => this.receive(), 0);

    return device;
  }

  async close(): Promise<void> {
    const device = this.device;
    this.device = undefined;
    if (device) {
      this.onDisconnected();
      await device.close();
    }
  }

  async send(req: MessageH2D): Promise<void> {
    if (!this.device || !this.epOut) return;
    const { packetSize, endpointNumber } = this.epOut;

    const message = MessageH2D.encodeDelimited(req).finish();

    // NOTE: We do want a 0-byte buffer as EOF
    for (let i = 0; i <= message.length; i += packetSize) {
      const buf = message.subarray(i, i + packetSize);
      const write = await this.device.transferOut(endpointNumber, buf);
      if (write.status != 'ok') return;
    }
  }

  private async receive(): Promise<void> {
    if (!this.device || !this.epIn) return;

    try {
      const read = await this.device.transferIn(this.epIn.endpointNumber, this.epIn.packetSize);
      if (read.status != 'ok' || !read.data) {
        setTimeout(() => this.receive(), 0);
        return;
      }

      const buf = new Uint8Array(read.data.buffer);

      this.queueIn = concat(this.queueIn, buf);
      if (read.data.byteLength < this.epIn.packetSize) {
        try {
          const res = MessageD2H.decodeDelimited(this.queueIn);
          this.onMessage(res);
        } catch (e) {
          console.error('Failed decoding response', e);
        }
        this.queueIn = undefined;
      }

      setTimeout(() => this.receive(), 0);
    } catch (e) {
      console.error('Failed reading device', e);
      this.close();
    }
  }
}

async function configure(device: USBDevice): Promise<[USBEndpoint, USBEndpoint] | undefined> {
  for (const conf of device.configurations) {
    for (const intf of conf.interfaces) {
      for (const alt of intf.alternates) {
        if (alt.interfaceClass != USB_COMM_INTF_CLASS) continue;
        if (alt.interfaceSubclass != USB_COMM_INTF_SUBCLASS) continue;
        if (alt.interfaceProtocol != USB_COMM_INTF_PROTOCOL) continue;

        const epIn = alt.endpoints.find((ep) => ep.direction == 'in' && ep.type == 'bulk');
        const epOut = alt.endpoints.find((ep) => ep.direction == 'out' && ep.type == 'bulk');
        if (!epIn || !epOut) continue;

        await device.selectConfiguration(conf.configurationValue);
        await device.claimInterface(intf.interfaceNumber);
        await device.selectAlternateInterface(intf.interfaceNumber, alt.alternateSetting);

        return [epIn, epOut];
      }
    }
  }
}

async function sync(device: USBDevice, ep: USBEndpoint): Promise<void> {
  await device.transferOut(ep.endpointNumber, MessageH2D.encodeDelimited(MessageH2D.create({
    action: Action.NOP,
    payload: 'nop',
    nop: {},
  })).finish());
}

function concat(head: Uint8Array | undefined, tail: Uint8Array): Uint8Array {
  return head ? new Uint8Array([...head, ...tail]) : tail;
}
