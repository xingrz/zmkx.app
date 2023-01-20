<template>
  <a-row :gutter="[16, 16]">
    <a-col :span="24">
      <a-space>
        <a-switch :disabled="!comm.rgbState" :checked="rgbOn" @update:checked="toggleRgb" />
        按键灯效
      </a-space>
    </a-col>

    <a-col :span="24">
      <a-space>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_HUD)">
          <template #icon><minus-outlined /></template>
        </a-button>
        <div :class="$style.label">色调</div>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_HUI)">
          <template #icon><plus-outlined /></template>
        </a-button>
      </a-space>
    </a-col>

    <a-col :span="24">
      <a-space>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SAD)">
          <template #icon><minus-outlined /></template>
        </a-button>
        <div :class="$style.label">饱和度</div>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SAI)">
          <template #icon><plus-outlined /></template>
        </a-button>
      </a-space>
    </a-col>

    <a-col :span="24">
      <a-space :style="{ width: '100%' }">
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_BRD)">
          <template #icon><minus-outlined /></template>
        </a-button>
        <div :class="$style.label">亮度</div>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_BRI)">
          <template #icon><plus-outlined /></template>
        </a-button>
      </a-space>
    </a-col>

    <a-col :span="24">
      <a-space>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SPD)">
          <template #icon><minus-outlined /></template>
        </a-button>
        <div :class="$style.label">动画速度</div>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SPI)">
          <template #icon><plus-outlined /></template>
        </a-button>
      </a-space>
    </a-col>

    <a-col :span="24">
      <a-space :style="{ width: '100%' }">
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_EFR)">
          <template #icon><arrow-left-outlined /></template>
        </a-button>
        <div :class="$style.label">动画效果</div>
        <a-button type="circle" :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_EFF)">
          <template #icon><arrow-right-outlined /></template>
        </a-button>
      </a-space>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import {
  MinusOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons-vue';

import { onDeviceConnected, useUsbComm } from '@/stores/usb';
import { RgbControl } from '@/proto/comm.proto';

const { Command } = RgbControl;

const comm = useUsbComm();
const { sendRgbControl } = comm;
const rgbOn = computed(() => comm.rgbState?.on);

onDeviceConnected(comm, () => comm.getRgbState());

function toggleRgb(on: boolean): void {
  if (on) {
    sendRgbControl(Command.RGB_ON);
  } else {
    sendRgbControl(Command.RGB_OFF);
  }
}
</script>

<style lang="scss" module>
.label {
  width: 5em;
  text-align: center;
}
</style>
