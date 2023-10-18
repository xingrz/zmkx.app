<template>
  <a-config-provider :theme="themeConfig">
    <template v-if="device">
      <main-page />
    </template>
    <template v-else>
      <landing-page />
    </template>
    <a-space :class="$style.theme">
      <a-tooltip placement="bottomRight">
        <template #title>
          <span v-if="themeStore.darkMode">切换为浅色模式</span>
          <span v-else>切换为深色模式</span>
        </template>
        <a-button type="text" shape="circle" @click="themeStore.toggleDarkMode">
          <template #icon>
            <bulb-outlined />
          </template>
        </a-button>
      </a-tooltip>
    </a-space>
  </a-config-provider>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { theme } from 'ant-design-vue';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import {
  BulbOutlined,
} from '@ant-design/icons-vue';

import { useUsbComm } from '@/stores/usb';
import { useThemeStore } from '@/stores/theme';

import LandingPage from '@/pages/Landing.vue';
import MainPage from '@/pages/Main.vue';

const comm = useUsbComm();
const { device } = storeToRefs(comm);

const themeStore = useThemeStore();

const themeConfig = computed<ThemeConfig>(() => ({
  algorithm: themeStore.darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: '#15a4ad',
    colorInfo: '#15a4ad',
  },
}));

watch(themeStore, ({ darkMode }) => {
  document.getElementsByTagName('html')[0].style.colorScheme = darkMode ? 'dark' : 'light';
}, { immediate: true });
</script>

<style lang="scss" module>
:global(html, body) {
  margin: 0;
  padding: 0;
}

:global(.ant-alert-description p:last-child) {
  margin-bottom: 0;
}

.theme {
  position: fixed;
  right: 16px;
  top: 16px;
}
</style>
