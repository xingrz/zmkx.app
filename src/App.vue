<template>
  <a-layout :class="$style.container">
    <a-layout-sider :style="{ background: 'none' }">
      <div :class="$style.logo">Dynamic</div>
      <div :class="$style.device">
        <a-button v-if="device" shape="round" size="large" block @click="comm.close">
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
        <a-menu-item key="rgb">
          <template #icon>
            <alert-outlined />
          </template>
          灯效
        </a-menu-item>
        <a-menu-item key="eink">
          <template #icon>
            <project-outlined />
          </template>
          墨水屏
        </a-menu-item>
        <a-menu-item key="motor">
          <template #icon>
            <loading-outlined v-if="comm.knobConfig?.demo" />
            <loading3-quarters-outlined v-else />
          </template>
          电机
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout-content :class="$style.main">
      <router-view v-slot="{ Component }" v-if="device">
        <component :is="Component" />
      </router-view>
      <a-alert v-else message="提示" type="info" :class="$style.help">
        <template #description>
          <p>这是 HW-75 Dynamic 的控制面板。请点击左侧的「连接设备」，从弹出的窗口中选择 HW-75 Dynamic。</p>
          <p>本面板需要搭配 <a href="https://github.com/xingrz/zmk-config_helloword_hw-75" target="_blank">ZMK 固件</a>使用。</p>
          <p>Windows 用户需使用 <a href="https://zadig.akeo.ie/" target="_blank">Zadig</a> 安装 libusb 驱动；Linux
            用户需要自行增加 udev 规则；macOS 用户无需任何设置。如无法找到设备，请检查固件是否最新版本、驱动是否正确安装。</p>
        </template>
      </a-alert>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  InfoCircleOutlined,
  AlertOutlined,
  ProjectOutlined,
  LoadingOutlined,
  Loading3QuartersOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

import { useUsbComm } from '@/stores/usb';

const router = useRouter();

const page = computed(() => [router.currentRoute.value.name]);
function navigate({ key }: { key: string }) {
  router.replace({ name: key });
}

const comm = useUsbComm();

const { device } = toRefs(comm);
watch(device, (device) => {
  if (device) {
    message.success('设备已连接');
  } else {
    message.success('设备已断开');
  }
});

const connecting = ref(false);
async function connect() {
  try {
    connecting.value = true;
    await comm.open();
  } finally {
    connecting.value = false;
  }
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
  padding: 16px;
  background: none;
}

.logo {
  height: 64px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 40px;
  line-height: 64px;
  text-align: center;
  margin-bottom: 32px;
  color: #334;
}

.device {
  padding: 0 16px 48px;
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
  padding: 16px 64px 0;
}

.help {
  max-width: 640px;

  p {
    margin-top: 16px;
    margin-bottom: 0;
  }
}
</style>
