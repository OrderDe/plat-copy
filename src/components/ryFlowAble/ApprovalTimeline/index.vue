<template>
  <div v-loading="loading">
    <el-timeline v-if="approveNodes && approveNodes.length" class="approval-timeline">
      <!-- 遍历每个审批节点 -->
      <el-timeline-item
        v-for="(activity, index) in approveNodes"
        :key="index"
        size="large"
        :color="getApprovalNodeColor(activity.status)"
      >
        <template slot="icon">
          <i
            v-if="getApprovalNodeIcon(activity.status, activity.nodeType)"
            :class="getApprovalNodeIcon(activity.status, activity.nodeType)"
            :style="{ color: getApprovalNodeColor(activity.status), fontSize: '20px' }"
          />
        </template>
        <div class="approval-node-content">
          <div class="approval-node-name">{{ activity.name }}</div>
          <div class="approval-users">
            <!-- 情况一：遍历每个审批节点下的【进行中】task 任务 -->
            <div v-for="(task, idx) in activity.tasks" :key="idx" class="approval-user-item">
              <div class="approval-user-wrapper">
                <div class="approval-avatar-wrapper" v-if="task.assigneeUser || task.ownerUser">
                  <!-- 信息：头像 -->
                  <el-avatar
                    :size="36"
                    v-if="task.assigneeUser && task.assigneeUser.avatar"
                    :src="task.assigneeUser.avatar"
                  />
                  <el-avatar v-else-if="task.assigneeUser && task.assigneeUser.nickname">
                    {{ task.assigneeUser.nickname.substring(0, 1) }}
                  </el-avatar>
                  <el-avatar
                    v-else-if="task.ownerUser && task.ownerUser.avatar"
                    :src="task.ownerUser.avatar"
                  />
                  <el-avatar v-else-if="task.ownerUser && task.ownerUser.nickname">
                    {{ task.ownerUser.nickname.substring(0, 1) }}
                  </el-avatar>
                  <!-- 信息：任务 ICON -->
                  <div class="approval-status-icon">
                    <i
                      :class="getTaskStatusIcon(task.status)"
                      :style="{ color: getTaskStatusColor(task.status), fontSize: '12px' }"
                    />
                  </div>
                </div>
                <div class="approval-user-info">
                  <!-- 信息：昵称 -->
                  <div
                    v-if="task.assigneeUser && task.assigneeUser.nickname"
                    class="approval-user-name"
                  >
                    {{ task.assigneeUser.nickname }}
                  </div>
                  <div
                    v-else-if="task.ownerUser && task.ownerUser.nickname"
                    class="approval-user-name"
                  >
                    {{ task.ownerUser.nickname }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 情况二：遍历每个审批节点下的【候选的】task 任务。例如说，1）依次审批，2）未来的审批任务等 -->
            <div
              v-for="(user, idx1) in activity.candidateUserList"
              :key="'candidate-' + idx1"
              class="approval-user-item"
            >
              <div class="approval-user-wrapper">
                <div class="approval-avatar-wrapper">
                  <!-- 信息：头像 -->
                  <el-avatar :size="36" v-if="user.avatar" :src="user.avatar" />
                  <el-avatar v-else-if="user.nickname">
                    {{ user.nickname.substring(0, 1) }}
                  </el-avatar>
                  <!-- 信息：任务 ICON -->
                  <div class="approval-status-icon">
                    <i
                      :class="getTaskStatusIcon('-1')"
                      :style="{ color: getTaskStatusColor('-1'), fontSize: '12px' }"
                    />
                  </div>
                </div>
                <div class="approval-user-info">
                  <!-- 信息：昵称 -->
                  <div v-if="user.nickname" class="approval-user-name">
                    {{ user.nickname }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 审批意见和时间信息 -->
          <div class="approval-details">
          <!-- 审批意见：遍历所有任务，直接渲染 reason，支持换行 -->
          <template v-for="(task, idx) in activity.tasks">
            <div v-if="task.reason" :key="'comment-' + idx" class="approval-comment">
              {{ formatComment(task.reason) }}
            </div>
          </template>
            <!-- 时间 -->
            <div
              v-if="activity.status !== taskStatusEnum.NOT_START"
              class="approval-time"
            >
              {{ getApprovalNodeTime(activity) }}
            </div>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无审批记录" />
  </div>
</template>

<script>
import { getApprovalDetail } from '@/api/ryFlowAble/activiti/process'
import { parseTime } from '@/utils/ruoyi'

// 任务状态枚举
const TaskStatusEnum = {
  NOT_START: -1, // 未开始
  PENDING: 0, // 待审批
  IN_PROGRESS: 1, // 审批中
  APPROVED: 2, // 审批通过
  REJECTED: 3, // 审批不通过
  CANCELLED: 4, // 取消
  REJECTED_BACK: 5, // 回退
  DELEGATED: 6, // 委派中
  APPROVING: 7 // 审批通过中
}

// 节点类型枚举
const NodeType = {
  START_USER_NODE: 'START_USER_NODE',
  USER_TASK_NODE: 'USER_TASK_NODE'
}

export default {
  name: 'ApprovalTimeline',
  props: {
    processInstanceId: {
      type: String,
      default: ''
    },
    processDefinitionId: {
      type: String,
      default: ''
    },
    // 保留 timeline prop 以兼容旧用法
    timeline: {
      type: Array,
      default: () => null
    }
  },
  data() {
    return {
      loading: false,
      fetching: false, // 防止重复请求
      approveNodes: [], // 审批节点列表
      taskStatusEnum: TaskStatusEnum,
      // 状态图标映射（用于头像上的小图标）
      statusIconMap2: {
        // 未开始
        '-1': { color: '#e5e7ec', icon: 'el-icon-time' },
        // 待审批
        '0': { color: '#e5e7ec', icon: 'el-icon-loading' },
        // 审批中
        '1': { color: '#448ef7', icon: 'el-icon-loading' },
        // 审批通过
        '2': { color: '#00b32a', icon: 'el-icon-check' },
        // 审批不通过
        '3': { color: '#f46b6c', icon: 'el-icon-close' },
        // 取消
        '4': { color: '#cccccc', icon: 'el-icon-delete' },
        // 回退
        '5': { color: '#f46b6c', icon: 'el-icon-minus' },
        // 委派中
        '6': { color: '#448ef7', icon: 'el-icon-loading' },
        // 审批通过中
        '7': { color: '#00b32a', icon: 'el-icon-check' }
      },
      // 状态图标映射（用于时间线节点图标）
      statusIconMap: {
        // 审批未开始
        '-1': { color: '#e5e7ec', icon: 'el-icon-time' },
        '0': { color: '#e5e7ec', icon: 'el-icon-time' },
        // 审批中
        '1': { color: '#448ef7', icon: 'el-icon-loading' },
        // 审批通过
        '2': { color: '#00b32a', icon: 'el-icon-check' },
        // 审批不通过
        '3': { color: '#f46b6c', icon: 'el-icon-close' },
        // 已取消
        '4': { color: '#cccccc', icon: 'el-icon-delete' },
        // 回退
        '5': { color: '#f46b6c', icon: 'el-icon-minus' },
        // 委派中
        '6': { color: '#448ef7', icon: 'el-icon-loading' },
        // 审批通过中
        '7': { color: '#00b32a', icon: 'el-icon-check' }
      }
    }
  },
  watch: {
    // 监听两个属性的组合变化
    processInstanceId() {
      if (this.processInstanceId && this.processDefinitionId) {
        this.getApprovalDetail()
      }
    },
    processDefinitionId() {
      if (this.processInstanceId && this.processDefinitionId) {
        this.getApprovalDetail()
      }
    }
  },
  mounted() {
    // 组件挂载后，如果两个 ID 都已存在，立即获取数据
    if (this.processInstanceId && this.processDefinitionId) {
      this.getApprovalDetail()
    } else if (this.timeline) {
      // 兼容旧用法：如果传入了 timeline，转换为 approveNodes 格式
      this.approveNodes = this.convertTimelineToApproveNodes(this.timeline)
    }
  },
  methods: {
    /** 获得审批详情 */
    async getApprovalDetail() {
      if (!this.processInstanceId || !this.processDefinitionId) {
        return
      }

      // 如果正在请求中，避免重复请求
      if (this.fetching) {
        return
      }

      this.fetching = true
      this.loading = true
      try {
        const response = await getApprovalDetail({
          processInstanceId: this.processInstanceId,
          processDefinitionId: this.processDefinitionId
        })

        const data = (response && response.data) || {}
        this.approveNodes = data.approvalNodeInfoList || []
      } catch (error) {
        console.error('获取审批时间线失败:', error)
        this.$message && this.$message.error('获取审批时间线失败')
        this.approveNodes = []
      } finally {
        this.loading = false
        this.fetching = false
      }
    },
    /** 获得审批节点图标 */
    getApprovalNodeIcon(taskStatus, nodeType) {
      if (taskStatus == TaskStatusEnum.NOT_START) {
        const status = this.statusIconMap[taskStatus]
        return status ? status.icon : null
      }
      if (nodeType === NodeType.START_USER_NODE || nodeType === NodeType.USER_TASK_NODE) {
        const status = this.statusIconMap[taskStatus]
        return status ? status.icon : null
      }
      return null
    },
    /** 获得审批节点颜色 */
    getApprovalNodeColor(taskStatus) {
      const status = this.statusIconMap[taskStatus]
      return status ? status.color : null
    },
    /** 获得任务状态图标（用于头像上的小图标） */
    getTaskStatusIcon(status) {
      const statusInfo = this.statusIconMap2[String(status)]
      return statusInfo ? statusInfo.icon : ''
    },
    /** 获得任务状态颜色（用于头像上的小图标） */
    getTaskStatusColor(status) {
      const statusInfo = this.statusIconMap2[String(status)]
      return statusInfo ? statusInfo.color : ''
    },
    /** 获得审批节点时间 */
    getApprovalNodeTime(node) {
      if (node.endTime) {
        return `结束时间：${parseTime(node.endTime, '{y}-{m}-{d} {h}:{i}:{s}')}`
      }
      if (node.startTime) {
        return `创建时间：${parseTime(node.startTime, '{y}-{m}-{d} {h}:{i}:{s}')}`
      }
      return ''
    },
    /** 重新刷新审批详情 */
    refresh() {
      this.getApprovalDetail()
    },
    /** 兼容旧用法：将 timeline 格式转换为 approveNodes 格式 */
    convertTimelineToApproveNodes(timeline) {
      if (!Array.isArray(timeline)) return []
      return timeline.map(item => ({
        name: item.nodeName || '',
        status: item.type === 'success' ? 2 : item.type === 'primary' ? 1 : -1,
        tasks: item.assignee ? [{
          assigneeUser: { nickname: item.assignee },
          reason: item.comment || '',
          status: item.type === 'success' ? 2 : item.type === 'primary' ? 1 : 0
        }] : [],
        candidateUserList: [],
        startTime: item.time || null,
        endTime: item.time || null
      }))
    },
    /** 格式化评论：将字符串中的 \\n 转换为实际换行 */
    formatComment(reason) {
      if (!reason) return ''
      return String(reason).replace(/\\n/g, '\n')
    }
  }
}
</script>

<style scoped>
.approval-timeline {
  padding-top: 20px;
}

/* 确保时间线内容区域对齐 */
.approval-timeline >>> .el-timeline-item__content {
  padding-left: 0;
}

.approval-node-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.approval-node-name {
  font-weight: bold;
  margin-bottom: 8px;
  width: 100%;
  height: 24px; /* 固定高度，确保不同节点名称区域高度一致 */
  display: flex;
  align-items: center;
  line-height: 24px;
  flex-shrink: 0; /* 防止收缩 */
  overflow: hidden; /* 防止内容溢出影响布局 */
  text-overflow: ellipsis; /* 文本溢出显示省略号 */
  white-space: nowrap; /* 防止换行 */
}

.approval-users {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 8px;
  margin-left: 0;
  width: 100%;
  padding-left: 0;
  padding-top: 0;
  height: 58px; /* 固定高度：头像36px + 间距4px + 名称18px = 58px，确保所有节点用户信息区域高度完全一致 */
  flex-shrink: 0; /* 防止收缩 */
  align-content: flex-start; /* 顶部对齐，确保内容从同一位置开始 */
  position: relative; /* 添加相对定位，方便子元素对齐 */
}

.approval-user-item {
  display: inline-flex; /* 改为 inline-flex，确保水平排列 */
  align-items: flex-start; /* 顶部对齐 */
  margin-right: 16px; /* 增加右边距 */
  margin-bottom: 0;
  vertical-align: top; /* 顶部对齐 */
  height: 58px; /* 固定高度，与父容器一致 */
}

.approval-user-wrapper {
  display: flex;
  align-items: flex-start; /* 改为 flex-start，确保顶部对齐 */
  flex-direction: column;
  padding-right: 8px;
  width: auto;
  height: 100%; /* 占满父容器高度 */
  justify-content: flex-start; /* 顶部对齐 */
}

.approval-avatar-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center; /* 居中对齐 */
  width: 36px; /* 固定宽度，确保头像位置一致 */
  height: 36px; /* 固定高度，确保头像位置一致 */
  flex-shrink: 0; /* 防止收缩 */
  margin-bottom: 0; /* 确保没有额外的底部间距 */
  margin-top: 0; /* 确保从顶部开始 */
}

.approval-status-icon {
  position: absolute;
  top: 26px;
  left: 26px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  padding: 2px;
}

.approval-user-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 8px; /* 固定间距：头像36px + 间距4px = 40px，确保名称从40px位置开始 */
  align-items: flex-start; /* 改为左对齐，确保名称左对齐 */
  width: 100%;
  min-width: 60px; /* 设置最小宽度，确保对齐 */
  flex-shrink: 0; /* 防止收缩 */
}

.approval-user-name {
  font-size: 12px;
  text-align: left; /* 文本左对齐 */
  margin-top: 0; /* 移除顶部间距 */
  white-space: nowrap; /* 防止换行 */
  height: 18px; /* 固定高度，确保名称位置一致 */
  line-height: 18px; /* 设置行高 */
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 内容左对齐 */
  flex-shrink: 0; /* 防止收缩 */
  width: 100%; /* 占满父容器宽度，确保左对齐生效 */
}

/* 审批详情区域（审批意见和时间） */
.approval-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-top: 8px;
  gap: 4px; /* 审批意见和时间之间的间距 */
  min-height: 20px; /* 最小高度，确保即使没有内容也有占位 */
}

.approval-comment {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  word-break: break-word; /* 允许换行 */
  white-space: pre-line; /* 支持 \n 换行 */
  width: 100%;
  margin-top: 0;
  padding: 4px 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.approval-time {
  color: #a5a5a5;
  font-size: 13px;
  margin-top: 0;
  height: 20px; /* 固定高度，确保时间位置一致 */
  line-height: 20px;
  display: flex;
  align-items: center;
  flex-shrink: 0; /* 防止收缩 */
}
</style>
