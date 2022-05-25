<template>
  <n-layout has-sider v-resize @resize="handleResize">
    <n-layout-sider 
      :content-style="{display: 'flex', flexDirection: 'column'}"
      collapse-mode="width"
      :collapsed-width="0"
      :width="240"
      show-trigger="bar"
      :collapsed="collapsed"
      @collapse="collapsed = true"
      @expand="collapsed = false"
      bordered
    >
      <a href="https://mypikpak.com/" target="_blank" class="logo-box">
        <img src="https://mypikpak.com/apple-touch-icon.png" class="logo-box__icon" alt="">
        <div class="logo-box__text">PikPak</div>
      </a>
      <n-menu :options="menuOptions" :value="String(route.name)" @update:value="goRoute"></n-menu>
      <div class="content-bottom" v-if="!collapsed">
        {{byteConvert(aboutInfo?.quota.usage)}} / {{byteConvert(aboutInfo?.quota.limit)}} <n-text type="primary" @click="showCode = true">会员码</n-text>
        <n-progress 
          v-if="aboutInfo?.quota"
          type="line"
          :percentage="Number((aboutInfo?.quota.usage / aboutInfo?.quota.limit * 100).toFixed(2))"
          :indicator-placement="'inside'"
          :height="14"
          :color="vipInfo?.status === 'ok' ? '#d1ae6a' : undefined"
          processing>
        </n-progress>
        <p style="margin-bottom: 0;">
          <n-tooltip :width="600" placement="right">
              <template #trigger>
                <a style="color: #306eff;" target="_blank" href="https://k.youshop10.com/JGDtoxg6">2021年12月23日~2021年12月31日￥119购体验会员VIP年卡</a>
              </template>
              2021年12月23日~2021年12月31日 【1年PikPak体验会员仅售：119元！原价450元】 2022年1月1日起： 1年PikPak体验会员仅售：169元！原价450元】 -每人只能购买使用一次，官方代理商分销，感谢支持
          </n-tooltip>
        </p>
      </div>
      <div class="sider-bottom" v-if="!collapsed" :class="{vip: vipInfo?.status === 'ok'}">
        <div class="bottom-user-info">
          <img src="../../assets/logo1.png" class="user-info-avatar" v-if="vipInfo?.status === 'ok'">
          <img src="https://www.mypikpak.com/logo.png" v-else class="user-info-avatar">
          <div class="user-info-name">
            {{userInfo?.name}}
            <div v-if="vipInfo?.status === 'ok' && vipInfo?.expire">
               <n-time :time="new Date(vipInfo.expire)" type="datetime"></n-time>
            </div>
          </div>
          <div class="action">
            <n-tooltip>
              <template #trigger>
                <n-icon @click="logoutPost">
                  <logout></logout>
                </n-icon>
              </template>
              退出登录
            </n-tooltip>
          </div>
        </div>
      </div>
    </n-layout-sider>
    <n-layout>
      <n-layout-content style="height: 100vh;">
        <n-scrollbar style="max-height: 100vh;">
          <router-view></router-view>
        </n-scrollbar>
      </n-layout-content>
    </n-layout>
  </n-layout>
  <n-modal v-model:show="showCode">
    <n-card style="width: 600px;" title="会员码">
      <template #header-extra>
        <n-icon @click="showCode = false">
          <circle-x></circle-x>
        </n-icon>
      </template>
      <n-input placeholder="会员码" v-model:value="code"></n-input>
      <p>
        <a style="color: #306eff;" target="_blank" href="https://k.youshop10.com/JGDtoxg6">【0.33元/天】PikPak体验会员VIP年卡-可与7天免费会员码叠加-每人只能购买使用一次，感谢支持</a>
      </p>

      <template #action>
        <n-button :block="true" type="primary" :disabled="!code" @click="postCode">添加</n-button>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity';
