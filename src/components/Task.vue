<template>
  <div class="container">
    <div class="content " :class="{hide: hide}">
      <div class="status-bar" @click="hide = !hide">
        <div class="status-bar-wrapper">
          {{hasTask}}项保存中
        </div>
      </div>
      <div class="task-list">
        <n-scrollbar style="max-height: 400px;">
          <template v-for="(item, key) in filesList" :key="item.id">
            <div class="task">
              <div class="task-info">
                <div class="task-file-icon">
                  <img :src="item.icon_link" />
                </div>
                <div class="task-info-wrapper">
                  <div class="task-file-name">
                    <n-ellipsis :tooltip="{width: 'trigger'}">
                      {{item.file_name}}
                    </n-ellipsis>
                  </div>
                  <div class="task-desc-wrapper">
                    <div class="task-desc">
                      {{ byteConvert(item.file_size) }}
                    </div>
                    <div class="task-dot"></div>
                    <div class="task-desc">
                      {{item.message}}
                    </div>
                  </div>
                </div>
                <div class="task-progress" style="width: 60px; margin-right: 6px;">
                  <n-progress type="line" :percentage="item.progress" processing indicator-placement="inside"></n-progress>
                </div>
                <n-popconfirm @positive-click="deleteTask(key)" placement="right">
                  <template #trigger>
                    <n-icon color="#306eff">
                      <circle-x></circle-x>
                    </n-icon>
                  </template>
                  确定删除？
                </n-popconfirm>
              </div>
            </div>
          </template>
        </n-scrollbar>
      </div>
      <p class="bottom" v-if="!hide" @click="hide = true">收起</p>
    </div> 
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity';
import { onBeforeUnmount, onMounted, onUnmounted } from '@vue/runtime-core'
import http from '../utils/axios'
import { NEllipsis, NScrollbar, NProgress, NIcon, NPopconfirm } from 'naive-ui'
import { byteConvert } from '../utils'
import { CircleX } from '@vicons/tabler'
  const filesList = ref()
  const loading = ref(false)
  const hasTask = ref(0)
  const timeOut = ref()
  const hide = ref(true)
  const getTask = () => {
    // {"id":{"in":"VMmlkQ3qc5fkx0UOGOIgBYmxo1,VMmljjKKc5fkx0UOGOIgBY2uo1"}}
    http.get('https://api-drive.mypikpak.com/drive/v1/tasks', {
      params: {
        type: 'offline',
        page_token: '',
        filters: {},
        thumbnail_size: 'SIZE_LARGE',
        with: 'reference_resource'
      }
    })
      .then((res:any) => {
        const {tasks} = res.data
        hasTask.value = 0
        timeOut.value && clearTimeout(timeOut.value)
        for(let i in tasks) {
          if(tasks[i].progress < 100) {
            hasTask.value++
          }
        }
        filesList.value = tasks
        if(hasTask.value) {
          timeOut.value = setTimeout(() => {
            getTask()
          }, 60000)
        }
      })
  }
  const deleteTask = (key:number) => {
    http.delete('https://api-drive.mypikpak.com/drive/v1/tasks', {
      params: {
        task_ids: filesList.value[key].id,
        _t: new Date().getTime()
      }
    })
      .then(() => {
        hasTask.value--
        filesList.value.splice(key, 1)
      })
  }
  onMounted(getTask)
  onUnmounted(() => {
    timeOut.value && clearTimeout(timeOut.value)
  })
  defineExpose({
    getTask
  })
</script>

<style>
.container {
  position: fixed;
  width: 375px;
  right: 32px;
  bottom: 28px;
}
@media(max-width: 968px) {
  .container {
    width: 100%;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.container *,
.container *::before,
.container *::after {
  box-sizing: border-box;
}
.container p {
  margin-top: 0;
  margin-bottom: 0;
  margin-left: 0;
  margin-right: 0;
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 0;
  padding-right: 0;
  border: 0;
  font-size: 100%;
  font-family: inherit;
  vertical-align: baseline;
}
.content {
  width: 100%;
  max-height: 530px;
  min-height: 54px;
  background: #fff;
  box-shadow: 0 0 1px 1px rgba(28, 28, 32, 0.05),
    0 8px 24px rgba(28, 28, 32, 0.12);
  border-radius: 5px;
  transition: max-height 0.66s cubic-bezier(0.66, 0, 0.01, 1);
  overflow: hidden;
}
.content.hide {
  max-height: 54px;
}
.bottom {
  cursor: pointer;
  position: absolute;
  width: 100%;
  height: 30px;
  left: 0;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  bottom: 0;
  border-radius: 0 0 5px 5px;
  background: #fff;
  box-shadow: 0 -8px 8px #fff;
  transition: color 0.3s ease;
}
.bottom:hover {
  color: #306eff;
}
.status-bar {
  height: 54px;
  position: relative;
  z-index: 1;
  background: #fff;
}
.status-bar .status-bar-wrapper:last-child {
  display: flex;
}
.status-bar .status-bar-wrapper {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  align-items: center;
  padding-left: 22px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  background-color: #fff;
  font-size: 14px;
}
.status-bar .status-bar-wrapper:hover {
  background-color: #84858d14;
}
.task-list {
  overflow: auto;
  max-height: 464px;
  padding-bottom: 30px;
  font-size: 14px;
  line-height: 1;
  border-radius: 0 0 5px 5px;
  margin: 0;
  background: #fff;
  box-sizing: border-box;
}
.task-list::before {
  display: block;
  position: sticky;
  content: "";
  height: 1px;
  top: 0;
  background: rgba(132, 133, 141, 0.08);
}
.task-list::after {
  display: block;
  position: absolute;
  content: "";
  height: 1px;
  top: 0;
  width: 100%;
  z-index: 2;
  background: #fff;
}
.task {
  width: 100%;
  height: 64px;
  padding: 14px 18px 14px 16px;
  position: relative;
  box-sizing: border-box;
}
.task .task-desc-wrapper {
  display: flex;
  align-items: center;
}
.task .task-file-icon {
  margin-right: 16px;
}
.task .task-file-icon img {
  width: 36px;
  height: 36px;
}
.task .task-info {
  position: relative;
  display: flex;
  align-items: center;
}
.task .task-info-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 0;
  margin-right: 20px;
}
.task .task-file-name {
  font-size: 14px;
  line-height: 1.5;
  display: inline-block;
  color: rgb(37, 38, 43);
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.task .task-desc {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(37, 38, 43, 0.36);
  display: flex;
  align-items: center;
}
.task .task-dot {
  display: inline-block;
  padding: 0 7px;
  align-items: center;
}
.task .task-dot::before {
  content: "";
  display: block;
  width: 2px;
  height: 2px;
  background: rgba(37, 38, 43, 0.36);
}
.task .action-icon {
  visibility: hidden;
}
.task :hover .action-icon {
  visibility: visible;
}
.task-list-end {
  display: flex;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(37, 38, 43, 0.36);
  justify-content: center;
  padding-top: 8px;
}
.n-popover {
  word-break: break-all;
}
</style>