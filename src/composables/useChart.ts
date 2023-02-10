import { ref, watch, type Ref } from 'vue';
import { Chart, type Types } from '@antv/g2';

interface ChartRefs {
  el: Ref<HTMLDivElement | undefined>;
  chart: Ref<Chart | undefined>;
}

type ChartProps = Omit<Types.ChartCfg, 'container'>;

export default function useChart(props: ChartProps, setup?: (chart: Chart) => void): ChartRefs {
  const el = ref<HTMLDivElement>();
  const chart = ref<Chart>();

  watch(el, (el, _oldEl, onCleanup) => {
    if (el && !chart.value) {
      chart.value = new Chart({
        container: el,
        ...props,
      });
      setup?.(chart.value);
      chart.value.render();
    }

    onCleanup(() => {
      chart.value?.destroy();
    });
  });

  return { el, chart };
}
