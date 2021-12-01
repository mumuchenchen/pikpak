<template>
<button @click="invite">接受邀请</button>
<br><br>
<button @click="inviteInfo">我的邀请</button>
</template>

<script setup lang="ts">
import axios from 'axios';
import http from '../utils/axios'

  const invite = () => {
    const loginData = JSON.parse(window.localStorage.getItem('pikpakLogin') || '{}')
    axios.get('https://invite.z7.workers.dev/' + loginData.sub, {
      headers: {
        'authorization': loginData.token_type + ' ' + loginData.access_token
      }
    })
      .then((res:any) => {
        if(res.data.invited_days) {
          window.$message.success('恭喜您，您已成功增加' + res.data.invited_days + '天')
        } else {
          window.$message.error('您已经邀请过了')
        }
      })
  }
  const inviteInfo = () => {
    http.get('https://api-drive.mypikpak.com/vip/v1/activity/inviteInfo')
      .then((res:any) => {
        if(res.data.invited_nums >= 0) {
          window.$message.success('您已成功邀请' + res.data.invited_nums + '人，' + res.data.add_days + '天')
        } else {
          window.$message.error(JSON.stringify(res.data))
        }
      })
  }
</script>
