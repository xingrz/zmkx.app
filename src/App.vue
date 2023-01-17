<template>
  <a-space direction="vertical" :style="{ margin: '100px' }">
    <a-button :disabled="connected" @click="connect">连接</a-button>
    <a-button :disabled="!connected" @click="queryVersion">版本</a-button>
    <ul v-if="motorState" :class="$style.status">
      <li>控制模式: <code>{{ motorState.controlMode }}</code></li>
      <li>当前角度: <code>{{ radToDeg(radNorm(motorState.currentAngle)).toFixed(3) }}°</code></li>
      <li>当前速度: <code>{{ motorState.currentVelocity.toFixed(3) }}rad/s</code></li>
      <li>目标角度: <code>{{ radToDeg(radNorm(motorState.targetAngle) % (Math.PI * 2)).toFixed(3) }}°</code></li>
      <li>目标速度: <code>{{ motorState.targetVelocity.toFixed(3) }}rad/s</code></li>
      <li>目标电压: <code>{{ motorState.targetVoltage.toFixed(3) }}V</code></li>
    </ul>
    <a-radio-group v-model:value="knobMode" button-style="solid">
      <a-radio-button :value="undefined">复位</a-radio-button>
      <a-radio-button :value="KnobMode.INERTIA">惯性</a-radio-button>
      <a-radio-button :value="KnobMode.ENCODER">编码器</a-radio-button>
      <a-radio-button :value="KnobMode.SPRING">弹簧</a-radio-button>
      <a-radio-button :value="KnobMode.DAMPED">阻尼</a-radio-button>
      <a-radio-button :value="KnobMode.SPIN">旋转</a-radio-button>
    </a-radio-group>
  </a-space>
  <div v-if="motorState" ref="lineEl" :style="{ height: '200px' }" />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Line } from '@antv/g2plot';

import { Action, MessageH2D, MotorState, MotorControlMode, KnobMode } from '@/proto/comm.proto';
import usePlot from '@/composables/usePlot';
import { radNorm, radToDeg } from '@/utils/math';

import { query } from './comm';

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
    const s: MotorState = res.motorState;
    const t: ITimelineItem[] = [
      ...timeline.value,
      {
        timestamp: s.timestamp,
        value: Math.sin(s.currentAngle),
        type: 'current',
      },
      {
        timestamp: s.timestamp,
        value: s.controlMode == MotorControlMode.ANGLE ? Math.sin(s.targetAngle) : undefined,
        type: 'target',
      },
    ];
    timeline.value = t.slice(t.length - 1000, t.length);
  }
}, 20);

const knobMode = ref<KnobMode>();
watch(knobMode, async (mode) => {
  if (!device) return;
  if (typeof mode == 'undefined') {
    await query(device, 1, MessageH2D.create({
      action: Action.RESET_KNOB_CONFIG,
    }));
  } else {
    await query(device, 1, MessageH2D.create({
      action: Action.SET_KNOB_CONFIG,
      knobConfig: {
        mode: mode,
      },
    }));
  }
});

interface ITimelineItem {
  timestamp: number;
  value: number | undefined;
  type: 'current' | 'target';
}

const timeline = ref<ITimelineItem[]>([]);

const { el: lineEl } = usePlot(timeline, (el, data) => new Line(el, {
  autoFit: true,
  animation: false,
  data: data,
  xField: 'timestamp',
  yField: 'value',
  seriesField: 'type',
  tooltip: false,
  xAxis: false,
  yAxis: {
    min: -1,
    max: 1,
  },
  meta: {
    value: {
      formatter: (sin: number | undefined) => typeof sin == 'undefined' ? undefined : radToDeg(Math.asin(sin)).toFixed(2),
    },
    type: {
      formatter: (type: string) => type == 'current' ? '当前' : '目标',
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
