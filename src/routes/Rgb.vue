<template>
  <config-panel>
    <config-unit :title="t('underglow')">
      <a-form-item :label="t('toggle')">
        <a-switch :disabled="!rgbStore.state" :checked="rgbOn" @update:checked="toggleRgb" />
      </a-form-item>

      <a-form-item :label="t('hue')">
        <template v-if="hasFullControl">
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

      <a-form-item :label="t('sat')">
        <template v-if="hasFullControl">
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

      <a-form-item :label="t('bri')">
        <template v-if="hasFullControl">
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

      <a-form-item :label="t('effect')">
        <template v-if="hasFullControl">
          <a-radio-group button-style="solid" :disabled="!rgbOn" :value="state?.effect"
            @update:value="(effect: UsbComm.RgbState.Effect) => handleChanged({ ...state!, effect })">
            <a-radio-button :value="Effect.SOLID">{{ t('effect-solid') }}</a-radio-button>
            <a-radio-button :value="Effect.BREATHE">{{ t('effect-breathe') }}</a-radio-button>
            <a-radio-button :value="Effect.SPECTRUM">{{ t('effect-spectrum') }}</a-radio-button>
            <a-radio-button :value="Effect.SWIRL">{{ t('effect-swirl') }}</a-radio-button>
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

      <a-form-item :label="t('speed')">
        <a-input-group compact>
          <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SPD)">
            <template #icon><minus-outlined /></template>
          </a-button>
          <a-button :disabled="!rgbOn" @click="() => sendRgbControl(Command.RGB_SPI)">
            <template #icon><plus-outlined /></template>
          </a-button>
        </a-input-group>
      </a-form-item>
    </config-unit>

    <config-unit :title="t('indicator')" v-if="hasIndicator">
      <a-form-item :label="t('enable')">
        <a-switch :disabled="!indicator" :checked="indicator?.enable"
          @update:checked="(enable: boolean) => rgbStore.setRgbIndicatorThottled({ enable })" />
      </a-form-item>

      <a-form-item :label="t('bri-active')" v-if="indicator?.enable">
        <a-slider :value="indicator?.brightnessActive" :min="0" :max="255" :marks="{ 0: '0', 255: '255' }"
          @update:value="(bri: number) => rgbStore.setRgbIndicatorThottled({ brightnessActive: bri })" />
      </a-form-item>

      <a-form-item :label="t('bri-inactive')" v-if="indicator?.enable">
        <a-slider :value="indicator?.brightnessInactive" :min="0" :max="255" :marks="{ 0: '0', 255: '255' }"
          @update:value="(bri: number) => rgbStore.setRgbIndicatorThottled({ brightnessInactive: bri })" />
      </a-form-item>
    </config-unit>
  </config-panel>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  MinusOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons-vue';

import ConfigPanel from '@/components/ConfigPanel.vue';
import ConfigUnit from '@/components/ConfigUnit.vue';

import { onDeviceConnected, useUsbComm } from '@/stores/usb';
import { useVersionStore } from '@/stores/version';
import { useRgbStore } from '@/stores/rgb';
import { UsbComm } from '@/proto/comm.proto';
import { storeToRefs } from 'pinia';

const { t } = useI18n();

const { Command } = UsbComm.RgbControl;
const { Effect } = UsbComm.RgbState;

const comm = useUsbComm();
const versionStore = useVersionStore();
const rgbStore = useRgbStore();
const { sendRgbControl } = rgbStore;
const rgbOn = computed(() => !!rgbStore.state?.on);
const { state, indicator } = storeToRefs(rgbStore);
const color = computed(() => rgbStore.state?.color);

const hasFullControl = versionStore.useFeature('rgbFullControl');
const hasIndicator = versionStore.useFeature('rgbIndicator');

onDeviceConnected(comm, () => rgbStore.getRgbState());
onDeviceConnected(comm, () => rgbStore.getRgbIndicator());

function toggleRgb(on: boolean): void {
  if (on) {
    sendRgbControl(Command.RGB_ON);
  } else {
    sendRgbControl(Command.RGB_OFF);
  }
}

function handleColorChanged(color: UsbComm.RgbState.IHSB) {
  rgbStore.setRgbStateThottled({ ...state.value!, color });
}

function handleChanged(state: UsbComm.IRgbState) {
  rgbStore.setRgbStateThottled(state);
}

const isHueAdjustable = computed(() => state.value?.effect != Effect.SPECTRUM && state.value?.effect != Effect.SWIRL);
const isBrtAdjustable = computed(() => state.value?.effect != Effect.BREATHE);
</script>

<i18n lang="yaml">
zh-Hans:
  underglow: 轴灯
  toggle: 开关
  hue: 色调
  sat: 饱和度
  bri: 亮度
  effect: 动画效果
  effect-solid: 静态
  effect-breathe: 呼吸
  effect-spectrum: 光谱
  effect-swirl: 漩涡
  speed: 速度
  indicator: 指示灯
  enable: 启用
  bri-active: 活跃亮度
  bri-inactive: 非活跃亮度
zh-Hant:
  underglow: 軸燈
  toggle: 開關
  hue: 色調
  sat: 飽和度
  bri: 亮度
  effect: 動畫效果
  effect-solid: 靜態
  effect-breathe: 呼吸
  effect-spectrum: 光譜
  effect-swirl: 漩渦
  speed: 速度
  indicator: 指示燈
  enable: 啟用
  bri-active: 活躍亮度
  bri-inactive: 非活躍亮度
en:
  underglow: Underglow
  toggle: Toggle
  hue: Hue
  sat: Sat
  bri: Bri
  effect: Effect
  effect-solid: Solid
  effect-breathe: Breathe
  effect-spectrum: Spectrum
  effect-swirl: Swirl
  speed: Speed
  indicator: Indicator
  enable: Enable
  bri-active: Active
  bri-inactive: Inactive
</i18n>
