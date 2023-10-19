import { ref, watch, type Ref, type UnwrapRef } from 'vue';

export default function useLocalStorage<T>(key: string, defaultValue: T): Ref<UnwrapRef<T>> {
  const value = ref<T>(getLocalValue() || defaultValue);

  function getLocalValue(): T | undefined {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
      }
    }
  }

  watch(value, (value) => {
    if (value == defaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });

  return value;
}
