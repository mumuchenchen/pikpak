import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Layout from '../views/layout/index.vue'
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Layout,
    redirect: '/list',
    children: [
      {
        path: 'list/:id?',
        name: 'list',
        component: () => import('../views/list.vue')
      },
      {
        path: 'trash',
        name: 'trash',
        component: () => import('../views/trash.vue')
      },
      {
        path: 'setting',
        name: 'setting',
        component: () => import('../views/setting.vue')
      },
      {
        path: 'share',
        name: 'share',
        component: () => import('../views/share.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router