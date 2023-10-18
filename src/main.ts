import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import App from '@/App.vue';

const app = createApp(App);
app.use(Antd);
app.use(createI18n({
  fallbackLocale: {
    'zh-CN': ['zh-Hans'],
    'zh-TW': ['zh-Hant'],
    'zh-HK': ['zh-Hant'],
    'zh-Hant': ['zh-Hans'],
    'default': ['zh-Hans'],
  },
}));
app.use(createPinia());
app.use(createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'about',
      component: () => import('@/routes/About.vue'),
    },
    {
      path: '/rgb',
      name: 'rgb',
      component: () => import('@/routes/Rgb.vue'),
    },
    {
      path: '/eink',
      name: 'eink',
      component: () => import('@/routes/Eink.vue'),
    },
    {
      path: '/motor',
      name: 'motor',
      component: () => import('@/routes/Motor.vue'),
    },
  ],
}));
app.mount('#app');
