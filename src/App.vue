<template>
  <template v-if="device">
    <main-page />
  </template>
  <template v-else>
    <landing-page />
  </template>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { useUsbComm } from '@/stores/usb';

import LandingPage from '@/pages/Landing.vue';
import MainPage from '@/pages/Main.vue';

const comm = useUsbComm();
const { device } = storeToRefs(comm);
</script>

<style lang="scss" module>
:global(html, body) {
  margin: 0;
  padding: 0;
}

:global(.ant-alert-description p:last-child) {
  margin-bottom: 0;
}
</style>
