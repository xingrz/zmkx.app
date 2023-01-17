<template>
  <a-descriptions v-if="version" title="设备信息" :column="1" :label-style="{ width: '8em' }">
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
import { defineProps, onMounted, ref } from 'vue';

import { query } from '../comm';
import { MessageH2D, Action, Version } from '../proto/comm.proto';

const props = defineProps<{
  device: USBDevice;
}>();

const version = ref<Version>();

onMounted(async () => {
  const res = await query(props.device, 1, MessageH2D.create({
    action: Action.VERSION,
  }));

  version.value = res?.version;
});
</script>
