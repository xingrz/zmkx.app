import { computed } from 'vue';
import { defineStore } from 'pinia';
import useMatchMedia from '@/composables/useMatchMedia';
import useLocalStorage from '@/composables/useLocalStorage';

export const useThemeStore = defineStore('theme', () => {
  const globalPreferDark = useMatchMedia('(prefers-color-scheme: dark)');
  const localPreferDark = useLocalStorage<boolean | undefined>('darkMode', undefined);

  function toggleDarkMode(): void {
    const enabled = !darkMode.value;
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
    toggleDarkMode,
  };
});
