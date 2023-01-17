<template>
  <a-layout :class="$style.container">
    <a-layout-sider :style="{ background: 'none' }">
      <div :class="$style.device">
        <a-button v-if="device" shape="round" size="large" block @click="disconnect">
          断开设备
        </a-button>
        <a-button v-else shape="round" size="large" block type="primary" :loading="connecting" @click="connect">
          连接设备
        </a-button>
      </div>
      <a-menu mode="inline" :class="$style.nav" :disabled="!device">
        <a-menu-item key="1">
          <template #icon>
            <info-circle-outlined />
          </template>
          关于
        </a-menu-item>
        <a-menu-item key="2">
          <template #icon>
            <setting-outlined />
          </template>
          选项
        </a-menu-item>
        <a-menu-item key="3">
          <template #icon>
            <project-outlined />
          </template>
          墨水屏
        </a-menu-item>
        <a-sub-menu key="sub3">
          <template #icon>
            <experiment-outlined />
          </template>
          <template #title>
            高级
          </template>
          <a-menu-item key="9">电机参数</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout-content :style="{ padding: '20px' }">
      Content
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import {
  InfoCircleOutlined,
  SettingOutlined,
  ProjectOutlined,
  ExperimentOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const device = ref<USBDevice>();
const connecting = ref(false);

navigator.usb.addEventListener('disconnect', () => {
  device.value = undefined;
  message.error('设备已断开');
});

async function connect() {
  connecting.value = true;

  const dev = device.value = await navigator.usb.requestDevice({
    filters: [
      { vendorId: 0x1d50, productId: 0x615e },
    ],
  });

  await dev.open();
  await dev.claimInterface(0);

  message.success('设备已连接');

  connecting.value = false;
}

async function disconnect() {
  await device.value?.close();
  device.value = undefined;
  message.success('设备已断开');
}
</script>

<style lang="scss" module>
:global(html, body) {
  margin: 0;
  padding: 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 50px 20px;
  background: none;
}

.device {
  padding: 0 20px 40px;
}

.nav {
  padding-bottom: 100px;
  background: none;

  :global(.ant-menu-item),
  :global(.ant-menu-submenu-title) {
    height: 56px !important;
  }

  :global(.ant-menu-item-icon),
  :global(.ant-menu-title-content) {
    font-size: 18px;
  }
}
</style>
