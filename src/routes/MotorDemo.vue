<template>
  <p>
    <a-space direction="horizontal">
      <a-switch :checked="knobConfig?.demo" @update:checked="toggleDemo" />
      {{ t('demo') }}
    </a-space>
  </p>
  <p>
    <a-typography-text type="secondary">
      {{ t('demo-hint') }}
    </a-typography-text>
  </p>

  <a-radio-group :value="knobConfig?.mode" button-style="solid" :disabled="!knobConfig?.demo" @update:value="changeMode">
    <a-radio-button :value="KnobConfig.Mode.INERTIA">{{ t('mode-inertia') }}</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.ENCODER">{{ t('mode-encoder') }}</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.SPRING">{{ t('mode-spring') }}</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.DAMPED">{{ t('mode-damped') }}</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.SPIN">{{ t('mode-spin') }}</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.RATCHET">{{ t('mode-ratchet') }}</a-radio-button>
    <a-radio-button :value="KnobConfig.Mode.SWITCH" v-if="hasKnobProfileSwitch">{{ t('mode-switch') }}</a-radio-button>
  </a-radio-group>

  <a-divider />

  <a-row v-if="motorState" :gutter="[8, 8]">
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic :title="t('control-mode')" :value="controlModeNames[motorState.controlMode]"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic :title="t('current-angle')" :precision="1" :value="radToDeg(radNorm(motorState.currentAngle))"
        suffix="°" :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic :title="t('current-velocity')" :precision="2" :value="motorState.currentVelocity" suffix="rad/s"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic :title="t('target-angle')" :precision="1"
        :value="motorState.controlMode == MotorState.ControlMode.ANGLE ? radToDeg(radNorm(motorState.targetAngle)) : `---`"
        :suffix="motorState.controlMode == MotorState.ControlMode.ANGLE ? '°' : undefined"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic :title="t('target-velocity')" :precision="2" :value="motorState.targetVelocity" suffix="rad/s"
        :style="{ textAlign: 'right' }" />
    </a-col>
    <a-col :xs="12" :md="8" :lg="4">
      <a-statistic :title="t('target-voltage')" :precision="3" :value="motorState.targetVoltage" suffix="V"
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
import { computed, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import DataSet from '@antv/data-set';

import { useVersionStore } from '@/stores/version';
import { onDeviceConnected, useUsbComm } from '@/stores/usb';
import { useKnobStore } from '@/stores/knob';
import { UsbComm } from '@/proto/comm.proto';

import useIntervalAsync from '@/composables/useIntervalAsync';
import useChart from '@/composables/useChart';
import useDataView from '@/composables/useDataView';

import { radNorm, radToDeg } from '@/utils/math';
import sliceLast from '@/utils/sliceLast';

const { t } = useI18n();

const { KnobConfig, MotorState } = UsbComm;

const comm = useUsbComm();
const knobStore = useKnobStore();
const { motorState, knobConfig } = storeToRefs(knobStore);

const versionStore = useVersionStore();
const hasKnobProfileSwitch = versionStore.useFeature('knobProfileSwitch');

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

const controlModeNames = computed<Record<UsbComm.MotorState.ControlMode, string>>(() => ({
  [MotorState.ControlMode.TORQUE]: t('control-mode-torque'),
  [MotorState.ControlMode.ANGLE]: t('control-mode-angle'),
  [MotorState.ControlMode.VELOCITY]: t('control-mode-velocity'),
}));

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
        { name: t('current-angle'), value: 'currentAngleSin', marker: { symbol: 'circle', style: { fill: '#69b1ff' } } },
        { name: t('target-angle'), value: 'targetAngleSin', marker: { symbol: 'circle', style: { fill: '#95de64' } } },
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
        { name: t('current-velocity'), value: 'currentVelocity', marker: { symbol: 'circle', style: { fill: '#ffd666' } } },
        { name: t('target-torque'), value: 'targetVelocity', marker: { symbol: 'circle', style: { fill: '#ff7875' } } },
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

<i18n lang="yaml">
zh-Hans:
  demo: 测试模式
  demo-hint: 该功能仅用于测试电机在不同模式下是否工作正常。开启后，旋钮会暂停上报按键信息，以避免误操作。
  mode-inertia: 惯性
  mode-encoder: 编码器
  mode-spring: 摇杆
  mode-damped: 限位
  mode-spin: 旋转
  mode-ratchet: 棘轮
  mode-switch: 开关
  control-mode: 控制模式
  control-mode-torque: 力矩
  control-mode-angle: 角度
  control-mode-velocity: 速度
  current-angle: 当前角度
  current-velocity: 当前速度
  target-angle: 目标角度
  target-velocity: 目标速度
  target-voltage: 目标电压
  target-torque: 目标力矩
zh-Hant:
  demo: 測試模式
  demo-hint: 這個功能僅用於測試馬達在不同模式下是否正常運作。啟用後，旋鈕將暫停回報按鍵，以避免誤操作。
  mode-inertia: 慣性
  mode-encoder: 編碼器
  mode-spring: 搖桿
  mode-damped: 限位
  mode-spin: 旋轉
  mode-ratchet: 齒輪
  mode-switch: 開關
  control-mode: 控制模式
  control-mode-torque: 扭矩
  control-mode-angle: 角度
  control-mode-velocity: 速度
  current-angle: 當前角度
  current-velocity: 當前速度
  target-angle: 目標角度
  target-velocity: 目標速度
  target-voltage: 目標電壓
  target-torque: 目標扭矩
en:
  demo: Test Mode
  demo-hint: This feature is only for testing the motor in different modes. When enabled, the knob will pause reporting keys to prevent accidental input.
  mode-inertia: Inertia
  mode-encoder: Encoder
  mode-spring: Joystick
  mode-damped: Damped
  mode-spin: Spin
  mode-ratchet: Ratchet
  mode-switch: Switch
  control-mode: Control Mode
  control-mode-torque: Torque
  control-mode-angle: Angle
  control-mode-velocity: Velocity
  current-angle: Current Angle
  current-velocity: Current Velocity
  target-angle: Target Angle
  target-velocity: Target Velocity
  target-voltage: Target Voltage
  target-torque: Target Torque
</i18n>
