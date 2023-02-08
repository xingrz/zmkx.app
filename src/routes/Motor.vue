<template>
  <template v-if="versionStore.useFeature('knobPrefs')">
    <a-tabs destroy-inactive-tab-pane :class="$style.tabs">
      <a-tab-pane key="prefs" tab="偏好设置">
        <motor-prefs />
      </a-tab-pane>
      <a-tab-pane key="demo" tab="演示">
        <motor-demo />
      </a-tab-pane>
    </a-tabs>
  </template>
  <template v-else>
    <motor-demo />
  </template>
</template>

<script lang="ts" setup>
import { useVersionStore } from '@/stores/version';

import MotorDemo from './MotorDemo.vue';
import MotorPrefs from './MotorPrefs.vue';

const versionStore = useVersionStore();
</script>

<style lang="scss" module>
.tabs {
  :global(.ant-tabs-tab-btn) {
    font-size: 18px;
  }
}
</style>
