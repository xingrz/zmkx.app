<template>
  <div :class="$style.selector" v-if="!selected">
    <a-upload-dragger accept="image/*" :custom-request="handleFile" :show-upload-list="false">
      <p class="ant-upload-drag-icon">
        <project-outlined />
      </p>
      <p class="ant-upload-text">点击选择图片，或将图片直接拖放到此处</p>
    </a-upload-dragger>
  </div>
  <a-space :size="32" direction="horizontal" align="start" v-else>
    <img :src="preview" :class="$style.preview" />
    <div>
      <p>
        你可以调整阈值，以使图片达到最适合墨水屏的效果。
      </p>
      <p>
      <h4>阈值</h4>
      <a-slider v-model:value="threshold" :disabled="downloading" />
      </p>
      <p>
        <a-checkbox v-model:checked="inverted" :disabled="downloading">反色</a-checkbox>
      </p>
      <p :style="{ marginTop: '32px' }">
        <a-space>
          <a-button type="primary" @click="download" :loading="downloading">更新到设备</a-button>
          <a-button type="text" @click="clear" :disabled="downloading">重新选择</a-button>
        </a-space>
      </p>
    </div>
  </a-space>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { ProjectOutlined } from '@ant-design/icons-vue';

import { useUsbComm } from '@/stores/usb';
import { binarize, centerOf, scaleInside, toBits } from '@/utils/graphic';

const comm = useUsbComm();

const selected = ref<File>();

const device = document.createElement('canvas');
device.width = 128;
device.height = 296;

const threshold = ref(50);
const inverted = ref(false);

function handleFile({ file }: { file: File }): void {
  selected.value = file;
}

function clear(): void {
  threshold.value = 50;
  inverted.value = false;
  selected.value = undefined;
}

const target = ref<ImageBitmap>();
watch([selected, threshold, inverted], async ([file, threshold, inverted]) => {
  const source = file && await createImageBitmap(file);
  target.value = source && await binarize(source, threshold, inverted);
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
const downloading = computed(() => typeof imageId.value != 'undefined' && imageId.value != comm.einkImage?.id);

async function download(): Promise<void> {
  imageId.value = Math.round(Math.random() * 1000);
  const ctx = device.getContext('2d')!;
  const bits = toBits(ctx.getImageData(0, 0, device.width, device.height));
  await comm.setEinkImage(imageId.value, bits);
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
}

.preview {
  height: 80vh;
  border: 2px solid black;
}
</style>
