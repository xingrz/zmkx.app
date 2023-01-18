import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

type ITimer = ReturnType<typeof setTimeout>;

export default function useIntervalAsync(callback: () => Promise<void>, ms: number): Ref<ITimer | undefined> {
  const timer = ref<ITimer>();

  async function handler() {
    await callback();
    timer.value = setTimeout(handler, ms);
  }

  onMounted(() => {
    timer.value = setTimeout(handler, ms);
  });

  onBeforeUnmount(() => {
    clearInterval(timer.value);
    timer.value = undefined;
  });

  return timer;
}
