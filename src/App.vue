<template>
  <a-space direction="vertical" :style="{ margin: '100px' }">
    <a-button :disabled="connected" @click="connect">连接</a-button>
    <a-button :disabled="!connected" @click="queryVersion">版本</a-button>
    <ul v-if="motorState" :class="$style.status">
      <li>控制模式: <code>{{ motorState.controlMode }}</code></li>
      <li>当前角度: <code>{{ radToAngle(motorState.currentAngle).toFixed(3) }}°</code></li>
      <li>当前电压: <code>{{ motorState.currentVelocity.toFixed(3) }}V</code></li>
      <li>目标角度: <code>{{ radToAngle(motorState.targetAngle).toFixed(3) }}°</code></li>
      <li>目标速度: <code>{{ radToAngle(motorState.targetVelocity / 1000).toFixed(3) }}°/ms</code></li>
      <li>目标电压: <code>{{ motorState.targetVoltage.toFixed(3) }}V</code></li>
    </ul>
  </a-space>
  <div v-if="motorState" ref="lineEl" :style="{ height: '500px' }" />
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Line } from '@antv/g2plot';

import { query } from './comm';
import { Action, MessageH2D, MotorState } from './proto/comm.proto';

import usePlot from '@/composables/usePlot';

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

const motorState = ref<MotorState>();

setInterval(async () => {
  if (!device) return;
  const res = await query(device, 1, MessageH2D.create({
    action: Action.GET_MOTOR_STATE,
  }));
  motorState.value = res?.motorState;
  if (res?.motorState) {
    const s = res.motorState;
    const t = [...timeline.value, {
      ...s,
      currentAngle: s.currentAngle % (Math.PI * 2),
    }];
    timeline.value = t.slice(t.length - 1000, t.length);
  }
}, 10);

function radToAngle(rad: number): number {
  return 360 * (rad / Math.PI);
}

const timeline = ref<MotorState[]>([]);

const { el: lineEl } = usePlot(timeline, (el, data) => new Line(el, {
  autoFit: true,
  animation: false,
  data: data,
  xField: 'timestamp',
  yField: 'currentAngle',
  tooltip: false,
  xAxis: false,
  yAxis: {
    min: Math.PI * -2,
    max: Math.PI * 2,
  },
  meta: {
    currentAngle: {
      min: Math.PI * -2,
      max: Math.PI * 2,
      formatter: (value: number) => radToAngle(value).toFixed(2),
    },
  },
}));
</script>

<style lang="scss" module>
.status li code {
  display: inline-block;
  width: 100px;
  text-align: right;
}
</style>
