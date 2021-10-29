<template>
  <div class="list-page list-page-files" >
    <div class="header">
      <div class="title n-ellipsis">
        <n-breadcrumb separator=">">
          <n-breadcrumb-item>
            <router-link to="/list">文件</router-link>
          </n-breadcrumb-item>
          <n-breadcrumb-item v-if="parentInfo && parentInfo.name">
            {{parentInfo.name}}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="action">
        <n-space>
          <n-button type="default" @click="movePost" v-if="moveFiles?.length">
            粘贴已剪切{{moveFiles.length}}项资源
          </n-button>
          <n-button v-if="copyFiles?.length" @click="copyPost">
            粘贴已复制{{copyFiles.length}}项资源
          </n-button>
          <n-icon :color="themeVars.primaryColor"  @click="showAddUrl = true">
            <circle-plus></circle-plus>
          </n-icon>
        </n-space>
      </div>
    </div>
    <n-scrollbar style="max-height: calc(100vh - 190px);" @scroll="scrollHandle">
      <n-data-table v-model:checked-row-keys="checkedRowKeys"  :row-key="row => row.id" :data="filesList" size="small" :columns="columns" :bordered="false"></n-data-table>
      <div class="loading" v-if="loading">
        <n-spin size="small" />加载中
      </div>
    </n-scrollbar>
    <task-vue ref="taskRef"></task-vue>
    <div class="outer-wrapper static show" v-if="checkedRowKeys.length">
      <div class="toolbar-wrapper">
        <div class="toolbar-item" @click="batchCopyAll">
          <n-tooltip>
            <template #trigger>
              <n-icon>
                <icon-copy></icon-copy>
              </n-icon>
            </template>
            复制所选
          </n-tooltip>
        </div>
        <div class="toolbar-item" @click="batchMoveAll">
          <n-tooltip>
            <template #trigger>
              <n-icon>
                <switch-horizontal></switch-horizontal>
              </n-icon>
            </template>
            剪切所选
          </n-tooltip>
        </div>
        <div class="toolbar-item" @click="copyAll">
          <n-tooltip>
            <template #trigger>
              <n-icon>
                <share></share>
              </n-icon>
            </template>
            分享秒传
          </n-tooltip>
        </div>
        <div class="toolbar-item" @click="deleteFile(checkedRowKeys)">
          <n-tooltip>
            <template #trigger>
              <n-icon>
                <circle-x></circle-x>
              </n-icon>
            </template>
            删除所选
          </n-tooltip>
        </div>
      </div>
    </div>
    <n-modal v-model:show="showAddUrl">
      <n-card style="width: 600px;" title="添加链接">
        <template #header-extra>
          <n-icon @click="showAddUrl = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <n-input type="textarea" :rows="6" placeholder="支持Magnet链接和秒传链接(PikPak://PikPak Tutorial.mp4|19682618|0A4E4FC6FA600D9705B9800BA1687C769273BC97)，换行添加多个，秒传链接默认保存到当前文件夹或第一个文件夹不能保存到根目录 Magent链接只能默认保存到My Pack" v-model:value="newUrl"></n-input>
        <template #action>
          <n-button :block="true" type="primary" :disabled="!newUrl" @click="addUrl">添加</n-button>
        </template>
      </n-card>
    </n-modal>
    <n-modal v-model:show="showVideo">
      <n-card style="width: 100vw; height: 100vh;" :title="fileInfo ? fileInfo.name : '视频'">
        <template #header-extra>
          <n-icon @click="showVideo = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <div style="width: 100%; height: 100%">
          <!-- <Video :src="fileInfo.web_content_link" :type="fileInfo.mime_type"></Video> -->
          <plyr-vue :video="fileInfo"></plyr-vue>
        </div>
      </n-card>
    </n-modal>
    
    <n-modal v-model:show="showImage">
      <n-card style="width: 100vw; height: 100vh;" :title="fileInfo ? fileInfo.name : '图片'">
        <template #header-extra>
          <n-icon @click="showImage = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <div style="width: 100%; height: calc(100vh - 80px);text-align: center;">
          <img :src="fileInfo?.web_content_link" style="max-width: 100%; max-height: 100%">
        </div>
      </n-card>
    </n-modal>
    
    <n-modal v-model:show="showName">
      <n-card style="width: 600px;" title="修改名称">
        <template #header-extra>
          <n-icon @click="showName = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <template v-if="newName">
          <n-input :placeholder="newName.value" v-model:value="newName.value"></n-input>
        </template>
        <template #action>
          <n-button :block="true" type="primary" :disabled="!newName || !newName.value" @click="namePost">重命名</n-button>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity';
import { h, computed, onMounted, watch } from '@vue/runtime-core'
import http, { notionHttp } from '../utils/axios'
import { useRoute, useRouter } from 'vue-router'
import { DataTableColumns, NDataTable, NTime, NEllipsis, NModal, NCard, NInput, NBreadcrumb, NBreadcrumbItem, NIcon, useThemeVars, NButton, NTooltip, NSpace, NScrollbar, NSpin, NDropdown, useDialog, } from 'naive-ui'
import { CirclePlus, CircleX, Dots, Share, Copy as IconCopy, SwitchHorizontal } from '@vicons/tabler'
import { byteConvert } from '../utils'
import PlyrVue from '../components/Plyr.vue'
import TaskVue from '../components/Task.vue'
import ClipboardJS from 'clipboard'
import streamSaver from 'streamsaver'
  const filesList = ref()
  const route = useRoute()
  const router = useRouter()
  interface FileInfo {
    kind: string,
    mine_type: string,
    id: string,
    thumbnail_link: string,
    icon_link: string,
    name: string,
    size: number,
    hash: string
  }
  const themeVars = useThemeVars()
  const checkedRowKeys = ref<string[]>([])
  const dialog = useDialog()
  const smallColums = ref<DataTableColumns>([
    {
      title: '修改时间',
      key: 'modified_time',
      sorter: 'default',
      align: 'right',
      render: (row) => {
        return h(NTime, {
          time: new Date(String(row.modified_time) || ''),
          format: 'MM-dd hh:mm',
        })
      },
      className: 'modified_time',
      width: 160
    },
  ])
  const columns = ref<DataTableColumns>([
    {
      type: 'selection'
    },
    {
      title: '名称',
      key: 'name',
      sorter: 'default',
      render: (row:any) => {
        return h('div', {
          class: 'file-info',
          onClick: () => {
            if(row.kind === 'drive#folder') {
              router.push('/list/' + row.id)
            } else if(row.mime_type.indexOf('video') != -1 || row.mime_type.indexOf('image') != -1) {
              getFile(row.id)
                .then(res => {
                  fileInfo.value = res.data
                  if(fileInfo.value.web_content_link) {
                    if(row.mime_type.indexOf('video') != -1) {
                      showVideo.value = true
                    } else {
                      showImage.value = true
                    }
                  }
                })
            }
          }
        }, [
          h('img', {
            src: row.thumbnail_link || row.icon_link
          }),
          h(NEllipsis, {
              class: 'title',
            },
            {
              default: () => String(row.name)
            }
          ),
          h('span', {
            class: 'action'
          }, '1')
        ])
      }
    },
    {
      title: '大小',
      key: 'size',
      sorter: (rowA:any, rowB:any) => {
        return rowA.size - rowB.size
      },
      align: 'right',
      render: (row) => Number(row.size) > 0 ? byteConvert(Number(row.size)) : '',
      className: 'size',
      width: 100
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'right',
      render: (row:any) =>   h(NDropdown,{
        trigger: 'click',
        placement: 'bottom-end',
        options: [
          {
            label: '重命名',
            key: 'name',
          },
          {
            label: '复制',
            key: 'batchCopy',
          },
          {
            label: '剪切',
            key: 'batchMove',
          },
          {
            label: '直接下载',
            key: 'down',
            disabled: row.size <= 0
          },
          {
            label: '复制下载链接',
            key: 'copyDown',
            disabled: row.size <= 0
          },
          {
            label: '推送到Aria2',
            key: 'aria2Post',
            disabled: row.size <= 0 || !aria2Data.value || !aria2Data.value.host
          },
          {
            label: '复制秒传',
            key: 'code',
            disabled: !row.hash
          },
          {
            label: '设为默认目录',
            key: 'base',
            disabled: row.kind !== 'drive#folder'
          },
          {
            label: '分享到资源库',
            key: 'share',
            disabled: !row.hash
          },
          {
            label: '删除',
            key: 'delete'
          }
        ],
        onSelect: (key) => {
          switch (key) {
            case 'name':
              nameModelSHow(row)
                break
            case 'batchCopy':
              batchCopy([row.id])
              break
            case 'batchMove':
              batchMove([row.id])
              break
            case 'down':
              downFile(row.id)
              break
            case 'copyDown':
              getFile(row.id)
                .then((res:any) => {
                  copy(res.data.web_content_link)
                })
              break
            case 'aria2Post':
              getFile(row.id)
                .then((res:any) => {
                  aria2Post(res)
                })
              break
            case 'code':
              copy(`PikPak://${row.name}|${row.size}|${row.hash}`)
              break
            case 'base':
              window.localStorage.setItem('pikpakUploadFolder', JSON.stringify(row))
              break
            case 'share':
              shareUrl(row)
              break
            case 'delete': 
              dialog.warning({
                  title: '警告',
                  content: '确定删除' + row.name  + '？',
                  positiveText: '确定',
                  negativeText: '不确定',
                  onPositiveClick: () => {
                    deleteFile(String(row.id))
                  }
                })
              break
            default:
              break
          }
        }
      }, {
        default: () => h(NIcon, {
          color: '#306eff'
        }, {
          default: () => h(Dots)
        })
      })
    }
  ])
  const loading = ref(false)
  const pageToken = ref()
  const getFileList = () => {
    loading.value = true
    http.get('https://api-drive.mypikpak.com/drive/v1/files', {
      params: {
        parent_id: route.params.id,
        thumbnail_size: 'SIZE_LARGE',
        with_audit: true,
        page_token: pageToken.value || undefined,
        filters: {
          "phase": {"eq": "PHASE_TYPE_COMPLETE"},
          "trashed":{"eq":false}
        }
      }
    })
      .then((res:any) => {
        const {data} = res
        if(!pageToken.value) {
          filesList.value = []
        }
        filesList.value = filesList.value.concat(data.files)
        pageToken.value = data.next_page_token
      })
      .finally(() => {
        loading.value = false
      })
  }
  const initPage = () => {
    moveFiles.value = JSON.parse(window.localStorage.getItem('pikpakMoveFiles') || '[]')
    copyFiles.value = JSON.parse(window.localStorage.getItem('pikpakCopyFiles') || '[]')
    filesList.value = []
    checkedRowKeys.value = []
    getFileList()
    parentInfo.value = {}
    if(route.params.id) {
      getFile(String(route.params.id))
        .then(res => {
          parentInfo.value = res.data
        })
    }
  }
  watch(route, () => {
    initPage()
  })
  const aria2Data = ref()
  const parentInfo = ref()
  onMounted(() => {
    const width = document.body.clientWidth
    if(width > 968) {
      columns.value.splice(2, 0, ...smallColums.value)
    }
    let aria2 = JSON.parse(window.localStorage.getItem('pikpakAria2') || '{}')
    if(aria2.host) {
      aria2Data.value = aria2
    }
    initPage()
    window.onbeforeunload = function (e) {
      if(!window.$downId || window.$downId.length === 0) {
        return null
      }
      e = e || window.event;

      // 兼容IE8和Firefox 4之前的版本
      if (e) {
        e.returnValue = '还有待下载文件'
      }

      // Chrome, Safari, Firefox 4+, Opera 12+ , IE 9+
      return '还有待下载文件?'
    }
  })
  const fileInfo = ref()
  const getFile = (id:string) => {
    return http.get('https://api-drive.mypikpak.com/drive/v1/files/' + id, {
      params: {
        _magic: '2021',
        thumbnail_size: 'SIZE_LARGE'
      }
    })
      .then(res => {
        return res
      })
  }
  const showVideo = ref(false)
  const showImage = ref(false)
  const showAddUrl = ref(false)
  const newUrl = ref()
  const taskRef = ref()
  const firstFolder = computed(() => {
    let id:string = ''
    if(route.params.id) {
      id = String(route.params.id)
    } else {
      for(let i in filesList.value) {
        if(filesList.value[i].kind === 'drive#folder') {
          id = filesList.value[i].id
          break
        }
      }
    }
    return id
  })
  const addUrl = () => {
    const urlList = newUrl.value.split('\n')
    let successLength = 0
    let hasTask = false
    let hasHash = false
    urlList.forEach((url:string) => {
      if(url) {
        let postData = {}
        if(url.indexOf('PikPak://') === 0) {
          const urlData = url.substring(9).split('|')
          hasHash = true
          postData = {
              kind: "drive#file",
              parent_id: firstFolder.value,
              name: urlData[0],
              size: urlData[1],
              hash: urlData[2],
              upload_type: "UPLOAD_TYPE_RESUMABLE",
              objProvider: {
                  provider: "UPLOAD_TYPE_UNKNOWN"
              }
          }
        } else {
          hasTask = true
          postData = {
            kind: "drive#file",
            name: "",
            parent_id: route.params.id || '',
            upload_type: "UPLOAD_TYPE_URL",
            url: {
              url: url
            },
            params: {"from":"file"},
            folder_type: "DOWNLOAD"
          }
        }
        // {"kind":"drive#folder","parent_id":"VMn5GV_X98Vj4ZiQZQ8hKo6Ho1","name":"1-2"}
        showAddUrl.value = false
        http.post('https://api-drive.mypikpak.com/drive/v1/files', postData)
          .then((res:any) => {
            if(res.data.upload_type === 'UPLOAD_TYPE_UNKNOWN' || url.indexOf('PikPak://') === -1) {
              window.$message.success('添加成功')
            }
          })
          .finally(() => {
            successLength++
            if(successLength === urlList.length) {
              if(hasTask) {
                taskRef.value.getTask()
              }
              if(hasHash) {
                pageToken.value = ''
                getFileList()
              }
            }
          })
      } else {
        successLength++
      }
    })
  }
  const deleteFile = (id:string | string[]) => {
    http.post('https://api-drive.mypikpak.com/drive/v1/files:batchTrash', {
      ids: typeof id === 'string' ? [id] : id
    })
      .then(() => {
        window.$message.success('删除成功')
        pageToken.value = ''
        getFileList()
      })
  }
  const copy = (value:string) => {
    const fakeElement = document.createElement('button')
    const clipboard = new ClipboardJS(fakeElement, {
      text: () => value,
      action: () => 'copy',
    })
    clipboard.on('success', (e) => {
      window.$message.success('复制成功')
      clipboard.destroy()
    })
    fakeElement.click()
  }
  const copyAll = () => {
    let text = ''
    filesList.value.forEach((item:FileInfo) => {
      if(checkedRowKeys.value.indexOf(item.id) !== -1 && item.size > 0) {
        text = text + `PikPak://${item.name}|${item.size}|${item.hash}` + '\n'
      }
    })
    copy(text)
    checkedRowKeys.value = []
  }
  const downFile = (id:string) => {
    getFile(id)
      .then((info:any) => {
        streamSaver.mitm = 'mitm.html'
        const fileStream = streamSaver.createWriteStream(info.data.name)
        fetch(info.data.web_content_link).then((res:any) => {
          if(!window.$downId) {
            window.$downId = []
          }
          window.$downId.push(id)
          const readableStream = res.body
          // more optimized
          if (window.WritableStream && readableStream?.pipeTo) {
            return readableStream.pipeTo(fileStream)
              .then(() => {
                window.$downId.splice(window.$downId.indexOf(id), 1)
              })
          }

          const writer = fileStream.getWriter()

          const reader = res.body.getReader()
          const pump = () => reader.read()
            .then((res:any) => {
              if(res.done) {
                writer.close()
              } else {
                writer.write(res.value).then(pump)
              }
            })

          pump()
        })
      })
  }
  const aria2Post = (res:any) => {

    let postData:any = {
        id:'',
        jsonrpc:'2.0',
        method:'aria2.addUri',
        params:[
            [res.data.web_content_link],
            {
              out: res.data.name
            }
        ]
    }
    if(aria2Data.value.token) {
      postData.params.splice(0, 0, 'token:' + aria2Data.value.token)
    }
    fetch(aria2Data.value.host, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: new Headers({
        'Content-Type': 'application/json'
      })
    })
      .then(response => response.json())
      .then(res => {
        if(res.error && res.error.message) {
          window.$message.error(res.error.message)
        } else if(res.result) {
          window.$message.success('推送成功')
        }
      })
      .catch(error => console.error('Error:', error))
  }
  const scrollHandle = (e:any) =>  {
    if(e.target.offsetHeight - e.target.scrollTop < 30) {
      if(pageToken.value && !loading.value) {
        getFileList()
      }
    }
  }
  const shareUrl = (row: any) => {
    let pikpakUrl = `PikPak://${row.name}|${row.size}|${row.hash}`
    const user = JSON.parse(window.localStorage.getItem('pikpakUser') || '{}')
    notionHttp.post('https://cors.z7.workers.dev/https://api.notion.com/v1/pages', {
      parent: {
        database_id: 'f90e8e28b55e423185f44c89c53c573c',
      },
      properties: {
        '分类': {
          select: {
            name: '来自PikPak网页'
          }
        },
        '标签': {
          select: {
            name: '其他'
          }
        },
        '发布人': {
          rich_text: [
            {
              text: {
                content: user.name || ''
              }
            }
          ]
        },
        '名称': {
          title: [{
            text: {
              content: row.name
            }
          }]
        },
        '链接': {
          rich_text: [
            {
              text: {
                content: pikpakUrl
              }
            }
          ]
        },
        '大小': {
          rich_text: [
            {
              text: {
                content: byteConvert(row.size)
              }
            }
          ]
        }
      }
    })
      .then(res => {
        console.log(res)
        window.$message.success('分享成功')
      })
      .catch(error => {
        console.log(error.response.config.data)
      }) 
  }
  
  const batchMoveAll = (items:object) => {
    let text:string[] = []
    filesList.value.forEach((item:FileInfo) => {
      if(checkedRowKeys.value.indexOf(item.id) !== -1) {
       text.push(item.id)
      }
    })
    batchMove(text)
  }
  const batchCopyAll = (items:object) => {
    let text:string[] = []
    filesList.value.forEach((item:FileInfo) => {
      if(checkedRowKeys.value.indexOf(item.id) !== -1) {
       text.push(item.id)
      }
    })
    batchCopy(text)
  }
  const moveFiles = ref()
  const batchMove = (items:object) => {
    moveFiles.value = items
    window.localStorage.setItem('pikpakMoveFiles', JSON.stringify(items))
    window.$message.success('剪切成功，请点击页面右上方粘贴按钮')
  }
  const copyFiles = ref()
  const batchCopy = (items:object) => {
    copyFiles.value = items
    window.localStorage.setItem('pikpakCopyFiles', JSON.stringify(items))
    window.$message.success('复制成功，请点击页面右上方粘贴按钮')
  }
  const movePost = () => {
    http.post('https://api-drive.mypikpak.com/drive/v1/files:batchMove',{
      "to":{
        "parent_id": route.params.id || ''
      },
      "ids": moveFiles.value
    })
      .then(res => {
        pageToken.value = ''
        getFileList()
        window.$message.success('剪切成功')
        moveFiles.value = []
        window.localStorage.removeItem('pikpakMoveFiles')
      })
  }
  const copyPost = () => {
    http.post('https://api-drive.mypikpak.com/drive/v1/files:batchCopy',{
      "to":{
        "parent_id": route.params.id || ''
      },
      "ids": copyFiles.value
    })
      .then(res => {
        pageToken.value = ''
        getFileList()
        window.$message.success('复制成功')
        copyFiles.value = []
        window.localStorage.removeItem('pikpakCopyFiles')
      })
  }
  const nameModelSHow = (row:any) => {
    newName.value = {
      id: row.id,
      value: row.name
    }
    showName.value = true
  }
  const showName = ref(false)
  const newName = ref<{
    id: string,
    value: string
  } | null>()
  const namePost = () => [
    http.patch('https://api-drive.mypikpak.com/drive/v1/files/' + newName.value?.id, {
      name: newName.value?.value
    })
      .then(() => {
        getFileList()
        window.$message.success('修改成功')
        newName.value = null
        showName.value = false
      })
  ]
