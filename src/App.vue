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
          <p>本面板需要搭配 <a :href="URL_ZMK" target="_blank">ZMK 固件</a>使用。</p>
          <p>如无法找到或无法连接设备，请参考 <a :href="URL_ZMK_WIKI" target="_blank">Wiki 上的相关说明</a>。</p>
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

const URL_ZMK = `https://github.com/xingrz/zmk-config_helloword_hw-75`;
const URL_ZMK_WIKI = `${URL_ZMK}/wiki/%E4%B8%8A%E4%BD%8D%E6%9C%BA%E9%A9%B1%E5%8A%A8-(%E6%89%A9%E5%B1%95)`;

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
