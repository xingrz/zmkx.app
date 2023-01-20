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
      <router-view v-slot="{ Component }">
        <component v-if="device" :is="Component" />
      </router-view>
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
</style>
