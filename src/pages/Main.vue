<template>
  <a-layout :class="$style.container">
    <a-layout-sider v-model:collapsed="collapsed" breakpoint="lg" :style="{ background: 'none' }">
      <div :class="$style.logo" v-show="!collapsed">ZMKX</div>
      <div :class="$style.device">
        <a-button v-if="collapsed" shape="circle" size="large" @click="comm.close">
          <template #icon>
            <disconnect-outlined />
          </template>
        </a-button>
        <a-button v-else shape="round" size="large" block @click="comm.close">
          {{ t('disconnect') }}
        </a-button>
      </div>
      <a-menu :selected-keys="page" mode="inline" :class="$style.nav" @select="navigate">
        <a-menu-item key="about">
          <template #icon>
            <info-circle-outlined />
          </template>
          {{ t('about') }}
        </a-menu-item>
        <a-menu-item key="rgb" v-if="!version?.features || version.features.rgb">
          <template #icon>
            <alert-outlined />
          </template>
          {{ t('rgb') }}
        </a-menu-item>
        <a-menu-item key="eink" v-if="!version?.features || version.features.eink">
          <template #icon>
            <project-outlined />
          </template>
          {{ t('eink') }}
        </a-menu-item>
        <a-menu-item key="motor" v-if="!version?.features || version.features.knob">
          <template #icon>
            <loading-outlined v-if="knobStore.knobConfig?.demo" />
            <loading3-quarters-outlined v-else />
          </template>
          {{ t('motor') }}
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout-content :class="{ [$style.main]: true, [$style.collapsed]: collapsed }">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  DisconnectOutlined,
  InfoCircleOutlined,
  AlertOutlined,
  ProjectOutlined,
  LoadingOutlined,
  Loading3QuartersOutlined,
} from '@ant-design/icons-vue';
import { useUsbComm, onDeviceConnected } from '@/stores/usb';
import { useVersionStore } from '@/stores/version';
import { useKnobStore } from '@/stores/knob';

const { t } = useI18n();

const collapsed = ref(false);

const router = useRouter();

const page = computed(() => [router.currentRoute.value.name]);
function navigate({ key }: { key: string }) {
  router.replace({ name: key });
}

const comm = useUsbComm();
const versionStore = useVersionStore();
const knobStore = useKnobStore();

const { version } = storeToRefs(versionStore);

onDeviceConnected(comm, () => versionStore.getVersion());
</script>

<style lang="scss" module>
.container {
  max-width: 1800px;
  margin: 0 auto;
  background: none;
}

.logo {
  height: 64px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 60px;
  line-height: 64px;
  text-align: center;
  margin-top: 16px;
}

.device {
  padding: 32px 16px 48px;
  text-align: center;
}

.nav {
  padding-bottom: 100px;
  background: none;

  :global(.ant-menu-item),
  :global(.ant-menu-submenu-title) {
    height: 56px;
    line-height: 56px;
  }

  :global(.ant-menu-item-icon),
  :global(.ant-menu-title-content) {
    font-size: 18px;
    user-select: none;
  }
}

.main {
  padding: 32px 64px;

  &.collapsed {
    padding: 24px 16px;
  }
}
</style>

<i18n lang="yaml">
zh-Hans:
  disconnect: 断开设备
  about: 关于
  rgb: 灯效
  eink: 墨水屏
  motor: 旋钮
zh-Hant:
  disconnect: 斷開裝置
  about: 關於
  rgb: 燈效
  eink: 墨水屏
  motor: 旋鈕
en:
  disconnect: Disconnect
  about: About
  rgb: RGB
  eink: E-Ink
  motor: Knob
</i18n>
