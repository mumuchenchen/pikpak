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
          <n-button  @click="showUserMenu = true">
            添加自定义菜单
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
        <div class="toolbar-item" @click="aria2All">
          <n-tooltip>
            <template #trigger>
              <n-icon>
                <letter-a></letter-a>
              </n-icon>
            </template>
            推送到Aria2
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
      <n-card style="width: 600px;" title="添加链接或新建文件夹">
        <template #header-extra>
          <n-icon @click="showAddUrl = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <n-alert :show-icon="false" closable title="添加说明">
          <div>1.支持Magnet链接(magnet:?xt=urn)，Magent链接只能默认保存到My Pack</div>
          <div>2.支持秒传链接(PikPak://PikPak Tutorial.mp4|19682618|123)秒传链接默认保存到当前文件夹或第一个文件夹不能保存到根目录</div>
          <div>3.支持新建文件夹（普通格式，不带:）</div>
          <div>4.换行添加多个</div>
        </n-alert>
        <br />
        <n-input type="textarea" :rows="4" placeholder="请按说明填写" v-model:value="newUrl"></n-input>
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
    <n-modal v-model:show="showUserMenu">
      <n-card style="width: 600px;" title="自定义菜单">
        <template #header>
          自定义菜单 <a href="https://www.tjsky.net/?p=220#i-8" target="_blank"> <n-icon style="vertical-align: middle;" size="20" color="#d03050"><zoom-question></zoom-question></n-icon> </a>
        </template>
        <template #header-extra>
          <n-icon @click="showUserMenu = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <n-form label-width="160px" label-align="left" label-placement="left">
          <n-form-item label="自定义菜单列表：">
            <n-space>
              <template v-for="(item, key) in userMenu" :key="key">
                <n-tag :closable="true" @close="removeUserMenu(key)">{{item.name}}</n-tag>
              </template>
            </n-space>
          </n-form-item>
          <n-form-item label="自定义菜单名称：">
            <n-input v-model:value="newMenu.name"></n-input>
          </n-form-item>
          <n-form-item label="自定义菜单类型：">
            <n-select :options="menuTypeList" v-model:value="newMenu.type"></n-select>
          </n-form-item>
          <n-form-item label="自定义菜单可插入：">
            <n-space>
              <template v-for="(item,k) in menuTextList" :key="k">
                <n-button @click="newMenu.content = newMenu.content + '{{' + k + '}}'">{{item}}</n-button>
              </template>
            </n-space>
          </n-form-item>
          <n-form-item label="自定义菜单内容：">
            <n-input type="textarea" v-model:value="newMenu.content"></n-input>
          </n-form-item>
          <n-form-item>
            <n-button type="primary" @click="addUserMenu">添加</n-button>
          </n-form-item>
        </n-form>
      </n-card>
    </n-modal>
    
    <n-modal v-model:show="showCopy">
      <n-card style="width: 600px;" title="复制链接">
        <template #header-extra>
          <n-icon @click="showCopy = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <n-form label-width="40px" label-align="left" label-placement="left">
          <template v-for="item in fileInfo?.medias" :key="item.media_id">
            <n-form-item :label="item.media_name">
              <n-input-group>
                <n-input :value="item.link.url"></n-input>
                <n-button type="primary" @click="copy(item.link.url)">复制</n-button>
              </n-input-group>
            </n-form-item>
          </template>
          <n-form-item label="链接">
            <n-input-group>
              <n-input :value="fileInfo?.web_content_link"></n-input>
              <n-button type="primary" @click="copy(fileInfo.web_content_link)">复制</n-button>
            </n-input-group>
          </n-form-item>
        </n-form>
      </n-card>
    </n-modal>

    <n-modal v-model:show="showCopyFail">
      <n-card style="width: 600px;" title="复制失败，自己选择复制">
        <template #header-extra>
          <n-icon @click="showCopyFail = false">
            <circle-x></circle-x>
          </n-icon>
        </template>
        <n-form label-width="0" label-align="left" label-placement="left">
          <n-form-item>
            <n-input :value="copyValue"></n-input>
          </n-form-item>
        </n-form>
      </n-card>
    </n-modal>

  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity';
import { h, computed, onMounted, watch, nextTick } from '@vue/runtime-core'
import http, { notionHttp } from '../utils/axios'
import { useRoute, useRouter } from 'vue-router'
import { DataTableColumns, NDataTable, NTime, NEllipsis, NModal, NCard, NInput, NBreadcrumb, NBreadcrumbItem, NIcon, useThemeVars, NButton, NTooltip, NSpace, NScrollbar, NSpin, NDropdown, useDialog, NAlert, useNotification, NotificationReactive, NSelect, NForm, NFormItem, NTag, NText, NInputGroup } from 'naive-ui'
import { CirclePlus, CircleX, Dots, Share, Copy as IconCopy, SwitchHorizontal, LetterA, ZoomQuestion } from '@vicons/tabler'
import { byteConvert } from '../utils'
import PlyrVue from '../components/Plyr.vue'
import TaskVue from '../components/Task.vue'
import ClipboardJS from 'clipboard'
import streamSaver from 'streamsaver'
import { DropdownMixedOption } from 'naive-ui/lib/dropdown/src/interface'
import axios from 'axios';
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
          format: 'MM-dd HH:MM',
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
            } else if(row.mime_type.indexOf('video') != -1 || row.mime_type.indexOf('image') != -1  || row.mime_type.indexOf('audio') != -1) {
              getFile(row.id)
                .then(res => {
                  fileInfo.value = res.data
                  if(fileInfo.value.web_content_link) {
                    if(row.mime_type.indexOf('video') != -1 || row.mime_type.indexOf('audio') != -1) {
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
      render: (row:any) => h(NSpace, {
        justify: "end"
      }, {
        default: () => [
          !samllPage.value && h(NText, {
            type: 'primary',
            onClick: () => nameModelSHow(row)
          }, {
            default: () => '重命名'
          }),
          !samllPage.value && h(NText, {
            type: 'primary',
            onClick: () => batchCopy([row.id])
          }, {
            default: () => '复制'
          }),
          !samllPage.value && h(NText, {
            type: 'primary',
            onClick: () => batchMove([row.id])
          }, {
            default: () => '剪贴'
          }),
          !samllPage.value && row.kind === 'drive#file' && h(NText, {
            type: 'primary',
            onClick: () => downFile(row.id)
          }, {
            default: () => '下载'
          }),
          !samllPage.value && h(NText, {
            type: 'primary',
            onClick: () => {
              dialog.warning({
                title: '警告',
                content: '确定删除' + row.name  + '？',
                positiveText: '确定',
                negativeText: '不确定',
                onPositiveClick: () => {
                  deleteFile(String(row.id))
                }
              })
            }
          }, {
            default: () => '删除'
          }),
          h(NDropdown, {
            trigger: 'click',
            placement: 'bottom-end',
            options: getFileActions(row),
            onSelect: (key:string) => {
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
                      fileInfo.value = res.data
                      showCopy.value = true
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
                case 'sharePikPak':
                  sharePikPakPassword.value = ''
                  sharePikpak.value = row
                  sharePikPakUrl.value = ''
                  showSharePikPak.value = true
                  break
                default:
                  if(key.indexOf('user') !== -1) {
                    const userMenuKey = Number(key.replace('user-', ''))
                    const keyMenu = userMenu.value[userMenuKey]
                    if(keyMenu) {
                      getFile(row.id)
                        .then((res:any) => {
                          const render =  (template:string) => {
                            return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
                              key = key.trim()
                              let data = res.data[key]
                              if(key === 'web_content_link' && res.data.medias && res.data.medias.length > 0) {
                                data = res.data.medias[0]?.link?.url || data
                              }
                              return data
                            });
                          }
                          if(keyMenu.type === 'a') {
                            window.open(render(keyMenu.content), '_target')
                          } else if(keyMenu.type === 'copy') {
                            copy(render(keyMenu.content))
                          }
                        })
                    }
                  }
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
        ]
      })
    }
  ])
  const loading = ref(false)
  const pageToken = ref()
  const getFileList = () => {
    loading.value = true
    let filters:any = {
        "phase": {"eq": "PHASE_TYPE_COMPLETE"},
        "trashed":{"eq":false},
        // "created_time"
        // "modified_time"
        // "kind":{"eq":"drive#folder"},
        // "mime_type":{"prefix":"video/"},
    }
    if(route.name != 'list') {
      filters['mime_type'] = {"prefix": String(route.name) + '/'}
    }
    let parent_id = route.name !== 'list' ? '*' : route.params.id
    http.get('https://api-drive.mypikpak.com/drive/v1/files', {
      params: {
        parent_id: parent_id,
        thumbnail_size: 'SIZE_LARGE',
        with_audit: true,
        page_token: pageToken.value || undefined,
        limit: 100,
        filters: filters
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
    userMenu.value = JSON.parse(window.localStorage.getItem('pikpakUserMenu') || '[]')
    filesList.value = []
    checkedRowKeys.value = []
    pageToken.value = ''
    getFileList()
    parentInfo.value = {}
    if(route.params.id && route.params.id !== '*') {
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
  const samllPage = ref(true)
  onMounted(() => {
    const width = document.body.clientWidth
    if(width > 968) {
      samllPage.value = false
      columns.value.splice(2, 0, ...smallColums.value)
      columns.value[columns.value.length - 1].width = 300
    }
    let aria2 = JSON.parse(window.localStorage.getItem('pikpakAria2') || '{}')
    if(aria2.dir === undefined) {
      aria2.dir = true
    }
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
  const showCopy = ref(false)
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
        } else if(url.indexOf(':') !== -1) {
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
        } else {
          hasHash = true
          postData = {
            "kind":"drive#folder",
            "parent_id": route.params.id || '',
            "name": url
          }
        }
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
              newUrl.value = ''
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
        if(typeof id === 'object') {
          checkedRowKeys.value = []
        }
        getFileList()
      })
  }
  const showCopyFail = ref(false)
  const copyValue = ref('')
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
        showCopyFail.value = true
        copyValue.value = value
        console.log(e.text)
        clipboard.destroy()
      })
      fakeElement.click()
    })
  }
  const copyAll = async () => {
    let text = ''
    if(allLoding.value) {
      return false
    }
    await getAllFile('分享秒传')
    for(let i in downFileList.value) {
      const item = downFileList.value[i]
      if(nRef.value) {
        nRef.value.content = nRef.value.content + '\r\n' + '获取' + item.parent + '/' + item.name + '成功'
      }
      text = text + `PikPak://${item.name}|${item.size}|${item.hash}` + '\n'
    }
    copy(text)
    setTimeout(() => {
      allLoding.value = false
      nRef.value?.destroy()
    }, 1000);
  }
  const notification = useNotification()
  const allLoding = ref(false)
  const nRef = ref<NotificationReactive>()
  const getAllFile = async (title?:string) => {
    downFileList.value = []
    allLoding.value = true
    nRef.value = notification.create({
      title: title || '推送到Aria2',
      closable: false,
      content: '正在获取全部文件列表'
    })
    const checkedRowKeysCopy = JSON.parse(JSON.stringify(checkedRowKeys.value))
    checkedRowKeys.value = []
    for(let i in filesList.value) {
      const item = filesList.value[i]
      if(checkedRowKeysCopy.indexOf(item.id) !== -1) {
        if(item.kind === 'drive#file') {
          downFileList.value.push({
            id: item.id,
            name: item.name,
            parent: '',
            size: item.size,
            hash: item.hash
          })
        } else {
          await getFloderFile(item.id, '', item.name)
        }
      }
    }
    nRef.value.content = '共获取到' + downFileList.value.length + '个文件'
  }
  const aria2All = async () => {
    if(allLoding.value) {
      return false
    }
    await getAllFile()
    if(!aria2Dir.value && aria2Data.value.dir) {
      await getAria2Dir()
    }
    const postOne =  () => {
      getFile(downFileList.value[0].id)
        .then(async res => {
          const data:any = downFileList.value.shift()
          await aria2Post(res, data.parent)
          if(nRef.value?.content) {
            nRef.value.content = nRef.value?.content + '\r\n' + '推送' + data.parent + '/' + data.name + '成功'
          }
          if(downFileList.value.length) {
            setTimeout(() => {
              postOne()
            }, 3000)
          } else {
            setTimeout(() => {
              nRef.value?.destroy()
              allLoding.value = false
            }, 1000);
          }
        })
    }
    postOne()
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
  const aria2Dir = ref()
  const getAria2Dir = () => {
    let postData:any = {
        id:'',
        jsonrpc:'2.0',
        method:'aria2.getGlobalOption',
        params:[
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
        aria2Dir.value = res?.result?.dir || ''
      })
  }
  const aria2Post = (res:any, dir?:string) => {
    let url = res.data.web_content_link
    // if(res.data.medias && res.data.medias.length) {
    //   url = res.data.medias[0]?.link?.url || url
    // }
    let postData:any = {
        id:'',
        jsonrpc:'2.0',
        method:'aria2.addUri',
        params:[
            [url],
            {
              out: res.data.name
            }
        ]
    }
    if(dir && aria2Dir.value) {
      postData.params[1].dir = aria2Dir.value + '/' + dir
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
    if(e.target.offsetHeight + e.target.scrollTop >= e.target.scrollHeight - 30) {
      if(pageToken.value && !loading.value) {
        getFileList()
      }
    }
  }
  
  const batchMoveAll = (items:object) => {
    let text:string[] = []
    filesList.value.forEach((item:FileInfo) => {
      if(checkedRowKeys.value.indexOf(item.id) !== -1) {
       text.push(item.id)
      }
    })
    batchMove(text)
    checkedRowKeys.value = []
  }
  const batchCopyAll = (items:object) => {
    let text:string[] = []
    filesList.value.forEach((item:FileInfo) => {
      if(checkedRowKeys.value.indexOf(item.id) !== -1) {
       text.push(item.id)
      }
    })
    batchCopy(text)
    checkedRowKeys.value = []
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
  const namePost = () => {
    http.patch('https://api-drive.mypikpak.com/drive/v1/files/' + newName.value?.id, {
      name: newName.value?.value
    })
      .then(() => {
        getFileList()
        window.$message.success('修改成功')
        newName.value = null
        showName.value = false
      })
  }
  const downFileList = ref<{[key:string]:any}[]>([])
  const getFloderFile = async (id?:string, page?:string,parent?:string) => {
    const res:any = await http.get('https://api-drive.mypikpak.com/drive/v1/files', {
      params: {
        parent_id: id || undefined,
        thumbnail_size: 'SIZE_LARGE',
        with_audit: true,
        page_token: page || undefined,
        filters: {
          "phase": {"eq": "PHASE_TYPE_COMPLETE"},
          "trashed":{"eq":false}
        }
      }
    })
    const {files, next_page_token} = res.data
    if(next_page_token) {
      await getFloderFile(id, next_page_token, parent)
    }
    for(let i in files) {
      const item = files[i]
      if(item.kind === 'drive#folder') {
         await getFloderFile(item.id, '', (parent ? (parent + '/') :  '') + item.name)
      } else {
        downFileList.value.push({
          name: item.name,
          id: item.id,
          parent: parent || '',
          size: item.size,
          hash: item.hash
        })
      }
    }
    return 1
  }
  const menuTypeList = ref([
    {
      label: "链接",
      value: 'a',
    },
    {
      label: "复制",
      value: 'copy',
    },
  ])
  const menuTextList = ref({
    web_content_link: '链接',
    name: '名称',
    size: '大小',
    hash: '文件HASH值'
  })
  const newMenu = ref<{
    type: string,
    content: string,
    name: string
  }>({
    type: 'a',
    content: '',
    name: ''
  })
  const showUserMenu = ref(false)
  const userMenu = ref<typeof newMenu.value[]>([])
  const addUserMenu = () => {
    userMenu.value.push(JSON.parse(JSON.stringify(newMenu.value)))
    newMenu.value = {
      type: 'a',
      content: '',
      name: ''
    }
    window.localStorage.setItem('pikpakUserMenu', JSON.stringify(userMenu.value))
  }
  const removeUserMenu = (key:number) => {
    userMenu.value.splice(key, 1)
    window.localStorage.setItem('pikpakUserMenu', JSON.stringify(userMenu.value))
  }
  const getFileActions = (row:any) => {
    const options:DropdownMixedOption[] = [
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
      },
      {
        label: '直接分享',
        key: 'sharePikPak',
        disabled: row.kind === 'drive#folder'
      },
    ]
    if(row.kind !== 'drive#folder') {
      if(userMenu.value.length) {
        options.push({
          type: 'divider',
          key: 'd1'
        })
        userMenu.value.forEach((item, key) => {
          options.push({
            label: item.name,
            key: 'user-' + key
          })
        })
      }
    }
    return options
  }
  const showSharePikPak = ref(false)
  const sharePikpak = ref()
  const sharePikPakPassword = ref()
  const sharePikPakUrl = ref()
  const sharePikPakPostLoading = ref()
  const sharePikPakPost = () => {
    sharePikPakPostLoading.value = true
    getFile(sharePikpak.value.id)
      .then((res:any) => {
        axios.post('https://pikpak-depot.z10.workers.dev', {
          password: sharePikPakPassword.value || '',
          uid: res.data.user_id,
          Name: res.data.hash,
          delete_time: String(new Date().getTime() + (24 * 60 * 60 * 1000)),
          info: {
            name: res.data.name,
            file_extension: res.data.file_extension,
            hash: res.data.hash,
            id: res.data.id,
            md5_checksum: res.data.md5_checksum,
            mime_type: res.data.mime_type,
            size: res.data.size,
            thumbnail_link: res.data.thumbnail_link,
            web_content_link:  res.data.web_content_link
          },
          info2: {
            medias: res.data.medias,
          },
          info3: {
            links: res.data.links,
          }
        })
        .then((res:any) => {
          sharePikPakUrl.value =  window.location.origin + window.location.pathname + router.resolve({
            name: 'shareInfo',
            params: {
              id: res.data.id
            }
          }).href
          copy(sharePikPakUrl.value + (sharePikPakPassword.value ? (' 提取密码  ' + sharePikPakPassword.value) : ''))
        }).catch(res => {
          window.$message.error(res.response.error || '出错了')
        })
        .finally(() => {
          sharePikPakPostLoading.value = false
          showSharePikPak.value = false
        })
      })
  }
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
.list-page-files .n-data-table-td .n-space .n-text{
  font-size: 12px;
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
