<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="流程名称" prop="processName">
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">

      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="流程实例ID" align="center" key="processInstanceId" prop="processInstanceId" v-if="columns[0].visible" :show-overflow-tooltip="true" />
      <el-table-column label="流程名称" align="center" key="processName" prop="processName" v-if="columns[1].visible" :show-overflow-tooltip="true" />
      <el-table-column label="发起人" align="center" key="startUser" prop="startUser" v-if="columns[2].visible" :show-overflow-tooltip="true" />
      <el-table-column label="开始时间" align="center" key="startTime" prop="startTime" v-if="columns[3].visible" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束时间" align="center" key="endTime" prop="endTime" v-if="columns[4].visible" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" key="leaveStatus" prop="leaveStatus" v-if="columns[5].visible">
        <template slot-scope="scope">
          <el-tag :type="getStatusTagType(scope.row.leaveStatus)" :effect="getStatusTagEffect(scope.row.leaveStatus)">
            {{ getStatusLabel(scope.row.leaveStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 详情抽屉：右侧弹出，包含三个选项卡 -->
    <el-drawer
      title="流程详情"
      :visible.sync="detailVisible"
      direction="rtl"
      size="50%"
      append-to-body>
      <div v-loading="detailLoading">
      <el-tabs v-model="activeDetailTab" @tab-click="onDetailTabClick">
        <el-tab-pane label="表单数据" name="form">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="申请人">{{ detailFormData.userName }}</el-descriptions-item>
            <el-descriptions-item label="流程实例ID">{{ detailFormData.processInstanceId }}</el-descriptions-item>
            <el-descriptions-item label="请假类型">
              {{ getLeaveTypeLabel(detailFormData.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="请假天数">{{ detailFormData.days }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ parseTime(detailFormData.start, '{y}-{m}-{d}') }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ parseTime(detailFormData.end, '{y}-{m}-{d}') }}</el-descriptions-item>
            <el-descriptions-item label="请假理由" :span="2">{{ detailFormData.reason }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="审批时间线" name="timeline">
          <approval-timeline 
            :process-instance-id="detailFormData.processInstanceId"
            :process-definition-id="detailFormData.processDefinitionId" />
        </el-tab-pane>
        <el-tab-pane label="运行轨迹（高光）" name="trace">
          <process-trace
            :process-instance-id="detailFormData.processInstanceId"
            :process-definition-id="detailFormData.processDefinitionId" />
        </el-tab-pane>
      </el-tabs>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { pageMyCopyTasks, getLeave } from '@/api/ryFlowAble/activiti/leave'
import ApprovalTimeline from '@/components/ryFlowAble/ApprovalTimeline/index.vue'
import ProcessTrace from '@/components/ryFlowAble/ProcessTrace/index.vue'

export default {
  name: 'MyCopyTasks',
  components: { ApprovalTimeline, ProcessTrace },
  data() {
    return {
      // 请假类型选项
      leaveTypeOptions: [
        // { label: '事假', value: '0' },
        // { label: '病假', value: '1' },
        // { label: '婚假', value: '2' },
        // { label: '探亲', value: '3' },
        // { label: '年假', value: '4' },
        // { label: '其他', value: '5' }
      ],
      // 请假状态选项
      leaveStatusOptions: [
        // { label: '待审批', value: '0' },
        // { label: '审批中', value: '1' },
        // { label: '已通过', value: '2' },
        // { label: '已拒绝', value: '3' },
        // { label: '已取消', value: '4' }
      ],
      loading: false,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      taskList: [],
      queryParams: {
        modelKey: "Process_1096",
        pageNum: 1,
        pageSize: 10,
        processName: undefined
      },
      columns: [
        { key: 0, label: '流程实例ID', visible: true },
        { key: 1, label: '流程名称', visible: true },
        { key: 2, label: '发起人', visible: true },
        { key: 3, label: '开始时间', visible: true },
        { key: 4, label: '结束时间', visible: true },
        { key: 5, label: '状态', visible: true }
      ],
      // 详情抽屉 & 数据
      detailVisible: false,
      detailLoading: false,
      activeDetailTab: 'form',
      detailFormData: {
        id: null,
        userName: '',
        processInstanceId: '',
        processDefinitionId: '',
        type: null,
        days: 0,
        reason: '',
        start: null,
        end: null
      },
      detailTimeline: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      pageMyCopyTasks(params).then(response => {
        // 根据实际返回结构处理数据
        if (response && response.code === 200) {
          this.taskList = response.list || []
          this.total = response.total || 0
        } else {
          this.taskList = []
          this.total = 0
        }
      }).catch(() => {
        this.taskList = []
        this.total = 0
      }).finally(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.processInstanceId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleView(row) {
      // 使用 leaveId 打开详情抽屉
      this.openDetail(row)
    },
    /** 打开流程详情（使用 getLeave 获取数据） */
    openDetail(row) {
      // 打开抽屉并切换到表单页签
      this.activeDetailTab = 'form'
      this.detailVisible = true
      this.detailLoading = true

      // 通过接口获取详情数据，使用 leaveId
      const leaveId = row.leaveId
      if (!leaveId) {
        this.$message && this.$message.warning('缺少请假ID')
        this.detailLoading = false
        return
      }

      getLeave(leaveId).then(async (response) => {
        const data = (response && response.data) || {}
        this.detailFormData = {
          id: data.id,
          userName: data.userName || row.startUser,
          processInstanceId: data.processInstanceId || row.processInstanceId,
          processDefinitionId: data.processDefinitionId || row.processDefinitionId,
          type: data.type,
          days: data.days,
          reason: data.reason,
          start: data.start,
          end: data.end
        }

        // 审批时间线（使用后端返回的 approvalNodeInfoList 构建）
        this.detailTimeline = this.buildTimelineFromApproval(data.approvalNodeInfoList || [])
      }).catch(error => {
        console.error('获取详情失败:', error)
        this.$message && this.$message.error('获取详情失败')
      }).finally(() => {
        this.detailLoading = false
      })
    },
    /** 选项卡点击 */
    onDetailTabClick(tab) {
      // trace 标签的加载由 ProcessTrace 组件自动处理
    },
    /** 将后端返回的 approvalNodeInfoList 构造成时间线渲染所需结构 */
    buildTimelineFromApproval(approvalList) {
      if (!Array.isArray(approvalList)) return []
      return approvalList.map(node => {
        const tasks = Array.isArray(node.tasks) ? node.tasks : []
        const assignees = tasks
          .map(t => (t && t.assigneeUser && t.assigneeUser.nickname) || '')
          .filter(Boolean)
          .join('、')
        const firstTask = tasks[0] || {}
        const timeRaw = node.endTime || node.startTime
        const time = timeRaw ? (this.parseTime ? this.parseTime(timeRaw, '{y}-{m}-{d} {h}:{i}:{s}') : timeRaw) : ''
        const status = Number(node.status)
        const action = status === 2 ? '已完成' : status === 1 ? '处理中' : '待处理'
        const type = status === 2 ? 'success' : status === 1 ? 'primary' : 'info'
        return {
          time,
          nodeName: node.name,
          assignee: assignees,
          action,
          comment: firstTask.reason || '',
          type,
          color: ''
        }
      })
    },
    /** 获取状态标签文本 */
    getStatusLabel(status) {
      const statusOption = this.leaveStatusOptions.find(item => item.value === String(status))
      return statusOption ? statusOption.label : status || ''
    },
    /** 获取请假类型标签文本 */
    getLeaveTypeLabel(type) {
      const typeOption = this.leaveTypeOptions.find(item => item.value === String(type))
      return typeOption ? typeOption.label : type || ''
    },
    /** 获取状态标签类型（颜色） */
    getStatusTagType(status) {
      const statusNum = Number(status)
      // 根据状态值返回不同的颜色类型
      // 0: 待审批 - info (灰色)
      // 1: 审批中 - warning (橙色)
      // 2: 已通过 - success (绿色)
      // 3: 已拒绝 - danger (红色)
      // 4: 已取消 - info (灰色)
      // 其他: info (灰色)
      if (statusNum === 0) {
        return 'info'
      } else if (statusNum === 1) {
        return 'warning'
      } else if (statusNum === 2) {
        return 'success'
      } else if (statusNum === 3) {
        return 'danger'
      } else if (statusNum === 4) {
        return 'info'
      }
      return 'info'
    },
    /** 获取状态标签效果 */
    getStatusTagEffect(status) {
      const statusNum = Number(status)
      // 重要状态使用 dark 效果，其他使用 plain
      if (statusNum === 2 || statusNum === 3) {
        return 'dark'
      }
      return 'plain'
    },
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
