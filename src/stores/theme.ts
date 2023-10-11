import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import useMatchMedia from '@/composables/useMatchMedia';

export const useThemeStore = defineStore('theme', () => {
  const globalPreferDark = useMatchMedia('(prefers-color-scheme: dark)');

  const localPreferDark = ref(getLocalPreferDark());

  function getLocalPreferDark(): boolean | undefined {
    const value = localStorage.getItem('darkMode');
    if (value == '1') {
      return true;
    } else if (value == '0') {
      return false;
    } else {
      return undefined;
    }
  }

  watch(localPreferDark, (value) => {
    if (typeof value != 'undefined') {
      localStorage.setItem('darkMode', value ? '1' : '0');
    } else {
      localStorage.removeItem('darkMode');
    }
  });

  function setDarkMode(enabled: boolean): void {
    if (globalPreferDark.value == enabled) {
      localPreferDark.value = undefined;
    } else {
      localPreferDark.value = enabled;
    }
  }

  const darkMode = computed<boolean>(() => {
    if (typeof localPreferDark.value != 'undefined') {
      return localPreferDark.value;
    } else {
      return globalPreferDark.value;
    }
  });

  return {
    darkMode,
    setDarkMode,
  };
});
