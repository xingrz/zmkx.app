<template>
  <p>
    <a-space direction="horizontal">
      <a-switch v-model:checked="demo" />
      演示模式
    </a-space>
  </p>
  <p>
    <a-typography-text type="secondary">
      开启演示模式后，你可以选择让电机工作在不同模式，体验神奇的 FOC。但与此同时，旋钮会暂停上报按键信息，以避免误操作。
    </a-typography-text>
  </p>

  <a-radio-group v-model:value="knobMode" button-style="solid" :disabled="!demo">
    <a-radio-button :value="KnobMode.INERTIA">惯性</a-radio-button>
    <a-radio-button :value="KnobMode.ENCODER">编码器</a-radio-button>
    <a-radio-button :value="KnobMode.SPRING">弹簧</a-radio-button>
    <a-radio-button :value="KnobMode.DAMPED">阻尼</a-radio-button>
    <a-radio-button :value="KnobMode.SPIN">旋转</a-radio-button>
  </a-radio-group>

  <a-divider />

  <a-row v-if="motorState" :gutter="[8, 8]">
    <a-col :xs="24" :md="8" :lg="4">
      <a-statistic title="控制模式" :value="controlModeNames[motorState.controlMode]" :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="24" :md="8" :lg="4">
      <a-statistic title="当前角度" :precision="1" :value="radToDeg(radNorm(motorState.currentAngle))" suffix="°"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="24" :md="8" :lg="4">
      <a-statistic title="当前速度" :precision="2" :value="motorState.currentVelocity" suffix="rad/s"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="24" :md="8" :lg="4">
      <a-statistic title="目标角度" :precision="1" :value="radToDeg(radNorm(motorState.targetAngle))" suffix="°"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="24" :md="8" :lg="4">
      <a-statistic title="目标速度" :precision="2" :value="motorState.targetVelocity" suffix="rad/s"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="24" :md="8" :lg="4">
      <a-statistic title="目标电压" :precision="3" :value="motorState.targetVoltage" suffix="V"
        :style="{ textAlign: 'right' }" />
    </a-col>
  </a-row>

  <section :style="{ marginTop: '32px' }">
    <h3>实时角度</h3>
    <div ref="angleLineEl" :style="{ height: '200px' }" />
  </section>

  <section :style="{ marginTop: '32px' }">
    <h3>实时力矩</h3>
    <div ref="velocityLineEl" :style="{ height: '200px' }" />
  </section>
</template>

<script lang="ts" setup>
import { defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Line } from '@antv/g2plot';

import { query } from '../comm';
import { Action, KnobMode, MessageH2D, MotorControlMode, MotorState } from '../proto/comm.proto';

import usePlot from '../composables/usePlot';
import { radNorm, radToDeg } from '../utils/math';
import sliceLast from '../utils/sliceLast';

const props = defineProps<{
  device: USBDevice;
}>();

const demo = ref(false);
const knobMode = ref<KnobMode>(KnobMode.INERTIA);
watch(demo, async (demo) => {
  if (demo) {
    const res = await query(props.device, 1, MessageH2D.create({
      action: Action.SET_KNOB_CONFIG,
      knobConfig: {
        mode: KnobMode.INERTIA,
      },
    }));
    if (res?.knobConfig) {
      knobMode.value = res.knobConfig.mode;
    }
  } else {
    const res = await query(props.device, 1, MessageH2D.create({
      action: Action.RESET_KNOB_CONFIG,
    }));
    if (res?.knobConfig) {
      knobMode.value = res.knobConfig.mode;
    }
  }
});
watch(knobMode, async (mode) => {
  const res = await query(props.device, 1, MessageH2D.create({
    action: Action.SET_KNOB_CONFIG,
    knobConfig: {
      mode: mode,
    },
  }));
  if (res?.knobConfig) {
    knobMode.value = res.knobConfig.mode;
  }
});
onMounted(async () => {
  const res = await query(props.device, 1, MessageH2D.create({
    action: Action.GET_KNOB_CONFIG,
  }));
  if (res?.knobConfig) {
    knobMode.value = res.knobConfig.mode;
  }
});

const motorState = ref<MotorState>();

let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => timer = setInterval(load, 20));
onBeforeUnmount(() => clearInterval(timer));

async function load() {
  const res = await query(props.device, 1, MessageH2D.create({
    action: Action.GET_MOTOR_STATE,
  }));
  if (res?.motorState) {
    motorState.value = res.motorState;
    const i = res.motorState;
    angleLine.value = sliceLast([
      ...angleLine.value,
      {
        timestamp: i.timestamp,
        value: Math.sin(i.currentAngle),
        type: 'current',
      },
      {
        timestamp: i.timestamp,
        value: i.controlMode == MotorControlMode.ANGLE ? Math.sin(i.targetAngle) : undefined,
        type: 'target',
      },
    ], 1000);
    velocityLine.value = sliceLast([
      ...velocityLine.value,
      {
        timestamp: i.timestamp,
        value: i.currentVelocity,
        type: 'current',
      },
      {
        timestamp: i.timestamp,
        value: i.targetVelocity,
        type: 'target',
      },
    ], 1000);
  }
}

const controlModeNames: Record<MotorControlMode, string> = {
  [MotorControlMode.TORQUE]: '力矩',
  [MotorControlMode.ANGLE]: '角度',
  [MotorControlMode.VELOCITY]: '速度',
};

interface ITimedItem {
  timestamp: number;
  value: number | undefined;
  type: 'current' | 'target';
}

const angleLine = ref<ITimedItem[]>([]);
const velocityLine = ref<ITimedItem[]>([]);

const { el: angleLineEl } = usePlot(angleLine, (el, data) => new Line(el, {
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

const { el: velocityLineEl } = usePlot(velocityLine, (el, data) => new Line(el, {
  autoFit: true,
  animation: false,
  data: data,
  xField: 'timestamp',
  yField: 'value',
  seriesField: 'type',
  tooltip: false,
  xAxis: false,
  yAxis: {
    min: -110,
    max: 110,
  },
  meta: {
    value: {
      formatter: (velocity: number | undefined) => typeof velocity == 'undefined' ? undefined : velocity.toFixed(3),
    },
    type: {
      formatter: (type: string) => type == 'current' ? '当前' : '目标',
    },
  },
}));
</script>
