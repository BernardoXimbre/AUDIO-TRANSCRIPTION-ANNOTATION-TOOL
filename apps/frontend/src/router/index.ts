import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Upload from '../components/Upload.vue';
import Queue from '../views/Queue.vue';

const routes = [
  {
    path: '/',
    component: Home,
    name: 'Home'
  },
  {
    path: '/upload',
    component: Upload,
    name: 'Upload'
  },
  {
    path: '/queue',
    component: Queue,
    name: 'Queue'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
