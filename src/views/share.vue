<template>
  <div class="list-page">
    <n-alert title="感谢@shabitt" type="info" closable>
      <n-space>
        <a href="https://t.me/shabitt">作者</a>
        <a href="https://shimily.notion.site/shimily/f90e8e28b55e423185f44c89c53c573c?v=b69a268a91c946ce9238f947100070a4">地址</a>
      </n-space>
    </n-alert>
    <br />
    <n-alert title="请先设置默认上传目录" type="error" v-if="!uploadFolder || !uploadFolder.id">
      请先在文件列表操作选择设置默认
    </n-alert>
    
    <n-alert title="默认目录" type="success" v-else>
      {{uploadFolder.name}}
    </n-alert>
    <br />

    <n-data-table :bordered="false" size="small" :data="list" :loading="loading" :columns="columns"></n-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity'
import { h, onMounted } from '@vue/runtime-core'
import axios from 'axios'
import { DataTableColumns, NDataTable, NText, NTime, NAlert, NSpace } from 'naive-ui'
import http, { notionHttp } from '../utils/axios'

const columns = ref<DataTableColumns>([])

const list = ref()
const loading = ref(false)

const getList = () => {
  loading.value = true
  notionHttp.post('https://api.notion.com/v1/databases/f90e8e28b55e423185f44c89c53c573c/query')
  .then((res:any) => {
    loading.value = false
    list.value = res.data.results
    if(list.value.length) {
      for(let k in list.value[0].properties) {
        columns.value.push({
          title: k,
          key: k,
          ellipsis: {
            tooltip: {
              placement: 'right'
            },
          },
          width: k === '链接' ? 600 : undefined,
          render: (row:any) => {
            const item = row.properties[k]
            switch (item.type) {
              case 'select':
                return h('div', {
                  style: {
                    color: row.properties[k].select.color
                  }
                }, item.select.name)
                break
              case 'created_time':
                return h(NTime, {
                  time: new Date(item.created_time),
                  type: 'date',
                  format: 'MM-dd hh:mm'
                })
                break
              case 'rich_text': case 'title':
                return h('div', {}, {
                  default: () => item[item.type] && item[item.type].length && item[item.type].map((listItem:any) => listItem.plain_text)
                })
                break
              default :
                return '--'
            }
          }
        })
      }
    }
    columns.value.push({
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      render: (row:any) => h(NText, {
        type: 'primary',
        onClick: () => {
          addUrl(row.properties['链接'].rich_text[0].plain_text)
        }
      }, {default: () => '保存'})
    })
  })
}
const uploadFolder = ref()
const getUploadFolder = () => {
  return JSON.parse(window.localStorage.getItem('pikpakUploadFolder') || '{}')
}
const addUrl = (url:string) => {
  let postData = {}
  if(!getUploadFolder().id) {
    window.$message.error('请先设置默认上传目录')
    return false
  }
  if(url.indexOf('PikPak://') === 0) {
    const urlData = url.substring(9).split('|')
    postData = {
        kind: "drive#file",
        parent_id: getUploadFolder().id,
        name: urlData[0],
        size: urlData[1],
        hash: urlData[2],
        upload_type: "UPLOAD_TYPE_RESUMABLE",
        objProvider: {
            provider: "UPLOAD_TYPE_UNKNOWN"
        }
    }
  } else {
    postData = {
      kind: "drive#file",
      name: "",
      // parent_id: route.params.id || '',
      upload_type: "UPLOAD_TYPE_URL",
      url: {
        url: url
      },
      params: {"from":"file"},
      folder_type: "DOWNLOAD"
    }
  }
  http.post('https://api-drive.mypikpak.com/drive/v1/files', postData)
    .then((res:any) => {
      if(res.data.upload_type === 'UPLOAD_TYPE_UNKNOWN' || url.indexOf('PikPak://') === -1) {
        window.$message.success('添加成功')
      }
    })
}

onMounted(() => {
  uploadFolder.value = getUploadFolder()
  getList()
})
</script>