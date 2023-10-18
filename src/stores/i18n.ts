import { watch } from 'vue';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';
import useLocalStorage from '@/composables/useLocalStorage';

export const useI18nStore = defineStore('i18n', () => {
  const { locale, fallbackLocale } = useI18n({ useScope: 'global' });

  const supportedLocales: Record<string, string> = {
    'zh-Hans': '简体中文',
    'zh-Hant': '繁體中文',
    'en': 'English',
  };

  const preferLocale = useLocalStorage<string>('locale', getDefaultLocale());

  function getFallbackLocales(): Record<string, string[]> {
    if (Array.isArray(fallbackLocale.value)) {
      return { 'default': fallbackLocale.value };
    } else if (typeof fallbackLocale.value == 'object') {
      return fallbackLocale.value;
    } else {
      return {};
    }
  }

  function getDefaultLocale(): string {
    let locale = navigator.language || 'zh-Hans';

    while (!supportedLocales[locale]) {
      const fallbackLocales = getFallbackLocales();
      if (fallbackLocales[locale]) {
        locale = fallbackLocales[locale][0];
      } else {
        locale = fallbackLocales['default'][0];
      }
    }

    return locale;
  }

  watch(preferLocale, (value) => {
    locale.value = value;
  }, { immediate: true });

  return {
    supportedLocales,
    preferLocale,
  };
});