import { h, onMounted, watch } from '@vue/runtime-core';
import { NLayout, NLayoutSider, NLayoutContent, NMenu, MenuOption, NIcon, NProgress, NText, NModal, NCard, NInput, NButton, NScrollbar, NTime, NTooltip, useDialog } from 'naive-ui'
import { File, Trash, CircleX, Logout, Settings, Copy, Video, Camera } from '@vicons/tabler'
import http from '../../utils/axios'
import { byteConvert } from '../../utils'
import { useRoute, useRouter } from 'vue-router'
  const collapsed = ref(false)
  const  renderIcon = (icon:any) => {
    return () => h(NIcon, null, { default: () => h(icon) })
  }
  const router = useRouter()
  const route = useRoute()
  const menuOptions = ref<MenuOption[]>([
    {
      label: '文件',
      key: 'list',
      icon: renderIcon(File)
    },
    {
      label: '视频',
      key: 'video',
      icon: renderIcon(Video)
    },
    {
      label: '图片',
      key: 'image',
      icon: renderIcon(Camera)
    },
    {
      label: '回收站',
      key: 'trash',
      icon: renderIcon(Trash)
    },
    {
      label: '邀请',
      key: 'invited',
      icon: renderIcon(Copy)
    },
    {
      label: '资源库',
      key: 'share',
      icon: renderIcon(Share)
    },
    {
      label: '设置',
      key: 'setting',
      icon: renderIcon(Settings)
    }
  ])
  const userInfo = ref()
  const getUserInfo = () => {
    http.get('https://user.mypikpak.com/v1/user/me')
      .then(res => {
        window.localStorage.setItem('pikpakUser', JSON.stringify(res.data))
        userInfo.value = res.data
      })
      .catch(error => {
        console.log(error)
      })
  }
  const aboutInfo = ref()
  const getAbout = () => {
    http.get('https://api-drive.mypikpak.com/drive/v1/about')
      .then(res => {
        aboutInfo.value = res.data
      })
      .catch(error => {
        console.log(error)
      })
  }
  const vipInfo = ref()
  const getVip = () => {
    http.get('https://api-drive.mypikpak.com/drive/v1/privilege/vip')
      .then((res:any) => {
        vipInfo.value = res.data?.data
      })
  }
  const goRoute = (key:string, item:MenuOption) => {
    console.log(item)
    router.push('/' + item.key)
  }
  onMounted(() => {
    getUserInfo()
    getAbout()
    getVip()
  })
  const code = ref()
  const showCode = ref(false)
  const postCode = () => {
    http.post('https://api-drive.mypikpak.com/vip/v1/order/activation-code', {
      activation_code: code.value,
      data: {}
    })
      .then(res => {
        window.$message.success('兑换成功')
        getAbout()
      })
      .catch(error => {
        console.log(error)
      })
      .finally(() => {
        showCode.value = false
      })
  }
  const isMobile = ref(false)
  const handleResize = (w:number) => {
    isMobile.value = w < 800
    if(!collapsed.value) {
      collapsed.value = w < 800
    }
  }
  watch(route, () => {
    if(isMobile.value) {
      collapsed.value = true
    }
  })
  
  const dialog = useDialog()
  const logoutPost = () => {
    dialog.warning({
        title: '警告',
        content: '确定退出？',
        positiveText: '确定',
        negativeText: '不确定',
        onPositiveClick: () => {
          http.post('https://user.mypikpak.com/v1/auth/revoke', {})
            .then(res => {
              window.localStorage.removeItem('pikpakLogin')
              window.localStorage.removeItem('pikpakLoginData')
              window.$message.success('退出成功')
              router.push('/login')
            })
            .catch(error => {
              console.log(error)
            })
        }
      })
  }
</script>

<style>
  a {
    text-decoration: none;
    color: inherit;
  }
  .n-layout .logo-box {
    display: flex;
    align-items: center;
    /* margin: auto; */
    /* justify-content: center; */
    padding-top: 36px;
    margin-bottom: 8px;
    margin-left: 30px;
    margin-top: 0;
    margin-right: 0;
  }
  .n-layout .logo-box__icon {
    width: 24PX;
    height: 24PX;
    margin-right: 10PX
  }
  .n-layout .logo-box__text {
    font-family: PingFangSC-Semibold;
    font-size: 20PX;
    letter-spacing: -1.25PX;
    color: #000;
  }
  .content-bottom {
    width: 192px;
    left: 24px;
    bottom: 75px;
    padding-bottom: 28px;
    position: absolute;
  }
  .n-progress {
    margin-top: 4px;
  }
  .sider-bottom {
    height: 75px;
    width: 100%;
    position: absolute;
    bottom: 0;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 0 20px 0 24px;
    box-sizing: border-box;
  }
  .sider-bottom.vip {
    background-color: #f4eddb;
  }
  .sider-bottom::before {
    display: block;
    content: '';
    width: 100%;
    height: 1px;
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(132, 133, 141, 0.2)
  }
  .bottom-user-info {
    width: calc(100% - 36px);
    margin-right: 4px;
    display: flex;
    height: 32px;
    align-items: center;
    width: 100%;
  }
  .user-info-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  .user-info-name {
    font-size: 14px;
    line-height: 1.5;
    margin-left: 4px;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    flex: 1;
    width: 0;
  }
  .bottom-user-info .action{
    font-size: 18px;
    cursor: pointer;
  }

  .list-page {
    padding: 40px;
  }
  @media(max-width: 968px) {
    .list-page {
      padding: 10px;
    }
  }
</style>
