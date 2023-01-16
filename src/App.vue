<template>
  <a-space direction="vertical" :style="{ margin: '100px' }">
    <a-button :disabled="connected" @click="connect">连接</a-button>
    <a-button :disabled="!connected" @click="queryVersion">版本</a-button>
    <ul v-if="knobStatus" :class="$style.status">
      <li>控制模式: <code>{{ knobStatus.controlMode }}</code></li>
      <li>当前角度: <code>{{ radToAngle(knobStatus.currentAngle).toFixed(3) }}°</code></li>
      <li>当前电压: <code>{{ knobStatus.currentVelocity.toFixed(3) }}V</code></li>
      <li>目标角度: <code>{{ radToAngle(knobStatus.targetAngle).toFixed(3) }}°</code></li>
      <li>目标速度: <code>{{ radToAngle(knobStatus.targetVelocity / 1000).toFixed(3) }}°/ms</code></li>
      <li>目标电压: <code>{{ knobStatus.targetVoltage.toFixed(3) }}V</code></li>
    </ul>
  </a-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { query } from './comm';
import { Action, MessageH2D, KnobStatus } from './proto/comm.proto';

const connected = ref(false);

let device: USBDevice | undefined;

async function connect() {
  device = await navigator.usb.requestDevice({
    filters: [
      { vendorId: 0x1d50, productId: 0x615e },
    ]
  });

  navigator.usb.ondisconnect = () => {
    device = undefined;
    connected.value = false;
  };

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

const knobStatus = ref<KnobStatus>();

setInterval(async () => {
  if (!device) return;
  const res = await query(device, 1, MessageH2D.create({
    action: Action.KNOB_STATUS,
  }));
  knobStatus.value = res?.knobStatus;
}, 10);

function radToAngle(rad: number): number {
  return 360 * (rad / Math.PI);
}
</script>

<style lang="scss" module>
.status li code {
  display: inline-block;
  width: 100px;
  text-align: right;
}
</style>
