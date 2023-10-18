<template>
  <a-descriptions v-if="device" :title="t('device')" :column="1" :label-style="{ width: '8em' }">
    <a-descriptions-item :label="t('device')">
      <code>{{ device.productName }}</code>
    </a-descriptions-item>
    <a-descriptions-item label="VID">
      <code>{{ device.vendorId.toString(16).padStart(4, '0') }}</code>
    </a-descriptions-item>
    <a-descriptions-item label="PID">
      <code>{{ device.productId.toString(16).padStart(4, '0') }}</code>
    </a-descriptions-item>
  </a-descriptions>
  <a-divider />
  <a-descriptions v-if="version" :title="t('firmware')" :column="1" :label-style="{ width: '16em' }">
    <a-descriptions-item :label="t('firmware-version')">
      <a :href="`https://github.com/xingrz/zmk-config_helloword_hw-75/tree/${version.appVersion}`" target="_blank"
        noreferred>
        <code>{{ version.appVersion }}</code>
      </a>
    </a-descriptions-item>
    <a-descriptions-item :label="t('zmk-version')">
      <a :href="`https://github.com/zmkfirmware/zmk/tree/${version.zmkVersion}`" target="_blank" noreferred>
        <code>{{ version.zmkVersion }}</code>
      </a>
    </a-descriptions-item>
    <a-descriptions-item :label="t('zephyr-version')">
      <a :href="`https://github.com/zephyrproject-rtos/zephyr/tree/${version.zephyrVersion}`" target="_blank" noreferred>
        <code>{{ version.zephyrVersion }}</code>
      </a>
    </a-descriptions-item>
  </a-descriptions>
  <a-divider />
  <p><a href="https://github.com/xingrz/zmk-config_helloword_hw-75/issues" target="_blank">{{ t('report') }}</a></p>
  <p><a href="https://github.com/xingrz/zmk-config_helloword_hw-75/releases" target="_blank">{{ t('download') }}</a></p>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useUsbComm } from '@/stores/usb';
import { useVersionStore } from '@/stores/version';

const { t } = useI18n();

const comm = useUsbComm();
const versionStore = useVersionStore();
const { device } = storeToRefs(comm);
const { version } = storeToRefs(versionStore);
</script>

<i18n lang="yaml">
zh-Hans:
  device: 设备
  firmware: 固件
  firmware-version: 固件版本
  zmk-version: ZMK 版本
  zephyr-version: Zephyr 版本
  report: 固件问题反馈
  download: 获取最新固件版本
zh-Hant:
  device: 裝置
  firmware: 韌體
  firmware-version: 韌體版本
  zmk-version: ZMK 版本
  zephyr-version: Zephyr 版本
  report: 固件問題回報
  download: 取得最新韌體版本
en:
  device: Device
  firmware: Firmware
  firmware-version: Firmware Version
  zmk-version: ZMK Version
  zephyr-version: Zephyr Version
  report: Report Firmware Issue
  download: Get the Latest Firmware Version
</i18n>
