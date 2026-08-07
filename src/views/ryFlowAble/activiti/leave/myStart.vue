<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="item in leaveStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间" prop="start">
        <el-date-picker clearable
          v-model="queryParams.start"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="请选择开始时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="结束时间" prop="end">
        <el-date-picker clearable
          v-model="queryParams.end"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="请选择结束时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:leave:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:leave:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:leave:export']"
        >导出</el-button>
      </el-col>

      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="leaveList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="主键" align="center" prop="id" />
      <el-table-column label="发起人" align="center" prop="userName" />
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <el-tag :type="getStatusTagType(scope.row.status)" :effect="getStatusTagEffect(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="请假类型" align="center" prop="type">
        <template slot-scope="scope">
          {{ getLeaveTypeLabel(scope.row.type) }}
        </template>
      </el-table-column>
      <el-table-column label="请假天数" align="center" prop="days" />
      <el-table-column label="开始时间" align="center" prop="start" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.start, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束时间" align="center" prop="end" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.end, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" >
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="openDetail(scope.row)" >详情</el-button>
          <!-- 有驳回标识时，不展示撤回，改为“重发” -->
          <el-button
            v-if="canResend(scope.row)"
            size="mini"
            type="text"
            icon="el-icon-refresh"
            @click="handleResend(scope.row)"
          >重发</el-button>
          <el-button
            v-else-if="canWithdraw(scope.row)"
            size="mini"
            type="text"
            icon="el-icon-back"
            @click="handleWithdraw(scope.row)"
          >撤回</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改请假对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="模型Key">
            <el-input v-model="form.modelKey" />
        </el-form-item>
        <el-form-item label="请假类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择请假类型">
            <el-option
              v-for="item in leaveTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="请假理由" prop="reason">
          <el-input v-model="form.reason" placeholder="请输入请假理由" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start">
          <el-date-picker clearable
            v-model="form.start"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="end">
          <el-date-picker clearable
            v-model="form.end"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择结束时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="候选人" prop="candidate">
          <el-select v-model="form.candidate" placeholder="请选择候选人" clearable filterable>
            <el-option
              v-for="candidate in candidateOptions"
              :key="candidate.value"
              :label="candidate.label"
              :value="candidate.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="抄送人" prop="ccUsers">
          <el-select v-model="form.ccUsers" placeholder="请选择抄送人（可多选）" multiple clearable filterable>
            <el-option
              v-for="candidate in candidateOptions"
              :key="candidate.value"
              :label="candidate.label"
              :value="candidate.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

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

    <!-- 撤回对话框 -->
    <el-dialog title="撤回流程" :visible.sync="withdrawDialogVisible" width="500px" append-to-body>
      <el-form ref="withdrawFormRef" :model="withdrawForm" label-width="100px">
        <el-form-item label="撤回原因">
          <el-input
            v-model="withdrawForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入撤回原因（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="withdrawDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="withdrawLoading" @click="submitWithdraw">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 重发对话框 -->
    <el-dialog title="重发请假" :visible.sync="resendDialogVisible" width="500px" append-to-body>
      <el-form ref="resendFormRef" :model="resendForm" :rules="resendRules" label-width="80px">
        <el-form-item label="模型Key">
          <el-input v-model="resendForm.modelKey" />
        </el-form-item>
        <el-form-item label="请假类型" prop="type">
          <el-select v-model="resendForm.type" placeholder="请选择请假类型">
            <el-option
              v-for="item in leaveTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="请假理由" prop="reason">
          <el-input v-model="resendForm.reason" placeholder="请输入请假理由" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start">
          <el-date-picker clearable
            v-model="resendForm.start"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="end">
          <el-date-picker clearable
            v-model="resendForm.end"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择结束时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="审批人" prop="candidate">
          <el-select v-model="resendForm.candidate" placeholder="请选择审批人" clearable filterable>
            <el-option
              v-for="candidate in candidateOptions"
              :key="candidate.value"
              :label="candidate.label"
              :value="candidate.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="抄送人" prop="ccUsers">
          <el-select v-model="resendForm.ccUsers" placeholder="请选择抄送人（可多选）" multiple clearable filterable>
            <el-option
              v-for="candidate in candidateOptions"
              :key="candidate.value"
              :label="candidate.label"
              :value="candidate.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="resendDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="resendLoading" @click="submitResend">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listLeave, getLeave, delLeave, addLeave, updateLeave, withdrawProcess, resendLeave } from "@/api/ryFlowAble/activiti/leave"
