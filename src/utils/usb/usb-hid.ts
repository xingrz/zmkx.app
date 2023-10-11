import type { IUsbCommTransport, OnDisconnected, OnMessage } from './usb';
import { UsbComm } from '@/proto/comm.proto';

const USB_VID = 0x1d50;
const USB_PID = 0x615e;

const USB_COMM_USAGE_PAGE = 0xff14;
const HID_COMM_REPORT_COUNT = 63;
const USB_COMM_PAYLOAD_SIZE = HID_COMM_REPORT_COUNT - 1;

export class UsbCommHidTransport implements IUsbCommTransport<HIDDevice> {

  private device: HIDDevice | undefined;

  private reportOut: number | undefined;

  private queueIn: Uint8Array | undefined;

  constructor(
    private readonly onMessage: OnMessage,
    private readonly onDisconnected: OnDisconnected,
  ) {
    navigator.hid?.addEventListener('disconnect', () => {
      this.onDisconnected();
      this.device = undefined;
    });
  }

  async open(): Promise<HIDDevice | undefined> {
    const devices = await navigator.hid?.requestDevice({
      filters: [
        { vendorId: USB_VID, productId: USB_PID },
      ],
    });

    const reports = findDevice(devices);
    if (!reports) {
      return undefined;
    }

    await reports[0].open();

    this.device = reports[0];
    this.reportOut = reports[2].reportId;

    this.device.addEventListener('inputreport', (ev) => {
      this.handleInput(new Uint8Array(ev.data.buffer));
    });

    return this.device;
  }

  async close(): Promise<void> {
    const device = this.device;
    this.device = undefined;
    if (device) {
      this.onDisconnected();
      await device.close();
    }
  }

  async send(req: UsbComm.IMessageH2D): Promise<void> {
    if (!this.device || !this.reportOut) return;

    const message = UsbComm.MessageH2D.encodeDelimited(req).finish();

    // NOTE: We do want a 0-byte buffer as EOF
    for (let i = 0; i <= message.length; i += USB_COMM_PAYLOAD_SIZE) {
      const buf = message.subarray(i, i + USB_COMM_PAYLOAD_SIZE);
      const out = new Uint8Array(HID_COMM_REPORT_COUNT);
      out[0] = buf.length;
      out.set(buf, 1);
      await this.device.sendReport(this.reportOut, out);
    }
  }

  private handleInput(data: Uint8Array): void {
    const len = data[0];
    this.queueIn = concat(this.queueIn, data.subarray(1, 1 + len));

    try {
      const res = UsbComm.MessageD2H.decodeDelimited(this.queueIn);
      this.queueIn = undefined;
      this.onMessage(res);
    } catch (ignored) {
    }
  }

}

function findDevice(devices: HIDDevice[]): [HIDDevice, HIDReportInfo, HIDReportInfo] | undefined {
  for (const device of devices) {
    for (const { usagePage, inputReports, outputReports } of device.collections) {
      if (usagePage == USB_COMM_USAGE_PAGE && inputReports?.length == 1 && outputReports?.length == 1) {
        return [device, inputReports[0], outputReports[0]];
      }
    }
  }
}

function concat(head: Uint8Array | undefined, tail: Uint8Array): Uint8Array {
  return head ? new Uint8Array([...head, ...tail]) : tail;
}