</script>

<style>

.header {
  height: 40px;
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  justify-content: space-between;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 16px;
}
.header .title {
  flex: 1;
  width: 0;
  text-overflow: ellipsis;
  margin-right: 20px;
}
.header .action {
  font-size: 24px;
}
.n-data-table-td {
  cursor: pointer;
}
.n-data-table-td.modified_time,.n-data-table-th.modified_time {
  color: rgba(37, 38, 43, 0.36);
}
.n-data-table-td.size,.n-data-table-th.szie {
  color: rgba(37, 38, 43, 0.36);
}
.file-info {
  display: flex;
  align-items: center;
}
.file-info img {
  width: 28px;
  height: 28px;
  margin-right: 20px;
}
.file-info .title {
  flex: 1;
  width: 0;
}
.file-info .action {
  display: none;
}
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
.list-page-files {
  padding-bottom: 80px;
}
.outer-wrapper {
  opacity: 0;
  position: absolute;
  left: 50%;
  bottom: 52px;
  transform: translateX(-50%);
  z-index: 5;
  transition: opacity 0.3s ease;
}
.outer-wrapper.static {
  animation: move-down ease 0.3s;
}
.outer-wrapper.show {
  opacity: 1;
}
.outer-wrapper.show.static {
  animation: move-up ease 0.3s;
}
.toolbar-wrapper {
  display: -ms-flexbox;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid #84858d33;
  background: #000;
  overflow: visible;
  user-select: none;
  box-shadow: 0 0 1px 1px rgba(28, 28, 32, 0.05),
    0 8px 24px rgba(28, 28, 32, 0.12);
}
.toolbar-item {
  border-radius: 5px;
  padding: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s ease;
  color: #fff;
  margin-left: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.toolbar-item:first-child {
  margin-left: 0;
}
.tool-icon {
  font-size: 18px;
}
@keyframes move-down {
  0% {
    bottom: 52px;
  }
  100% {
    bottom: -52px;
  }
}
@keyframes move-up {
  0% {
    bottom: -52px;
  }
  100% {
    bottom: 52px;
  }
}

</style>