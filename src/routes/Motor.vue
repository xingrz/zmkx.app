<template>
  <template v-if="hasKnobPrefsFeature">
    <a-tabs destroy-inactive-tab-pane :class="$style.tabs">
      <a-tab-pane key="prefs" :tab="t('prefs')">
        <motor-prefs />
      </a-tab-pane>
      <a-tab-pane key="demo" :tab="t('demo')">
        <motor-demo />
      </a-tab-pane>
    </a-tabs>
  </template>
  <template v-else>
    <motor-demo />
  </template>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

import { useVersionStore } from '@/stores/version';

import MotorDemo from './MotorDemo.vue';
import MotorPrefs from './MotorPrefs.vue';

const { t } = useI18n();

const versionStore = useVersionStore();
const hasKnobPrefsFeature = versionStore.useFeature('knobPrefs');
</script>

<style lang="scss" module>
.tabs {
  :global(.ant-tabs-tab-btn) {
    font-size: 18px;
  }
}
</style>

<i18n lang="yaml">
zh-Hans:
  prefs: 偏好设置
  demo: 测试
zh-Hant:
  prefs: 偏好設定
  demo: 測試
en:
  prefs: Preferences
  demo: Demo
</i18n>
