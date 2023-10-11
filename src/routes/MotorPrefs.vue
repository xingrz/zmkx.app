<template>
  <a-row :gutter="[16, 16]">
    <a-col :xs="24" :lg="16" :xl="12">
      <a-alert type="warning" v-if="knobStore.knobConfig?.demo">
        <template #message>
          请先关闭测试模式以进行设置。
        </template>
      </a-alert>

      <template v-else>
        <a-segmented :options="layers" v-model:value="selected" size="large" block />
        <a-form v-if="pref" :label-col="{ style: { width: '100px' } }" :style="{ marginTop: '32px' }">
          <a-form-item label="自定义">
            <a-switch :checked="pref.active" @update:checked="(active: boolean) => handleChanged({ ...pref, active })" />
          </a-form-item>
          <a-form-item label="模式">
            <a-radio-group :disabled="!pref.active" :value="pref.mode" button-style="solid"
              @update:value="(mode: UsbComm.KnobConfig.Mode) => handleChanged({ layerId: pref.layerId, active: true, mode })">
              <a-radio-button :value="KnobConfig.Mode.DISABLE">平滑</a-radio-button>
              <a-radio-button :value="KnobConfig.Mode.INERTIA">惯性</a-radio-button>
              <a-radio-button :value="KnobConfig.Mode.ENCODER">齿轮</a-radio-button>
              <a-radio-button :value="KnobConfig.Mode.SPRING" v-if="hasKnobSpringReport">摇杆</a-radio-button>
              <a-radio-button :value="KnobConfig.Mode.SWITCH" v-if="hasKnobProfileSwitch">开关</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="步数" v-if="showPpr(pref.mode!)">
            <a-slider :disabled="!pref.active" :value="pref.ppr" :min="8" :max="96"
              :marks="{ 8: '8', 24: '24', 96: '96' }" @update:value="(ppr: number) => handleChanged({ ...pref, ppr })" />
          </a-form-item>
          <a-form-item label="力度" v-if="showTorqueLimit(pref.mode!)">
            <a-slider :disabled="!pref.active" :value="pref.torqueLimit" :min="0" :max="3" :step="0.1"
              :marks="{ 0: '0', 3: '3' }"
              @update:value="(torqueLimit: number) => handleChanged({ ...pref, torqueLimit })" />
          </a-form-item>
        </a-form>
      </template>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVersionStore } from '@/stores/version';
import { onDeviceConnected, useUsbComm } from '@/stores/usb';
import { useKnobStore } from '@/stores/knob';
import { UsbComm } from '@/proto/comm.proto';

const { KnobConfig } = UsbComm;

const comm = useUsbComm();
const knobStore = useKnobStore();

const versionStore = useVersionStore();
const hasKnobSpringReport = versionStore.useFeature('knobSpringReport');
const hasKnobProfileSwitch = versionStore.useFeature('knobProfileSwitch');

onDeviceConnected(comm, () => knobStore.getKnobConfig());

const layers = computed(() => (knobStore.knobConfig?.prefs || [])
  .map((pref) => ({ label: pref.layerName, value: pref.layerId })));

const selected = ref(0);

const pref = computed(() => (knobStore.knobConfig?.prefs || [])[selected.value]);

function handleChanged(pref: UsbComm.KnobConfig.IPref) {
  knobStore.updateKnobPrefThottled(pref);
}

function showPpr(mode: UsbComm.KnobConfig.Mode) {
  return mode != UsbComm.KnobConfig.Mode.SPRING
    && mode != UsbComm.KnobConfig.Mode.SWITCH;
}

function showTorqueLimit(mode: UsbComm.KnobConfig.Mode) {
  return mode != UsbComm.KnobConfig.Mode.DISABLE;
}
</script>
