import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

import App from '@/App.vue';

const app = createApp(App);
app.use(Antd);
app.use(createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'about',
      component: () => import('@/routes/About.vue'),
    },
  ],
}));
app.mount('#app');
