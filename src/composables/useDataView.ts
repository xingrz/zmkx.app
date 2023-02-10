import { watch, type Ref } from 'vue';
import type { Chart, Types } from '@antv/g2';
import type DataSet from '@antv/data-set';
import type { View } from '@antv/data-set/lib/view';

export default function useDataView<T extends Types.Data>(ds: DataSet, data: Ref<T>, chart: Chart): View {
  const view = ds.createView();

  watch(data, (data) => {
    view.source(data);
    chart.changeData(view.rows);
  });

  return view;
}
