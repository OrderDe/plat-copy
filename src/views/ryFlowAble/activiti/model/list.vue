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
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd">新增流程</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="processList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="流程ID" align="center" key="id" prop="id" v-if="columns[0].visible" :show-overflow-tooltip="true" />
      <el-table-column label="流程名称" align="center" key="definitionName" prop="definitionName" v-if="columns[1].visible" :show-overflow-tooltip="true" />
      <el-table-column label="流程Key" align="center" key="definitionKey" prop="definitionKey" v-if="columns[2].visible" :show-overflow-tooltip="true" />
      <el-table-column label="版本号" align="center" key="version" prop="version" v-if="columns[3].visible" width="80" />
      <el-table-column label="状态" align="center" key="suspended" v-if="columns[5].visible" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.suspended ? 'danger' : 'success'">
            {{ scope.row.suspended ? '暂停' : '已部署' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="部署时间" align="center" prop="deploymentTime" v-if="columns[6].visible" >
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.deploymentTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleEdit(scope.row)">设计</el-button>
          <el-button size="mini" type="text" icon="el-icon-download" @click="handleHistory(scope.row)">历史版本</el-button>
          <!-- <el-dropdown size="mini" @command="(command) => handleCommand(command, scope.row)">
            <el-button size="mini" type="text" icon="el-icon-d-arrow-right">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="handleStart" icon="el-icon-video-play">启动流程</el-dropdown-item>
              <el-dropdown-item command="handleSuspend" icon="el-icon-video-pause" v-if="!scope.row.suspended">暂停流程</el-dropdown-item>
              <el-dropdown-item command="handleActivate" icon="el-icon-video-play" v-if="scope.row.suspended">激活流程</el-dropdown-item>
              <el-dropdown-item command="handleDelete" icon="el-icon-delete">删除部署</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown> -->
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 流程详情对话框 -->
    <el-dialog title="流程详情" :visible.sync="viewOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="流程ID">{{ viewForm.id }}</el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ viewForm.definitionName }}</el-descriptions-item>
        <el-descriptions-item label="流程Key">{{ viewForm.definitionKey }}</el-descriptions-item>
        <el-descriptions-item label="最新版本">{{ viewForm.latestVersion }}</el-descriptions-item>
        <el-descriptions-item label="部署次数">{{ viewForm.deploymentCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewForm.suspended ? 'danger' : 'success'">
            {{ viewForm.suspended ? '暂停' : '激活' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="部署时间">{{ parseTime(viewForm.latestDeploymentTime) }}</el-descriptions-item>
        <el-descriptions-item label="租户Id">{{ viewForm.tenantId }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 启动流程对话框 -->
    <el-dialog title="启动流程" :visible.sync="startOpen" width="500px" append-to-body>
      <el-form ref="startForm" :model="startForm" :rules="startRules" label-width="100px">
        <el-form-item label="流程名称">
          <el-input v-model="startForm.processName" disabled />
        </el-form-item>
        <el-form-item label="业务Key" prop="businessKey">
          <el-input v-model="startForm.businessKey" placeholder="请输入业务Key" />
        </el-form-item>
        <el-form-item label="变量">
          <el-input v-model="startForm.variables" type="textarea" placeholder="请输入JSON格式的变量，如：{&quot;key&quot;: &quot;value&quot;}" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="startOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitStart">确 定</el-button>
    </div>
    </el-dialog>
  </div>
</template>

<script>
import { getProcessDefinitions, getProcessDefinition, deleteDeployment, startProcessInstance, getProcessDefinitionXml, getProcessDefinitionImage, suspendProcessDefinition, activateProcessDefinition } from "@/api/ryFlowAble/activiti/model"

export default {
  name: "ProcessModel",
  data() {
    return {
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
      // 流程表格数据
      processList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        processName: undefined,
        tenantId: ''
      },
      // 列信息
      columns: [
        { key: 0, label: `ID`, visible: true },
        { key: 1, label: `流程名称`, visible: true },
        { key: 2, label: `流程Key`, visible: true },
        { key: 3, label: `版本号`, visible: true },
        { key: 4, label: `部署时间`, visible: true },
        { key: 5, label: `状态`, visible: true },
        { key: 6, label: `部署时间`, visible: true },
        { key: 7, label: `所属租户`, visible: true }
      ],
      // 查看对话框
      viewOpen: false,
      viewForm: {},
      // 启动流程对话框
      startOpen: false,
      startForm: {
        processDefinitionId: undefined,
        processName: undefined,
        businessKey: undefined,
        variables: undefined
      },
      startRules: {
        businessKey: [
          { required: true, message: "业务Key不能为空", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询流程列表 */
    getList() {
      this.loading = true
      const params = {
        ...this.queryParams,
        firstResult: (this.queryParams.pageNum - 1) * this.queryParams.pageSize,
        maxResults: this.queryParams.pageSize
      }
      
      getProcessDefinitions(params).then(response => {
        console.log(response)
        this.processList = response.list || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
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
        id: undefined,
        name: undefined,
        key: undefined,
        version: undefined,
        deploymentId: undefined,
        suspended: false
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
      this.dateRange = []
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.$router.push('/ryFlowAble/activiti/model-create/index')
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.$router.push('/activiti/modeler')
    },
    /** 查看按钮操作 */
    handleView(row) {
      this.viewForm = { ...row }
      this.viewOpen = true
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除流程定义编号为"' + ids + '"的数据项？').then(function() {
        return deleteDeployment(row.deploymentId || row.deploymentId)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('camunda/process/export', {
        ...this.queryParams
      }, `process_${new Date().getTime()}.xlsx`)
    },
    /** 设计 */
    handleEdit(row) {
      console.log(row);
      this.$router.push(`/ryFlowAble/activiti/model-edit/index/${row.id}`)
    },
    /** 历史版本 */
    handleHistory(row) {
      this.$router.push(`/ryFlowAble/activiti/model-history/index?key=${row.definitionKey}`)
    },
    /** 下载图片 */
    handleDownloadImage(row) {
      getProcessDefinitionImage(row.id).then(response => {
        const blob = new Blob([response.data], { type: 'image/png' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${row.name || row.key}.png`
        link.click()
        window.URL.revokeObjectURL(url)
      })
    },
    /** 更多操作 */
    handleCommand(command, row) {
      switch (command) {
        case "handleStart":
          this.handleStartProcess(row)
          break
        case "handleSuspend":
          this.handleSuspendProcess(row)
          break
        case "handleActivate":
          this.handleActivateProcess(row)
          break
        case "handleDelete":
          this.handleDelete(row)
          break
      }
    },
    /** 启动流程 */
    handleStartProcess(row) {
      this.startForm = {
        processDefinitionId: row.id,
        processName: row.name || row.key,
        businessKey: undefined,
        variables: undefined
      }
      this.startOpen = true
    },
    /** 提交启动流程 */
    submitStart() {
      this.$refs["startForm"].validate(valid => {
        if (valid) {
          let variables = {}
          if (this.startForm.variables) {
            try {
              variables = JSON.parse(this.startForm.variables)
            } catch (e) {
              this.$modal.msgError("变量格式错误，请输入有效的JSON格式")
              return
            }
          }
          
          const data = {
            businessKey: this.startForm.businessKey,
            variables: variables
          }
          
          startProcessInstance(this.startForm.processDefinitionId, data).then(response => {
            this.$modal.msgSuccess("流程启动成功")
            this.startOpen = false
          })
        }
      })
    },
    /** 暂停流程 */
    handleSuspendProcess(row) {
      this.$modal.confirm('是否确认暂停流程"' + (row.name || row.key) + '"？').then(function() {
        return suspendProcessDefinition(row.id, { suspended: true })
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("暂停成功")
      }).catch(() => {})
    },
    /** 激活流程 */
    handleActivateProcess(row) {
      this.$modal.confirm('是否确认激活流程"' + (row.name || row.key) + '"？').then(function() {
        return activateProcessDefinition(row.id, { suspended: false })
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("激活成功")
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
