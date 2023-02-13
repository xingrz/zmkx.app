<template>
  <a-row :gutter="[64, 16]" :class="$style.panel">
    <slot />
  </a-row>
</template>

<style lang="scss" module>
.panel {
  max-width: 1080px;
}
</style>
