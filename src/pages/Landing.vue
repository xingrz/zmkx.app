<template>
  <div :class="$style.landing">
    <div :class="$style.logo">ZMKX</div>

    <a-alert v-if="!supportWebHid" :message="t('unsupported')" type="error" :class="$style.unsupported">
      <template #description>
        <div v-html="t('unsupported-hint')" />
      </template>
    </a-alert>
    <a-space v-else-if="comm.devices.length > 0" direction="vertical" :class="$style.connect">
      <a-button v-for="device of comm.devices" shape="round" size="large" type="text" block :class="$style.device"
        @click="() => comm.pick(device)">
        {{ device.productName }}
        <arrow-right-outlined />
      </a-button>
      <a-divider key="divider" />
      <a-button key="add-more" shape="round" :loading="connecting" :class="$style.device" @click="connect">
        {{ t('add-more-device') }}
      </a-button>
    </a-space>
    <template v-else>
      <a-button shape="round" size="large" type="primary" :loading="connecting" :class="$style.device" @click="connect">
        {{ t('add-device') }}
      </a-button>
    </template>

    <footer :class="$style.footer">
      Copyright © XiNGRZ 2022-2023
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { message } from 'ant-design-vue';
import {
  ArrowRightOutlined,
} from '@ant-design/icons-vue';

import { useUsbComm } from '@/stores/usb';

const { t } = useI18n();

const supportWebHid = !!navigator.hid;

const comm = useUsbComm();

const connecting = ref(false);
async function connect() {
  try {
    connecting.value = true;
    await comm.request();
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      if (e.message.includes('No device selected')) {
        return;
      }
      message.error(t('connect-failed'));
    }
  } finally {
    connecting.value = false;
  }
}
</script>

<style lang="scss" module>
.landing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.logo {
  height: 120px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 120px;
  line-height: 120px;
  text-align: center;
  margin-top: 16px;
}

.unsupported {
  margin-top: 20px;
}

.connect {
  margin-top: 50px;
  width: 400px;
  text-align: center;
}

.device {
  text-align: left;
}

.footer {
  position: absolute;
  bottom: 16px;
  font-size: 80%;
  color: #999;
}
</style>

<i18n lang="yaml">
zh-Hans:
  add-device: 添加设备
  add-more-device: 添加更多设备
  connect-failed: 设备连接失败
  unsupported: 浏览器不受支持
  unsupported-hint: |
    <p>ZMKX 需要浏览器支持 WebHID API 支持才能正常工作。</p>
    <p>建议使用最新版本的 <a href="https://www.google.com/chrome" target="_blank">Google Chrome</a> 或 <a href="https://www.microsoft.com/edge" target="_blank">Microsoft Edge</a>。</p>
zh-Hant:
  add-device: 新增裝置
  add-more-device: 新增更多裝置
  connect-failed: 裝置連線失敗
  unsupported: 瀏覽器不支援
  unsupported-hint: |
    <p>ZMKX 需要瀏覽器支援 WebHID API 才能正常運作。</p>
    <p>建議使用最新版本的 <a href="https://www.google.com/chrome" target="_blank">Google Chrome</a> 或 <a href="https://www.microsoft.com/edge" target="_blank">Microsoft Edge</a>。</p>
en:
  add-device: Add Device
  add-more-device: Add More Devices
  connect-failed: Device Connection Failed
  unsupported: Browser Not Supported
  unsupported-hint: |
    <p>ZMKX requires browser support for the WebHID API to function correctly.</p>
    <p>We recommend using the latest version of <a href="https://www.google.com/chrome">Google Chrome</a> or <a href="https://www.microsoft.com/edge">Microsoft Edge</a>.</p>
</i18n>
