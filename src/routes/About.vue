<template>
  <a-descriptions v-if="device" title="设备" :column="1" :label-style="{ width: '8em' }">
    <a-descriptions-item label="厂商名称">
      <code>{{ device.manufacturerName }}</code>
    </a-descriptions-item>
    <a-descriptions-item label="产品名称">
      <code>{{ device.productName }}</code>
    </a-descriptions-item>
    <a-descriptions-item label="VID">
      <code>{{ device.vendorId.toString(16).padStart(4, '0') }}</code>
    </a-descriptions-item>
    <a-descriptions-item label="PID">
      <code>{{ device.productId.toString(16).padStart(4, '0') }}</code>
    </a-descriptions-item>
    <a-descriptions-item label="序列号">
      <code>{{ device.serialNumber }}</code>
    </a-descriptions-item>
  </a-descriptions>
  <a-divider />
  <a-descriptions v-if="version" title="固件" :column="1" :label-style="{ width: '8em' }">
    <a-descriptions-item label="固件版本">
      <a :href="`https://github.com/xingrz/zmk-config_helloword_hw-75/tree/${version.appVersion}`" target="_blank"
        noreferred>
        <code>{{ version.appVersion }}</code>
      </a>
    </a-descriptions-item>
    <a-descriptions-item label="ZMK 版本">
      <a :href="`https://github.com/zmkfirmware/zmk/tree/${version.zmkVersion}`" target="_blank" noreferred>
        <code>{{ version.zmkVersion }}</code>
      </a>
    </a-descriptions-item>
    <a-descriptions-item label="Zephyr 版本">
      <a :href="`https://github.com/zephyrproject-rtos/zephyr/tree/${version.zephyrVersion}`" target="_blank"
        noreferred>
        <code>{{ version.zephyrVersion }}</code>
      </a>
    </a-descriptions-item>
  </a-descriptions>
  <a-divider />
  <p><a href="https://github.com/xingrz/zmk-config_helloword_hw-75/issues" target="_blank">固件问题反馈</a></p>
  <p><a href="https://github.com/xingrz/zmk-config_helloword_hw-75/releases" target="_blank">获取最新固件版本</a></p>
</template>

<script lang="ts" setup>
import { toRefs } from 'vue';

import { onDeviceConnected, useUsbComm } from '@/stores/usb';

const comm = useUsbComm();
const { device, version } = toRefs(comm);

onDeviceConnected(comm, () => comm.getVersion());
</script>
