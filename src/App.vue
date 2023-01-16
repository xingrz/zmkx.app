<template>
  <a-space direction="vertical" :style="{ margin: '100px' }">
    <a-button :disabled="connected" @click="connect">连接</a-button>
    <a-button :disabled="!connected" @click="queryVersion">版本</a-button>
  </a-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { query } from './comm';
import { Action, MessageH2D } from './proto/comm.proto';

const connected = ref(false);

let device: USBDevice | undefined;

async function connect() {
  device = await navigator.usb.requestDevice({
    filters: [
      { vendorId: 0x1d50, productId: 0x615e },
    ]
  });

  await device.open();
  await device.claimInterface(0);
  console.log(device.configurations);

  connected.value = true;
}

async function queryVersion() {
  if (!device) return;

  const res = await query(device, 1, MessageH2D.create({
    action: Action.VERSION,
  }));

  console.log('output', res?.toJSON());
}
</script>
