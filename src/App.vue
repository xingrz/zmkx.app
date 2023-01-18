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
      <a-menu :selected-keys="page" mode="inline" :class="$style.nav" :disabled="!device" @select="navigate">
        <a-menu-item key="about">
          <template #icon>
            <info-circle-outlined />
          </template>
          关于
        </a-menu-item>
        <a-menu-item key="options">
          <template #icon>
            <setting-outlined />
          </template>
          选项
        </a-menu-item>
        <a-menu-item key="eink">
          <template #icon>
            <project-outlined />
          </template>
          墨水屏
        </a-menu-item>
        <a-menu-item key="motor">
          <template #icon>
            <loading3-quarters-outlined />
          </template>
          电机
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout-content :class="$style.main">
      <router-view v-slot="{ Component }">
        <component v-if="device" :is="Component" :device="device" />
      </router-view>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  InfoCircleOutlined,
  SettingOutlined,
  ProjectOutlined,
  Loading3QuartersOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

import { useUsbComm } from '@/stores/usb';
import { transferIn } from '@/utils/usb';

const router = useRouter();
const { handleTransferIn } = useUsbComm();

const page = computed(() => [router.currentRoute.value.name]);
function navigate({ key }: { key: string }) {
  router.replace({ name: key });
}

const device = ref<USBDevice>();
const connecting = ref(false);

navigator.usb.addEventListener('disconnect', () => {
  device.value = undefined;
  message.error('设备已断开');
});

async function connect() {
  connecting.value = true;

  const dev = await navigator.usb.requestDevice({
    filters: [
      { vendorId: 0x1d50, productId: 0x615e },
    ],
  });

  await dev.open();
  await dev.claimInterface(0);

  message.success('设备已连接');

  device.value = dev;
  connecting.value = false;

  setTimeout(async () => {
    while (device.value) {
      try {
        handleTransferIn(await transferIn(device.value, 1));
      } catch (e) {
        break;
      }
    }
  }, 0);
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
  max-width: 1800px;
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
    user-select: none;
  }
}

.main {
  padding: 0 64px;
}
</style>
