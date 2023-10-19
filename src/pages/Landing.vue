<template>
  <div :class="$style.landing">
    <div :class="$style.logo">ZMKX</div>

    <a-alert v-if="!supportWebHid" message="浏览器不受支持" type="error" :class="$style.unsupported">
      <template #description>
        <p>ZMKX 需要浏览器支持 WebHID API 支持才能正常工作。</p>
        <p>建议使用最新版本的 <a :href="URL_CHROME" target="_blank">Google Chrome</a> 或 <a :href="URL_EDGE"
            target="_blank">Microsoft
            Edge</a>。</p>
      </template>
    </a-alert>
    <div v-else :class="$style.connect">
      <a-button shape="round" size="large" type="primary" :loading="connecting" @click="connect">
        连接设备
      </a-button>
    </div>

    <footer :class="$style.footer">
      Copyright © XiNGRZ 2022-2023
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';

import { useUsbComm } from '@/stores/usb';

const supportWebHid = !!navigator.hid;
const URL_CHROME = 'https://www.google.com/chrome';
const URL_EDGE = 'https://www.microsoft.com/edge';

const comm = useUsbComm();

const connecting = ref(false);
async function connect() {
  try {
    connecting.value = true;
    await comm.open();
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      if (e.message.includes('No device selected')) {
        return;
      }
      message.error('设备连接失败');
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

.footer {
  position: absolute;
  bottom: 16px;
  font-size: 80%;
  color: #999;
}
</style>
