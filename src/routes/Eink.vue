<template>
  <div :class="$style.selector" v-if="!selected" :style="{ marginTop: '32px' }">
    <a-upload-dragger accept="image/*" :custom-request="handleFile" :show-upload-list="false">
      <p class="ant-upload-drag-icon">
        <project-outlined />
      </p>
      <p class="ant-upload-text">{{ t('drag-hint') }}</p>
    </a-upload-dragger>
  </div>
  <a-row type="flex" :gutter="[32, 32]" v-else :style="{ marginTop: '32px' }">
    <a-col flex="0">
      <img :src="preview" :class="$style.preview" />
    </a-col>
    <a-col flex="auto" :xs="24" :lg="8">
      <p>{{ t('adjust-hint') }}</p>
      <p>
      <h4>{{ t('threshold') }}</h4>
      <a-slider v-model:value="threshold" :disabled="downloading" />
      </p>
      <p>
        <a-checkbox v-model:checked="inverted" :disabled="downloading">{{ t('inverted') }}</a-checkbox>
      </p>
      <p>
        <a-checkbox v-model:checked="dither" :disabled="downloading">{{ t('dither') }}</a-checkbox>
      </p>
      <p :style="{ marginTop: '32px' }">
        <a-space>
          <a-button type="primary" @click="download" :loading="downloading">{{ t('download') }}</a-button>
          <a-button type="text" @click="clear" :disabled="downloading">{{ t('clear') }}</a-button>
        </a-space>
      </p>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProjectOutlined } from '@ant-design/icons-vue';

import { useEinkStore } from '@/stores/eink';
import { binarize, centerOf, scaleInside, toBits } from '@/utils/graphic';

const { t } = useI18n();

const einkStore = useEinkStore();

const selected = ref<File>();

const device = document.createElement('canvas');
device.width = 128;
device.height = 296;

const threshold = ref(50);
const inverted = ref(false);
const dither = ref(true);

function handleFile({ file }: { file: File }): void {
  selected.value = file;
}

function clear(): void {
  threshold.value = 50;
  inverted.value = false;
  selected.value = undefined;
}

const target = ref<ImageBitmap>();
watch([selected, threshold, inverted, dither], async ([file, threshold, inverted, dither]) => {
  const source = file && await createImageBitmap(file);
  target.value = source && await binarize(source, scaleInside(device, source), threshold, inverted, dither);
});

const preview = ref<string>();
watch(target, (target) => {
  const ctx = device.getContext('2d')!;
  ctx.clearRect(0, 0, device.width, device.height);

  if (target) {
    const rect = scaleInside(device, target);

    const canvasCenter = centerOf(device);
    const targetCenter = centerOf(rect);

    ctx.clearRect(0, 0, device.width, device.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, device.width, device.height);

    ctx.save();
    ctx.translate(canvasCenter.x, canvasCenter.y);
    ctx.drawImage(target, -targetCenter.x, -targetCenter.y, rect.width, rect.height);
    ctx.restore();
  }

  preview.value = device.toDataURL();
});

const imageId = ref<number>();
const downloading = computed(() => typeof imageId.value != 'undefined' && imageId.value != einkStore.einkImage?.id);

async function download(): Promise<void> {
  imageId.value = Math.round(Math.random() * 1000);
  const ctx = device.getContext('2d')!;
  const bits = toBits(ctx.getImageData(0, 0, device.width, device.height));
  await einkStore.setEinkImage(imageId.value, bits);
}
</script>

<style lang="scss" module>
.selector {
  height: 400px;

  :global(.ant-upload-btn) {
    display: flex !important;
    flex-direction: column;
    justify-content: center;
  }

  :global(.ant-upload-text) {
    padding: 24px;
  }
}

.preview {
  height: 80vh;
  border: 2px solid black;
}
</style>

<i18n lang="yaml">
zh-Hans:
  drag-hint: 点击选择图片，或将图片直接拖放到此处
  adjust-hint: 你可以调整阈值，以使图片达到最适合墨水屏的效果。
  threshold: 阈值
  inverted: 反色
  dither: 抖动
  download: 更新到设备
  clear: 重新选择
zh-Hant:
  drag-hint: 點擊選擇圖片，或將圖片直接拖放到此處
  adjust-hint: 你可以調整閾值，以使圖片達到最適合墨水螢幕的效果。
  threshold: 閾值
  inverted: 反相
  dither: 抖動
  download: 更新至裝置
  clear: 重新選擇
en:
  drag-hint: Click to select an image, or drag and drop an image here
  adjust-hint: You can adjust the threshold to achieve the best result for the e-ink display.
  threshold: Threshold
  inverted: Inverted
  dither: Dither
  download: Update to Device
  clear: Clear Selection
</i18n>
