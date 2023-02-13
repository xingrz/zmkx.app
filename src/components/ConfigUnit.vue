<template>
  <a-col :xs="24" :md="12">
    <a-form :label-col="labelCol" :wrapper-col="wrapperCol">
      <h4 v-if="props.title" :class="$style.title">{{ props.title }}</h4>
      <slot />
    </a-form>
  </a-col>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

const props = defineProps<{
  title?: string;
}>();

const labelCol = {
  style: {
    width: '80px',
  },
};

const wrapperCol = {
  span: 24,
  style: {
    maxWidth: '400px',
  },
};
</script>

<style lang="scss" module>
.title {
  font-size: 18px;
  margin-bottom: 32px;
}
</style>
