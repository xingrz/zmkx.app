<template>
  <p>
    <a-space direction="horizontal">
      <a-switch :checked="knobConfig?.demo" @update:checked="toggleDemo" />
      演示模式
    </a-space>
  </p>
  <p>
    <a-typography-text type="secondary">
      开启演示模式后，你可以选择让电机工作在不同模式，体验神奇的 FOC。但与此同时，旋钮会暂停上报按键信息，以避免误操作。
    </a-typography-text>
  </p>

  <a-radio-group :value="knobConfig?.mode" button-style="solid" :disabled="!knobConfig?.demo"
    @update:value="changeMode">
    <a-radio-button :value="KnobConfig.Mode.INERTIA">惯性</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.ENCODER">编码器</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.SPRING">弹簧</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.DAMPED">阻尼</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.SPIN">旋转</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.RATCHET">棘轮</a-radio-button>
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
      <a-statistic title="目标角度" :precision="1"
        :value="motorState.controlMode == MotorState.ControlMode.ANGLE ? radToDeg(radNorm(motorState.targetAngle)) : `---`"
        :suffix="motorState.controlMode == MotorState.ControlMode.ANGLE ? '°' : undefined"
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
    <div ref="angleLineEl" :style="{ height: '180px' }" />
  </section>

  <section :style="{ marginTop: '32px' }">
    <h3>实时力矩</h3>
    <div ref="torqueLineEl" :style="{ height: '180px' }" />
  </section>
</template>

<script lang="ts" setup>
import { onMounted, toRefs } from 'vue';
import { Line } from '@antv/g2plot';

import { onDeviceConnected, useUsbComm, type ITimedState } from '@/stores/usb';
import { KnobConfig, MotorState } from '@/proto/comm.proto';

import useIntervalAsync from '@/composables/useIntervalAsync';
import usePlot from '@/composables/usePlot';

import { radNorm, radToDeg } from '@/utils/math';

const comm = useUsbComm();
const { motorState, knobConfig, angleTimeline, torqueTimeline } = toRefs(comm);

function toggleDemo(demo: boolean): void {
  if (demo) {
    comm.setKnobConfig(KnobConfig.create({
      mode: KnobConfig.Mode.INERTIA,
      demo: true,
    }));
  } else {
    comm.setKnobConfig(KnobConfig.create({
      mode: KnobConfig.Mode.ENCODER,
      demo: false,
    }));
  }
}

function changeMode(mode: KnobConfig.Mode): void {
  comm.setKnobConfig(KnobConfig.create({
    mode: mode,
    demo: true,
  }));
}

onMounted(() => comm.resetTimelines());
onDeviceConnected(comm, () => comm.getKnobConfig());
useIntervalAsync(() => comm.getMotorState(), 20);

const controlModeNames: Record<MotorState.ControlMode, string> = {
  [MotorState.ControlMode.TORQUE]: '力矩',
  [MotorState.ControlMode.ANGLE]: '角度',
  [MotorState.ControlMode.VELOCITY]: '速度',
};

const timelineItemType: Record<ITimedState['type'], string> = {
  current: '当前',
  target: '目标',
};

const { el: angleLineEl } = usePlot(angleTimeline, (el, data) => new Line(el, {
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
    timestamp: {
      type: 'time',
    },
    value: {
      formatter: (sin: number | undefined) => {
        if (typeof sin == 'undefined') return;
        return radToDeg(Math.asin(sin)).toFixed(2)
      },
    },
    type: {
      formatter: (type: ITimedState['type']) => timelineItemType[type],
    },
  },
}));

const { el: torqueLineEl } = usePlot(torqueTimeline, (el, data) => new Line(el, {
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
    timestamp: {
      type: 'time',
    },
    value: {
      formatter: (velocity: number | undefined) => {
        if (typeof velocity == 'undefined') return;
        return velocity.toFixed(3)
      },
    },
    type: {
      formatter: (type: ITimedState['type']) => timelineItemType[type],
    },
  },
}));
</script>
