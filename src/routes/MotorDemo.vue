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
    <a-radio-button :value="KnobConfig.Mode.SPRING">摇杆</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.DAMPED">限位</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.SPIN">旋转</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.RATCHET">棘轮</a-radio-button>
  </a-radio-group>

  <a-divider />

  <a-row v-if="motorState" :gutter="[8, 8]">
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic title="控制模式" :value="controlModeNames[motorState.controlMode]" :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic title="当前角度" :precision="1" :value="radToDeg(radNorm(motorState.currentAngle))" suffix="°"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic title="当前速度" :precision="2" :value="motorState.currentVelocity" suffix="rad/s"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic title="目标角度" :precision="1"
        :value="motorState.controlMode == MotorState.ControlMode.ANGLE ? radToDeg(radNorm(motorState.targetAngle)) : `---`"
        :suffix="motorState.controlMode == MotorState.ControlMode.ANGLE ? '°' : undefined"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic title="目标速度" :precision="2" :value="motorState.targetVelocity" suffix="rad/s"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic title="目标电压" :precision="3" :value="motorState.targetVoltage" suffix="V"
        :style="{ textAlign: 'right' }" />
    </a-col>
  </a-row>

  <section :style="{ marginTop: '32px' }">
    <div ref="angleLineEl" :style="{ height: '180px' }" />
  </section>

  <section :style="{ marginTop: '32px' }">
    <div ref="torqueLineEl" :style="{ height: '180px' }" />
  </section>
</template>

<script lang="ts" setup>
import { shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import DataSet from '@antv/data-set';

import { onDeviceConnected, useUsbComm } from '@/stores/usb';
import { useKnobStore } from '@/stores/knob';
import { UsbComm } from '@/proto/comm.proto';

import useIntervalAsync from '@/composables/useIntervalAsync';
import useChart from '@/composables/useChart';
import useDataView from '@/composables/useDataView';

import { radNorm, radToDeg } from '@/utils/math';
import sliceLast from '@/utils/sliceLast';

const { KnobConfig, MotorState } = UsbComm;

const comm = useUsbComm();
const knobStore = useKnobStore();
const { motorState, knobConfig } = storeToRefs(knobStore);

function toggleDemo(demo: boolean): void {
  if (demo) {
    knobStore.setKnobConfigThottled({
      mode: UsbComm.KnobConfig.Mode.INERTIA,
      demo: true,
    });
  } else {
    knobStore.setKnobConfigThottled({
      mode: UsbComm.KnobConfig.Mode.ENCODER,
      demo: false,
    });
  }
}

function changeMode(mode: UsbComm.KnobConfig.Mode): void {
  knobStore.setKnobConfigThottled({
    mode: mode,
    demo: true,
  });
}

onDeviceConnected(comm, () => knobStore.getKnobConfig());
useIntervalAsync(() => knobStore.getMotorState(), 20);

const controlModeNames: Record<UsbComm.MotorState.ControlMode, string> = {
  [MotorState.ControlMode.TORQUE]: '力矩',
  [MotorState.ControlMode.ANGLE]: '角度',
  [MotorState.ControlMode.VELOCITY]: '速度',
};

const timeline = shallowRef<UsbComm.IMotorState[]>([]);
const ds = new DataSet();

watch(motorState, (state) => {
  if (state) {
    timeline.value.push(state);
    timeline.value = sliceLast(timeline.value, 500);
  }
});

const { el: angleLineEl } = useChart({
  autoFit: true,
  options: {
    animate: false,
    scales: {
      timestamp: {
        type: 'time',
      },
      currentAngleSin: {
        min: -1,
        max: 1,
        formatter: sinToDeg,
      },
      targetAngleSin: {
        min: -1,
        max: 1,
        formatter: sinToDeg,
      },
    },
    axes: {
      timestamp: false,
      targetAngleSin: false,
    },
    tooltip: false,
    legends: {
      custom: true,
      position: 'top-right',
      items: [
        { name: '当前角度', value: 'currentAngleSin', marker: { symbol: 'circle', style: { fill: '#69b1ff' } } },
        { name: '目标角度', value: 'targetAngleSin', marker: { symbol: 'circle', style: { fill: '#95de64' } } },
      ],
    },
  },
}, (chart) => {
  chart.line().position('timestamp*currentAngleSin').color('#69b1ff');
  chart.line().position('timestamp*targetAngleSin').color('#95de64');
  useDataView(ds, timeline, chart).transform({
    type: 'map',
    callback: (row) => {
      row.currentAngleSin = angleToSin(row.currentAngle);
      row.targetAngleSin = row.controlMode == UsbComm.MotorState.ControlMode.ANGLE ? angleToSin(row.targetAngle) : undefined;
      return row;
    },
  });
});

function angleToSin(angle: number | undefined) {
  return typeof angle == 'undefined' ? undefined : Math.sin(angle);
}

function sinToDeg(sin: number | undefined) {
  return typeof sin == 'undefined' ? undefined : radToDeg(Math.asin(sin)).toFixed(2);
}

const { el: torqueLineEl } = useChart({
  autoFit: true,
  options: {
    animate: false,
    scales: {
      timestamp: {
        type: 'time',
      },
      currentVelocity: {
        min: -100,
        max: 100,
        formatter: formatVelocity,
      },
      targetVelocity: {
        min: -100,
        max: 100,
        formatter: formatVelocity,
      },
    },
    axes: {
      timestamp: false,
      targetVelocity: false,
    },
    tooltip: false,
    legends: {
      custom: true,
      position: 'top-right',
      items: [
        { name: '当前速度', value: 'currentVelocity', marker: { symbol: 'circle', style: { fill: '#ffd666' } } },
        { name: '目标力矩', value: 'targetVelocity', marker: { symbol: 'circle', style: { fill: '#ff7875' } } },
      ],
    },
  },
}, (chart) => {
  chart.line().position('timestamp*currentVelocity').color('#ffd666');
  chart.line().position('timestamp*targetVelocity').color('#ff7875');
  useDataView(ds, timeline, chart);
});

function formatVelocity(velocity: number | undefined) {
  return typeof velocity == 'undefined' ? undefined : velocity.toFixed(3);
}
</script>
