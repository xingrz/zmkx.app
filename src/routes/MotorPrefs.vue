<template>
  <a-row :gutter="[16, 16]">
    <a-col :xs="24" :lg="16" :xl="12">
      <a-collapse :active-key="expended" ghost>
        <a-collapse-panel v-for="pref in knobStore.knobConfig?.prefs || []" :key="pref.layerId"
          :header="pref.layerName">
          <template #extra>
            <a-space>
              自定义
              <a-switch :checked="pref.active"
                @update:checked="(active: boolean) => handleChanged({ ...pref, active })" />
            </a-space>
          </template>
          <a-form :label-col="{ style: { width: '100px' } }">
            <a-form-item label="模式">
              <a-radio-group :value="pref.mode" button-style="solid"
                @update:value="(mode: UsbComm.KnobConfig.Mode) => handleChanged({ ...pref, mode })">
                <a-radio-button :value="KnobConfig.Mode.DISABLE">平滑</a-radio-button>
                <a-radio-button :value="KnobConfig.Mode.INERTIA">惯性</a-radio-button>
                <a-radio-button :value="KnobConfig.Mode.ENCODER">齿轮</a-radio-button>
              </a-radio-group>
            </a-form-item>
            <a-form-item label="步数">
              <a-slider :value="pref.ppr" :min="8" :max="96" :marks="{ 8: '8', 24: '24', 96: '96' }"
                @update:value="(ppr: number) => handleChanged({ ...pref, ppr })" />
            </a-form-item>
            <a-form-item label="力度">
              <a-slider :value="pref.torqueLimit" :min="0" :max="3" :step="0.1" :marks="{ 0: '0', 3: '3' }"
                :disabled="pref.mode == UsbComm.KnobConfig.Mode.DISABLE"
                @update:value="(torqueLimit: number) => handleChanged({ ...pref, torqueLimit })" />
            </a-form-item>
          </a-form>
        </a-collapse-panel>
      </a-collapse>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { onDeviceConnected, useUsbComm } from '@/stores/usb';
import { useKnobStore } from '@/stores/knob';
import { UsbComm } from '@/proto/comm.proto';

const { KnobConfig } = UsbComm;

const comm = useUsbComm();
const knobStore = useKnobStore();

onDeviceConnected(comm, () => knobStore.getKnobConfig());

const expended = computed(() => (knobStore.knobConfig?.prefs || [])
  .filter((pref) => pref.active).map((pref) => pref.layerId));

function handleChanged(pref: UsbComm.KnobConfig.IPref) {
  knobStore.updateKnobPrefThottled(pref);
};
</script>
