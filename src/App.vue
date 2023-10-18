<template>
  <a-config-provider :theme="themeConfig">
    <template v-if="device">
      <main-page />
    </template>
    <template v-else>
      <landing-page />
    </template>
    <a-space :class="$style.theme">
      <a-dropdown placement="bottomRight">
        <a-button type="text" shape="circle">
          <template #icon>
            <translation-outlined />
          </template>
        </a-button>
        <template #overlay>
          <a-menu :items="locales" :selectedKeys="[i18nStore.preferLocale]" @click="selectLocale" />
        </template>
      </a-dropdown>
      <a-tooltip placement="bottomRight">
        <template #title>
          <span v-if="themeStore.darkMode">{{ t('switch-theme-light') }}</span>
          <span v-else>{{ t('switch-theme-dark') }}</span>
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
import { useI18n } from 'vue-i18n';
import { theme, type ItemType, type MenuProps } from 'ant-design-vue';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import {
  BulbOutlined,
  TranslationOutlined,
} from '@ant-design/icons-vue';

import { useUsbComm } from '@/stores/usb';
import { useThemeStore } from '@/stores/theme';
import { useI18nStore } from './stores/i18n';

import LandingPage from '@/pages/Landing.vue';
import MainPage from '@/pages/Main.vue';

const { t } = useI18n();

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

const i18nStore = useI18nStore();

const locales = computed<ItemType[]>(() => Object.keys(i18nStore.supportedLocales).map((locale) => ({
  key: locale,
  label: i18nStore.supportedLocales[locale],
})));

const selectLocale: MenuProps['onClick'] = ({ key }) => {
  i18nStore.preferLocale = key as string;
};
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

<i18n lang="yaml">
zh-Hans:
  switch-theme-light: 切换为浅色模式
  switch-theme-dark: 切换为深色模式
zh-Hant:
  switch-theme-light: 切換成淺色主題
  switch-theme-dark: 切換成深色主題
en:
  switch-theme-light: Switch to Light Mode
  switch-theme-dark: Switch to Dark Mode
</i18n>
