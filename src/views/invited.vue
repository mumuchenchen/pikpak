<template>
  <div class="list-page">
    <n-row>
      <n-col :span="12">
        <n-statistic label="会员分成(天/次)" :value="invitationInfo?.invited_join_days ">
          <template #prefix>
            <n-icon>
              <diamond />
            </n-icon>
          </template>
          <template #suffix>/ {{invitationInfo?.join_vip_nums}}</template>
        </n-statistic>
      </n-col>
      <n-col :span="12">
        <n-statistic label="邀请奖励(天/人)" :value="invitationInfo?.add_days">
          <template #prefix>
            <n-icon>
              <accessible />
            </n-icon>
          </template>
          <template #suffix>/ {{invitationInfo?.invited_nums}}</template>
        </n-statistic>
      </n-col>
      <n-col :span="12">
        <n-statistic label="邀请链接" >
          <template #prefix>
            <n-icon>
              <copyright></copyright>
            </n-icon>
          </template>
          <template #default>
            <n-space inline>
              <n-input type="text" size="small" :value="'https://toapp.mypikpak.com/activity/invited?code=' + invitationCode"></n-input>
              <n-button size="small" type="primary" @click="copy('https://toapp.mypikpak.com/activity/invited?code=' + invitationCode)">复制</n-button>
            </n-space>
            <n-input-group >
            </n-input-group>
          </template>
        </n-statistic>
      </n-col>
      <n-col :span="12">
        <n-statistic label="下载推广" >
          <template #prefix>
            <n-icon>
              <arrow-down-circle ></arrow-down-circle>
            </n-icon>
          </template>
          <template #default>
            <n-button size="small" type="primary" @click="getChaApkDownloadLink">立即下载</n-button>
          </template>
        </n-statistic>
      </n-col>
    </n-row>
    <n-scrollbar style="max-height: calc(100vh - 250px)"  @scroll="scrollHandle">
      <n-data-table :data="invitedList" :columns="columns"></n-data-table>
      <div class="loading" v-if="loading">
        <n-spin size="small" />加载中
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { Accessible, Diamond, ArrowDownCircle, Copyright } from '@vicons/tabler';
import ClipboardJS from 'clipboard';
import { DataTableColumns, NDataTable, NGradientText, NTime, NScrollbar, NSpin, NRow, NCol, NStatistic, NIcon, NInputGroup, NInput, NButton, NSpace } from 'naive-ui';
import { computed, h, nextTick, onMounted, ref } from 'vue';
import http from '../utils/axios'
const copy = (value:string) => {
  nextTick(() => {
    const fakeElement = document.createElement('button')
    const clipboard = new ClipboardJS(fakeElement, {
      text: () => value,
      action: () => 'copy',
    })
    clipboard.on('success', (e) => {
      window.$message.success('复制成功')
      clipboard.destroy()
    })
    clipboard.on('error', (e) => {
      window.$message.error('复制失败，您可以F12打开控制台手动复制，或手动复制弹窗输入框')
    })
    fakeElement.click()
  })
}
const invitationCode = ref()
// 生成邀请码
const getInviteCode = async () => {
	http.get('https://api-drive.mypikpak.com/vip/v1/activity/inviteCode')
    .then((res:any) => {
      invitationCode.value = res.data?.code
    })
}
const invitationInfo = ref()
const isFirstInvite = computed(() => {
  return invitationInfo.value.invited_nums <= 0
})
const typeList = ref({
  vip_rebate: '会员分成',
  invite_reward: '邀请奖励'
})
// 获取当用户的邀请详情
const queryUserInvitationInfo = async () => {
	http.get('https://api-drive.mypikpak.com/vip/v1/activity/inviteInfo')
    .then(res => {
      invitationInfo.value = res.data
    })
    .catch(() => {
      invitationInfo.value = {}
    })
}
const columns = ref<DataTableColumns>([
  {
    title: '邀请用户',
    key: 'invited_user'
  },
  {
    title: '奖励类型',
    key: 'reward_source',
    render: (row:any) => {
      return h(NGradientText, {
        type: row.reward_source == 'vip_rebate' ? 'info' : 'success'
      }, {
        default: () => typeList.value[row.reward_source as keyof typeof typeList.value]
      })
    }
  },
  {
    title: '天数',
    key: 'reward_days',
  },
  {
    title: '时间',
    key: 'time',
    align: 'right',
    render: (row) => {
      return h(NTime, {
        time: new Date(String(row.time) || ''),
        format: 'yyyy-MM-dd HH:MM:ss',
      })
    }
  }
])
const invitedList = ref([])
const loading = ref(false)
// 分享裂变: 获取成功邀请的好友列表
const getInvitedList = async ( begin?:string, limit = 30) => {
	let url = `https://api-drive.mypikpak.com/vip/v1/activity/inviteList`;
	if (begin) {
		url += `?begin=${begin}&limit=${limit}`;
	}
  loading.value = true
	http.get(url)
    .then((res:any) => {
      if(!begin) {
        invitedList.value = [] 
      }
      invitedList.value = invitedList.value.concat(res.data?.data || [])
    })
    .finally(() => {
      loading.value = false
    })
}

// 分享裂变: 获取CHA下载包
const getChaApkDownloadLink = () => {
	http.get(`https://api-drive.mypikpak.com/package/v1/apk/url/${invitationCode.value}`)
    .then((res:any) => {
      window.open(res.data.apk_url)
    })
}
const scrollHandle = (e:any) =>  {
  if(e.target.offsetHeight + e.target.scrollTop >= e.target.scrollHeight - 30) {
    if(invitedList.value.length < invitationInfo.value.invited_nums && !loading.value) {
      getInvitedList((invitedList.value[invitedList.value.length - 1] as any).time)
    }
  }
}
onMounted(() => {
  getInviteCode()
  queryUserInvitationInfo()
  getInvitedList()
})

</script>

<style lang="scss">
.list-page {
  padding: 40px;
}
@media(max-width: 968px) {
  .list-page {
    padding: 10px;
  }
  .file-info img {
    display: none;
  }
}
.list-page .loading {
  margin-top: 20px;
  text-align: center;
  color: rgba(37, 38, 43, 0.36);
}
.list-page .loading .n-spin-body {
  vertical-align: middle;
  margin-right: 10px;
}
</style>