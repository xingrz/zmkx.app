import type { IUsbCommTransport, OnDisconnected, OnList, OnMessage } from './usb';
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
    private readonly onList: OnList,
    private readonly onMessage: OnMessage,
    private readonly onDisconnected: OnDisconnected,
  ) {
    navigator.hid?.addEventListener('connect', () => {
      this.refreshList();
    });

    navigator.hid?.addEventListener('disconnect', ({ device }) => {
      this.refreshList();
      if (this.device == device) {
        this.onDisconnected();
        this.device = undefined;
      }
    });

    this.refreshList();

    this.handleInputEvent = this.handleInputEvent.bind(this);
  }

  private async refreshList(): Promise<void> {
    const devices = await navigator.hid?.getDevices();
    this.onList(devices.filter(filterDevice));
  }

  async pick(device: HIDDevice): Promise<HIDDevice | undefined> {
    if (!filterDevice(device)) {
      return undefined;
    }

    await device.open();

    this.device = device;
    this.reportOut = device.collections![0].outputReports![0].reportId;

    this.device.addEventListener('inputreport', this.handleInputEvent);

    return this.device;
  }

  async request(): Promise<HIDDevice | undefined> {
    const devices = await navigator.hid?.requestDevice({
      filters: [
        { vendorId: USB_VID, productId: USB_PID },
      ],
    });

    this.refreshList();

    const device = devices.filter(filterDevice)[0];
    if (!device) {
      return undefined;
    }

    return await this.pick(device);
  }

  async close(): Promise<void> {
    const device = this.device;
    this.device = undefined;
    if (device) {
      this.onDisconnected();
      device.removeEventListener('inputreport', this.handleInputEvent);
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

  private handleInputEvent(ev: HIDInputReportEvent): void {
    this.handleInput(new Uint8Array(ev.data.buffer));
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

function filterDevice(device: HIDDevice): boolean {
  return device.vendorId == USB_VID &&
    device.productId == USB_PID &&
    device.collections.some(({ usagePage, inputReports, outputReports }) =>
      usagePage == USB_COMM_USAGE_PAGE &&
      inputReports?.length == 1 &&
      outputReports?.length == 1
    );
}

function concat(head: Uint8Array | undefined, tail: Uint8Array): Uint8Array {
  return head ? new Uint8Array([...head, ...tail]) : tail;
}
