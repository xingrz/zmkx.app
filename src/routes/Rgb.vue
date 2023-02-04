<template>
  <a-row :gutter="[16, 16]">
    <a-col :xs="24" :lg="16" :xl="12">
      <a-form :label-col="{ style: { width: '100px' } }" :style="{ marginTop: '32px' }">
        <a-form-item label="开关">
          <a-switch :disabled="!comm.rgbState" :checked="rgbOn" @update:checked="toggleRgb" />
        </a-form-item>

        <a-form-item label="色调">
          <template v-if="fullControl">
            <a-slider :disabled="!rgbOn || !isHueAdjustable" :value="color?.h" :min="0" :max="359"
              :marks="{ 0: '0°', 359: '359°' }" @update:value="(h: number) => handleColorChanged({ ...color!, h })" />
          </template>
          <template v-else>
            <a-input-group compact>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_HUD)">
                <template #icon><minus-outlined /></template>
              </a-button>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_HUI)">
                <template #icon><plus-outlined /></template>
              </a-button>
            </a-input-group>
          </template>
        </a-form-item>

        <a-form-item label="饱和度">
          <template v-if="fullControl">
            <a-slider :disabled="!rgbOn" :value="color?.s" :min="0" :max="100" :marks="{ 0: '0%', 100: '100%' }"
              @update:value="(s: number) => handleColorChanged({ ...color!, s })" />
          </template>
          <template v-else>
            <a-input-group compact>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SAD)">
                <template #icon><minus-outlined /></template>
              </a-button>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SAI)">
                <template #icon><plus-outlined /></template>
              </a-button>
            </a-input-group>
          </template>
        </a-form-item>

        <a-form-item label="亮度">
          <template v-if="fullControl">
            <a-slider :disabled="!rgbOn || !isBrtAdjustable" :value="color?.b" :min="0" :max="100"
              :marks="{ 0: '0%', 100: '100%' }" @update:value="(b: number) => handleColorChanged({ ...color!, b })" />
          </template>
          <template v-else>
            <a-input-group compact>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_BRD)">
                <template #icon><minus-outlined /></template>
              </a-button>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_BRI)">
                <template #icon><plus-outlined /></template>
              </a-button>
            </a-input-group>
          </template>
        </a-form-item>

        <a-form-item label="动画效果">
          <template v-if="fullControl">
            <a-radio-group button-style="solid" :disabled="!rgbOn" :value="state?.effect"
              @update:value="(effect: RgbState.Effect) => handleChanged({ ...state!, effect })">
              <a-radio-button :value="Effect.SOLID">静态</a-radio-button>
              <a-radio-button :value="Effect.BREATHE">呼吸</a-radio-button>
              <a-radio-button :value="Effect.SPECTRUM">光谱</a-radio-button>
              <a-radio-button :value="Effect.SWIRL">漩涡</a-radio-button>
            </a-radio-group>
          </template>
          <template v-else>
            <a-input-group compact>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_EFR)">
                <template #icon><arrow-left-outlined /></template>
              </a-button>
              <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_EFF)">
                <template #icon><arrow-right-outlined /></template>
              </a-button>
            </a-input-group>
          </template>
        </a-form-item>

        <a-form-item label="动画速度">
          <a-input-group compact>
            <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SPD)">
              <template #icon><minus-outlined /></template>
            </a-button>
            <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SPI)">
              <template #icon><plus-outlined /></template>
            </a-button>
          </a-input-group>
        </a-form-item>
      </a-form>
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
import { throttle } from 'throttle-debounce';

import { onDeviceConnected, useUsbComm } from '@/stores/usb';
import { RgbControl, RgbState } from '@/proto/comm.proto';

const { Command } = RgbControl;
const { Effect } = RgbState;

const comm = useUsbComm();
const { sendRgbControl } = comm;
const rgbOn = computed(() => !!comm.rgbState?.on);
const state = computed(() => comm.rgbState);
const color = computed(() => comm.rgbState?.color);
const fullControl = computed(() => !!comm.version?.features?.rgbFullControl);

onDeviceConnected(comm, () => comm.getRgbState());

function toggleRgb(on: boolean): void {
  if (on) {
    sendRgbControl(Command.RGB_ON);
  } else {
    sendRgbControl(Command.RGB_OFF);
  }
}

const handleColorChanged = throttle(100, (color: RgbState.IHSB) => {
  comm.setRgbState(RgbState.create({ ...state.value, color }));
});

function handleChanged(state: RgbState) {
  comm.setRgbState(RgbState.create(state));
}

const isHueAdjustable = computed(() => state.value?.effect != Effect.SPECTRUM && state.value?.effect != Effect.SWIRL);
const isBrtAdjustable = computed(() => state.value?.effect != Effect.BREATHE);
</script>

<style lang="scss" module>
.label {
  width: 5em;
  text-align: center;
}
</style>