import { getApprovalDetail} from "@/api/ryFlowAble/activiti/process"
import ApprovalTimeline from '@/components/ryFlowAble/ApprovalTimeline/index.vue'
import ProcessTrace from '@/components/ryFlowAble/ProcessTrace/index.vue'

export default {
  name: "Leave",
  components: { ApprovalTimeline, ProcessTrace },
  data() {
    return {
      // 请假类型选项（数据来源于字典或接口）
      leaveTypeOptions: [],
      // 请假状态选项（数据来源于字典或接口）
      leaveStatusOptions: [],
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 请假表格数据
      leaveList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        status: null,
        start: null,
        end: null,
      },
      // 表单参数
      form: {
        modelKey: "",
        ccUsers: []
      },
      // 表单校验
      rules: {
        type: [
          { required: true, message: "请假类型不能为空", trigger: "change" }
        ],
        start: [
          { required: true, message: "开始日期不能为空", trigger: "change" }
        ],
        end: [
          { required: true, message: "结束日期不能为空", trigger: "change" }
        ],
        candidate: [
          { required: true, message: "审批人不能为空", trigger: "change" }
        ]
      },
      // 候选人选项（默认值）
      candidateOptions: [
        { label: '小若', value: 'ruo' },
        { label: '小依', value: 'yi' },
        { label: '若依', value: 'ry' },
        { label: '管理员', value: 'admin' }
      ],
      // 详情抽屉 & 数据（模拟）
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
      detailTrace: {
        activeNodes: []
      },
      submitLoading: false,
      // 撤回对话框
      withdrawDialogVisible: false,
      withdrawLoading: false,
      withdrawForm: {
        processInstanceId: '',
        leaveId: null,
        reason: ''
      },
      // 重发对话框
      resendDialogVisible: false,
      resendLoading: false,
      resendForm: {
        leaveId: null,
        modelKey: '',
        type: null,
        reason: '',
        start: null,
        end: null,
        candidate: null,
        ccUsers: []
      },
      resendRules: {
        type: [
          { required: true, message: "请假类型不能为空", trigger: "change" }
        ],
        start: [
          { required: true, message: "开始日期不能为空", trigger: "change" }
        ],
        end: [
          { required: true, message: "结束日期不能为空", trigger: "change" }
        ],
        candidate: [
          { required: true, message: "审批人不能为空", trigger: "change" }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询请假列表 */
    getList() {
      this.loading = true
      listLeave(this.queryParams).then(response => {
        this.leaveList = response.list
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        userId: null,
        statuts: null,
        processInstanceId: null,
        type: null,
        days: null,
        reason: null,
        start: null,
        end: null,
        candidate: null,
        ccUsers: [],
        createTime: null,
        updateTime: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true
      this.form.modelKey =""
      this.title = "添加请假"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getLeave(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改请假"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.submitLoading = true
          // 处理抄送人：如果是数组，转换为逗号分隔的字符串
          const submitData = { ...this.form }
          if (Array.isArray(submitData.ccUsers) && submitData.ccUsers.length > 0) {
            submitData.ccUsers = submitData.ccUsers.join(',')
          } else {
            submitData.ccUsers = null
          }
          
          if (this.form.id != null) {
            updateLeave(submitData).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            }).finally(() => { this.submitLoading = false })
          } else {
            addLeave(submitData).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            }).finally(() => { this.submitLoading = false })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除请假编号为"' + ids + '"的数据项？').then(function() {
        return delLeave(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/leave/export', {
        ...this.queryParams
      }, `leave_${new Date().getTime()}.xlsx`)
    },
    /** 选项卡点击（trace 标签由 ProcessTrace 组件自动处理） */
    async onDetailTabClick(tab) {
      // trace 标签的加载由 ProcessTrace 组件自动处理，这里可以留空或添加其他逻辑
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
    /** 打开流程详情（使用 getLeave 获取数据） */
    openDetail(row) {
      // 打开抽屉并切换到表单页签
      this.activeDetailTab = 'form'
      this.detailVisible = true
      this.detailLoading = true

      // 通过接口获取详情数据
      const id = row.id
      getLeave(id).then(async (response) => {
        const data = (response && response.data) || {}
        this.detailFormData = {
          id: data.id,
          userName: data.userName || row.userName,
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
      }).finally(() => { this.detailLoading = false })

      // 高亮轨迹（暂用模拟数据）
      this.detailTrace = {
        activeNodes: ['发起申请', '直属领导审批', '人事复核']
      }
    },
    /** 判断是否可以撤回 */
    canWithdraw(row) {
      // 只有流程运行中（status === 1）且存在流程实例ID的记录才能撤回
      return row.status === 1 && row.processInstanceId && (!row.rejectFlag || Number(row.rejectFlag) !== 1)
    },
    /** 判断是否显示重发 */
    canResend(row) {
      // 有驳回标识（rejectFlag === 1）且流程仍然运行中时，展示“重发”操作
      return row.status === 1 && row.processInstanceId && Number(row.rejectFlag) === 1
    },
    /** 重发按钮操作 */
    handleResend(row) {
      if (!row.id) {
        this.$message.warning('该请假单无法重发')
        return
      }
      // 加载原请假单数据
      getLeave(row.id).then(response => {
        const data = (response && response.data) || {}
        this.resendForm.leaveId = row.id
        this.resendForm.modelKey = data.processDefinitionId ? this.getModelKeyFromProcessDefinitionId(data.processDefinitionId) : ''
        this.resendForm.type = data.type || null
        this.resendForm.reason = data.reason || ''
        this.resendForm.start = data.start ? this.formatDate(data.start) : null
        this.resendForm.end = data.end ? this.formatDate(data.end) : null
        this.resendForm.candidate = null // 需要用户重新选择
        this.resendForm.ccUsers = []
        this.resendDialogVisible = true
      }).catch(error => {
        console.error('加载请假单数据失败:', error)
        this.$message.error('加载请假单数据失败')
      })
    },
    /** 提交重发 */
    submitResend() {
      this.$refs["resendFormRef"].validate(valid => {
        if (valid) {
          this.resendLoading = true
          const submitData = {
            leaveId: this.resendForm.leaveId,
            modelKey: this.resendForm.modelKey,
            type: this.resendForm.type,
            reason: this.resendForm.reason,
            start: this.resendForm.start,
            end: this.resendForm.end,
            candidate: this.resendForm.candidate
          }
          // 处理抄送人：如果是数组，转换为逗号分隔的字符串
          if (Array.isArray(this.resendForm.ccUsers) && this.resendForm.ccUsers.length > 0) {
            submitData.ccUsers = this.resendForm.ccUsers.join(',')
          } else {
            submitData.ccUsers = null
          }
          
          resendLeave(submitData).then(() => {
            this.$modal.msgSuccess('重发成功')
            this.resendDialogVisible = false
            this.getList()
          }).catch(error => {
            console.error('重发失败:', error)
            this.$modal.msgError('重发失败: ' + (error.message || '未知错误'))
          }).finally(() => {
            this.resendLoading = false
          })
        }
      })
    },
    /** 格式化日期为 yyyy-MM-dd */
    formatDate(date) {
      if (!date) return null
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    /** 从流程定义ID中提取模型Key（简化处理，实际可能需要调用接口） */
    getModelKeyFromProcessDefinitionId(processDefinitionId) {
      if (!processDefinitionId) return 'Process_1096'
      // 流程定义ID格式通常是：Process_1096:1:xxx，提取冒号前的部分
      const parts = processDefinitionId.split(':')
      return parts.length > 0 ? parts[0] : 'Process_1096'
    },
    /** 撤回按钮操作 */
    handleWithdraw(row) {
      if (!row.processInstanceId) {
        this.$message.warning('该流程无法撤回')
        return
      }
      this.withdrawForm.processInstanceId = row.processInstanceId
      this.withdrawForm.leaveId = row.id
      this.withdrawForm.reason = ''
      this.withdrawDialogVisible = true
    },
    /** 提交撤回 */
    submitWithdraw() {
      this.withdrawLoading = true
      const data = {
        processInstanceId: this.withdrawForm.processInstanceId,
        leaveId: this.withdrawForm.leaveId,
        reason: this.withdrawForm.reason
      }
      withdrawProcess(data).then(() => {
        this.$modal.msgSuccess('撤回成功')
        this.withdrawDialogVisible = false
        this.getList()
      }).catch(error => {
        console.error('撤回失败:', error)
        this.$modal.msgError('撤回失败: ' + (error.message || '未知错误'))
      }).finally(() => {
        this.withdrawLoading = false
      })
    }
  }
}
</script>

<style>
</style>
