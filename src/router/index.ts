import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Layout from '../views/layout/index.vue'
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Layout,
    redirect: '/list',
    beforeEnter: (to, from, next) => {
      const pikpakLogin = JSON.parse(window.localStorage.getItem('pikpakLogin') || '{}')
      if((!pikpakLogin || !pikpakLogin.access_token) && to.name !== 'setting') {
       next('/login')
      } else {
        next()
      }
    },
    children: [
      {
        path: 'list/:id*',
        name: 'list',
        component: () => import('../views/list.vue')
      },
      {
        path: 'video',
        name: 'video',
        component: () => import('../views/list.vue')
      },
      {
        path: 'image',
        name: 'image',
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
        path: 'invited',
        name: 'invited',
        component: () => import('../views/invited.vue')
      }
      // {
      //   path: 'share',
      //   name: 'share',
      //   component: () => import('../views/share.vue')
      // }
    ]
  },
  {
    path: '/t/:id?',
    name: 'test',
    component: () => import('../views/test.vue')
  },
  {
    path: '/s/:id/:password?',
    name: 'shareInfo',
    component: () => import('../views/shareInfo.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login.vue'),
  },
  {
    path: '/sms',
    name: 'sms',
    component: () => import('../views/sms.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/register.vue'),
  },
  {
    path: '/testtest',
    name: 'testtest',
    component: () => import('../views/testtest.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
