import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export default function useMatchMedia(query: string): Ref<boolean> {
  const matches = ref(false);

  if (typeof window.matchMedia != 'undefined') {
    const mediaMatch = window.matchMedia(query);
    matches.value = mediaMatch.matches;

    const onChange = (event: MediaQueryListEvent) => {
      matches.value = event.matches;
    };

    onMounted(() => {
      mediaMatch.addEventListener('change', onChange);
    });

    onBeforeUnmount(() => {
      mediaMatch.removeEventListener('change', onChange);
    });
  }

  return matches;
}
