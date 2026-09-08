import { createRouter, createWebHistory } from 'vue-router';
import App from '../App.vue';

const routes = [
  {
    path: '/',
    component: App,
    name: 'Workbench'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
