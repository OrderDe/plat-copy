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
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="mini"
          :disabled="single"
          @click="handleApprove"
        >通过</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-close"
          size="mini"
          :disabled="single"
          @click="handleReject"
        >拒绝</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-share"
          size="mini"
          :disabled="single"
          @click="handleDelegate"
        >委派</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-right"
          size="mini"
          :disabled="single"
          @click="handleTransfer"
        >转交</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-back"
          size="mini"
          :disabled="single"
          @click="handleRejectBack"
        >驳回</el-button>
      </el-col>

      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="任务ID" align="center" key="taskId" prop="taskId" v-if="columns[0].visible" :show-overflow-tooltip="true" />
      <el-table-column label="流程名称" align="center" key="processName" prop="processName" v-if="columns[1].visible" :show-overflow-tooltip="true" />
      <el-table-column label="任务名称" align="center" key="taskName" prop="taskName" v-if="columns[2].visible" :show-overflow-tooltip="true" />
      <el-table-column label="发起人" align="center" key="startUser" prop="startUser" v-if="columns[3].visible" :show-overflow-tooltip="true" />
      <el-table-column label="到达时间" align="center" key="createTime" prop="createTime" v-if="columns[4].visible" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="委派状态" align="center" key="delegationState" prop="delegationState">
        <template slot-scope="scope">
          <span>{{ renderDelegation(scope.row.delegationState) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">详情</el-button>
          <el-button
            v-if="scope.row.delegationState === 'PENDING'"
            size="mini"
            type="text"
            icon="el-icon-finished"
            @click="handleResolveDelegate(scope.row)"
          >审查</el-button>
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

    <!-- 审批对话框 -->
    <el-dialog :title="approveDialogTitle" :visible.sync="approveDialogVisible" width="500px" append-to-body>
      <el-form ref="approveForm" :model="approveForm" :rules="approveRules" label-width="100px">
        <el-form-item label="审批意见" prop="comment">
          <el-input
            v-model="approveForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="approveDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="approveLoading" @click="submitApprove">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 委派对话框 -->
    <el-dialog title="委派任务" :visible.sync="delegateDialogVisible" width="500px" append-to-body>
      <el-form ref="delegateFormRef" :model="delegateForm" :rules="delegateRules" label-width="100px">
        <el-form-item label="委派给" prop="assignee">
          <el-select v-model="delegateForm.assignee" placeholder="请选择委派人" clearable filterable>
            <el-option
              v-for="candidate in candidateOptions"
              :key="candidate.value"
              :label="candidate.label"
              :value="candidate.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="委派原因" prop="comment">
          <el-input
            v-model="delegateForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入委派原因（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="delegateDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="delegateLoading" @click="submitDelegate">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 完成委派（审查）对话框 -->
    <el-dialog title="委派审查" :visible.sync="resolveDialogVisible" width="500px" append-to-body>
      <el-form ref="resolveFormRef" :model="resolveForm" label-width="100px">
        <el-form-item label="审查意见">
          <el-input
            v-model="resolveForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审查意见（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="resolveDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="resolveLoading" @click="submitResolve">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 转交对话框 -->
    <el-dialog title="转交任务" :visible.sync="transferDialogVisible" width="500px" append-to-body>
      <el-form ref="transferForm" :model="transferForm" :rules="transferRules" label-width="100px">
        <el-form-item label="转交给" prop="assignee">
          <el-select v-model="transferForm.assignee" placeholder="请选择转交人" clearable filterable>
            <el-option
              v-for="candidate in candidateOptions"
              :key="candidate.value"
              :label="candidate.label"
              :value="candidate.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="转交原因" prop="comment">
          <el-input
            v-model="transferForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入转交原因（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="transferDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="transferLoading" @click="submitTransfer">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 驳回对话框 -->
    <el-dialog title="驳回任务" :visible.sync="rejectBackDialogVisible" width="500px" append-to-body>
      <el-form ref="rejectBackFormRef" :model="rejectBackForm" :rules="rejectBackRules" label-width="100px">
        <el-form-item label="驳回到" prop="targetActivityId">
          <el-select 
            v-model="rejectBackForm.targetActivityId" 
            placeholder="请选择驳回节点" 
            clearable 
            filterable
            :loading="rejectBackNodesLoading"
            @focus="loadRejectBackNodes"
          >
            <el-option
              v-for="node in rejectBackNodes"
              :key="node.activityId"
              :label="node.activityName"
              :value="node.activityId">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="驳回原因" prop="comment">
          <el-input
            v-model="rejectBackForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rejectBackDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="rejectBackLoading" @click="submitRejectBack">确 定</el-button>
      </div>
    </el-dialog>
  </div>
  
</template>

<script>
import { pageMyTodoTasks, getLeave, approve, reject, transfer, delegateTask, resolveDelegateTask, getRejectBackNodes, rejectBack } from '@/api/ryFlowAble/activiti/leave'
import ApprovalTimeline from '@/components/ryFlowAble/ApprovalTimeline/index.vue'
import ProcessTrace from '@/components/ryFlowAble/ProcessTrace/index.vue'

export default {
  name: 'MyTodoTasks',
  components: { ApprovalTimeline, ProcessTrace },
  data() {
    return {
      // 请假类型选项（数据来源于字典或接口）
      leaveTypeOptions: [],
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
        { key: 0, label: '任务ID', visible: true },
        { key: 1, label: '流程名称', visible: true },
        { key: 2, label: '任务名称', visible: true },
        { key: 3, label: '发起人', visible: true },
        { key: 4, label: '到达时间', visible: true }
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
      detailTimeline: [],
      // 选中的任务
      selectedTasks: [],
      // 审批对话框
      approveDialogVisible: false,
      approveDialogTitle: '审批',
      approveLoading: false,
      approveForm: {
        taskId: '',
        leaveId: '',
        comment: '',
        action: '' // 'approve' 或 'reject'
      },
      approveRules: {
        comment: [
          { required: true, message: '请输入审批意见', trigger: 'blur' }
        ]
      },
      // 委派对话框
      delegateDialogVisible: false,
      delegateLoading: false,
      delegateForm: {
        taskId: '',
        leaveId: '',
        assignee: '',
        comment: ''
      },
      delegateRules: {
        assignee: [
          { required: true, message: '请选择委派人', trigger: 'change' }
        ]
      },
      // 完成委派
      resolveDialogVisible: false,
      resolveLoading: false,
      resolveForm: {
        taskId: '',
        leaveId: '',
        comment: ''
      },
      // 转交对话框
      transferDialogVisible: false,
      transferLoading: false,
      transferForm: {
        taskId: '',
        leaveId: '',
        assignee: '',
        comment: ''
      },
      transferRules: {
        assignee: [
          { required: true, message: '请选择转交人', trigger: 'change' }
        ]
      },
      // 候选人选项（用于委派/转交选择）
      candidateOptions: [
        { label: '小若', value: 'ruo' },
        { label: '小依', value: 'yi' },
        { label: '若依', value: 'ry' },
        { label: '管理员', value: 'admin' }
      ],
      // 驳回对话框
      rejectBackDialogVisible: false,
      rejectBackLoading: false,
      rejectBackNodesLoading: false,
      rejectBackNodes: [],
      rejectBackForm: {
        taskId: '',
        leaveId: '',
        targetActivityId: '',
        comment: ''
      },
      rejectBackRules: {
        targetActivityId: [
          { required: true, message: '请选择驳回节点', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 获取请假类型标签文本 */
    getLeaveTypeLabel(type) {
      const typeOption = this.leaveTypeOptions.find(item => item.value === String(type))
      return typeOption ? typeOption.label : type || ''
    },
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      pageMyTodoTasks(params).then(response => {
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
      this.ids = selection.map(item => item.taskId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
      // 保存选中的任务信息，用于审批
      this.selectedTasks = selection
    },
    renderDelegation(state) {
      if (!state) return ''
      if (state === 'PENDING') return '委派中'
      if (state === 'RESOLVED') return '已审查'
      return state
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
          processDefinitionId: data.processDefinitionId,
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
    /** 通过按钮操作 */
    handleApprove() {
      if (this.single) {
        this.$message.warning('请选择一条待办任务')
        return
      }
      if (this.selectedTasks.length === 0) {
        this.$message.warning('请选择待办任务')
        return
      }
      // 只处理第一个选中的任务
      const task = this.selectedTasks[0]
      this.approveForm.taskId = task.taskId
      this.approveForm.leaveId = task.leaveId
      this.approveForm.action = 'approve'
      this.approveForm.comment = ''
      this.approveDialogTitle = '审批通过'
      this.approveDialogVisible = true
      this.$nextTick(() => {
        this.$refs.approveForm && this.$refs.approveForm.clearValidate()
      })
    },
    /** 拒绝按钮操作 */
    handleReject() {
      if (this.single) {
        this.$message.warning('请选择一条待办任务')
        return
      }
      if (this.selectedTasks.length === 0) {
        this.$message.warning('请选择待办任务')
        return
      }
      // 只处理第一个选中的任务
      const task = this.selectedTasks[0]
      this.approveForm.taskId = task.taskId
      this.approveForm.leaveId = task.leaveId
      this.approveForm.action = 'reject'
      this.approveForm.comment = ''
      this.approveDialogTitle = '审批拒绝'
      this.approveDialogVisible = true
      this.$nextTick(() => {
        this.$refs.approveForm && this.$refs.approveForm.clearValidate()
      })
    },
    /** 委派按钮操作 */
    handleDelegate() {
      if (this.single) {
        this.$message.warning('请选择一条待办任务')
        return
      }
      if (this.selectedTasks.length === 0) {
        this.$message.warning('请选择待办任务')
        return
      }
      const task = this.selectedTasks[0]
      this.delegateForm.taskId = task.taskId
      this.delegateForm.leaveId = task.leaveId
      this.delegateForm.assignee = ''
      this.delegateForm.comment = ''
      this.delegateDialogVisible = true
      this.$nextTick(() => {
        this.$refs.delegateFormRef && this.$refs.delegateFormRef.clearValidate()
      })
    },
    /** 提交委派 */
    submitDelegate() {
      this.$refs.delegateFormRef.validate(valid => {
        if (valid) {
          this.delegateLoading = true
          const data = {
            taskId: this.delegateForm.taskId,
            leaveId: this.delegateForm.leaveId,
            assignee: this.delegateForm.assignee,
            comment: this.delegateForm.comment
          }
          delegateTask(data).then(() => {
            this.$modal.msgSuccess('委派成功')
            this.delegateDialogVisible = false
            this.getList()
          }).catch(error => {
            console.error('委派失败:', error)
            this.$modal.msgError('委派失败: ' + (error.message || '未知错误'))
          }).finally(() => {
            this.delegateLoading = false
          })
        }
      })
    },
    /** 提交审批 */
    submitApprove() {
      this.$refs.approveForm.validate(valid => {
        if (valid) {
          this.approveLoading = true
          const data = {
            taskId: this.approveForm.taskId,
            leaveId: this.approveForm.leaveId,
            comment: this.approveForm.comment
          }

          const apiMethod = this.approveForm.action === 'approve' ? approve : reject
          const actionText = this.approveForm.action === 'approve' ? '通过' : '拒绝'

          apiMethod(data).then(response => {
            this.$modal.msgSuccess(`审批${actionText}成功`)
            this.approveDialogVisible = false
            this.getList()
          }).catch(error => {
            console.error(`审批${actionText}失败:`, error)
            this.$modal.msgError(`审批${actionText}失败: ` + (error.message || '未知错误'))
          }).finally(() => {
            this.approveLoading = false
          })
        }
      })
    },
    /** 转交按钮操作 */
    handleTransfer() {
      if (this.single) {
        this.$message.warning('请选择一条待办任务')
        return
      }
      if (this.selectedTasks.length === 0) {
        this.$message.warning('请选择待办任务')
        return
      }
      // 只处理第一个选中的任务
      const task = this.selectedTasks[0]
      this.transferForm.taskId = task.taskId
      this.transferForm.leaveId = task.leaveId
      this.transferForm.assignee = ''
      this.transferForm.comment = ''
      this.transferDialogVisible = true
      this.$nextTick(() => {
        this.$refs.transferForm && this.$refs.transferForm.clearValidate()
      })
    },
    /** 提交转交 */
    submitTransfer() {
      this.$refs.transferForm.validate(valid => {
        if (valid) {
          this.transferLoading = true
          const data = {
            taskId: this.transferForm.taskId,
            leaveId: this.transferForm.leaveId,
            assignee: this.transferForm.assignee,
            comment: this.transferForm.comment
          }

          transfer(data).then(response => {
            this.$modal.msgSuccess('转交成功')
            this.transferDialogVisible = false
            this.getList()
          }).catch(error => {
            console.error('转交失败:', error)
            this.$modal.msgError('转交失败: ' + (error.message || '未知错误'))
          }).finally(() => {
            this.transferLoading = false
          })
        }
      })
    },
    /** 完成委派（审查） */
    handleResolveDelegate(row) {
      if (!row || row.delegationState !== 'PENDING') {
        this.$message.warning('该任务不在委派处理中')
        return
      }
      this.resolveForm.taskId = row.taskId
      this.resolveForm.leaveId = row.leaveId
      this.resolveForm.comment = ''
      this.resolveDialogVisible = true
    },
    submitResolve() {
      this.resolveLoading = true
      const data = {
        taskId: this.resolveForm.taskId,
        leaveId: this.resolveForm.leaveId,
        comment: this.resolveForm.comment
      }
      resolveDelegateTask(data).then(() => {
        this.$modal.msgSuccess('委派审查完成')
        this.resolveDialogVisible = false
        this.getList()
      }).catch(error => {
        console.error('委派审查失败:', error)
        this.$modal.msgError('委派审查失败: ' + (error.message || '未知错误'))
      }).finally(() => {
        this.resolveLoading = false
      })
    },
    /** 驳回按钮操作 */
    handleRejectBack() {
      if (this.single) {
        this.$message.warning('请选择一条待办任务')
        return
      }
      if (this.selectedTasks.length === 0) {
        this.$message.warning('请选择待办任务')
        return
      }
      const task = this.selectedTasks[0]
      this.rejectBackForm.taskId = task.taskId
      this.rejectBackForm.leaveId = task.leaveId
      this.rejectBackForm.targetActivityId = ''
      this.rejectBackForm.comment = ''
      this.rejectBackNodes = []
      this.rejectBackDialogVisible = true
      // 自动加载可驳回节点
      this.loadRejectBackNodes()
    },
    /** 加载可驳回节点 */
    loadRejectBackNodes() {
      if (!this.rejectBackForm.taskId || !this.rejectBackForm.leaveId) {
        return
      }
      this.rejectBackNodesLoading = true
      getRejectBackNodes({
        taskId: this.rejectBackForm.taskId,
        leaveId: this.rejectBackForm.leaveId
      }).then(response => {
        if (response && response.code === 200) {
          this.rejectBackNodes = response.data || []
        } else {
          this.rejectBackNodes = []
        }
      }).catch(error => {
        console.error('加载可驳回节点失败:', error)
        this.$message.error('加载可驳回节点失败')
        this.rejectBackNodes = []
      }).finally(() => {
        this.rejectBackNodesLoading = false
      })
    },
    /** 提交驳回 */
    submitRejectBack() {
      this.$refs.rejectBackFormRef.validate(valid => {
        if (valid) {
          this.rejectBackLoading = true
          const data = {
            taskId: this.rejectBackForm.taskId,
            leaveId: this.rejectBackForm.leaveId,
            targetActivityId: this.rejectBackForm.targetActivityId,
            comment: this.rejectBackForm.comment
          }
          rejectBack(data).then(() => {
            this.$modal.msgSuccess('驳回成功')
            this.rejectBackDialogVisible = false
            this.getList()
          }).catch(error => {
            console.error('驳回失败:', error)
            this.$modal.msgError('驳回失败: ' + (error.message || '未知错误'))
          }).finally(() => {
            this.rejectBackLoading = false
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>


