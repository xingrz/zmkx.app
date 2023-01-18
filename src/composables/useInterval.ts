import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

type ITimer = ReturnType<typeof setInterval>;

export default function useInterval(callback: () => void, ms: number): Ref<ITimer | undefined> {
  const timer = ref<ITimer>();

  onMounted(() => {
    timer.value = setInterval(callback, ms);
  });

  onBeforeUnmount(() => {
    clearInterval(timer.value);
    timer.value = undefined;
  });

  return timer;
}
