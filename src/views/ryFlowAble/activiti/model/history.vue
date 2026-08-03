<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-back" size="mini" @click="handleBack">返回</el-button>
      </el-col>

      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="historyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="ID" align="center" key="id" prop="id" v-if="columns[0].visible" :show-overflow-tooltip="true" />
      <el-table-column label="流程名称" align="center" key="name" prop="name" v-if="columns[1].visible" :show-overflow-tooltip="true" />
      <el-table-column label="部署时间" align="center" prop="deploymentTime" v-if="columns[5].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.deploymentTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所属租户" align="center" key="tenantId" prop="tenantId" v-if="columns[7].visible" />
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <!-- <el-button size="mini" type="text" icon="el-icon-download" @click="handleDownloadXml(scope.row)">下载XML</el-button> -->
          <!-- <el-button size="mini" type="text" icon="el-icon-picture" @click="handleDownloadImage(scope.row)">下载图片</el-button> -->
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 流程详情对话框 -->
    <el-dialog title="流程详情" :visible.sync="viewOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="流程ID">{{ viewForm.id }}</el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ viewForm.name }}</el-descriptions-item>
        <el-descriptions-item label="流程Key">{{ viewForm.key }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{ viewForm.version }}</el-descriptions-item>
        <el-descriptions-item label="部署ID">{{ viewForm.deploymentId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewForm.suspended ? 'danger' : 'success'">
            {{ viewForm.suspended ? '暂停' : '激活' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="部署时间">{{ parseTime(viewForm.deploymentTime) }}</el-descriptions-item>
        <el-descriptions-item label="租户Id">{{ viewForm.tenantId }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getProcessDefinitionHistory, getProcessDefinitionXml, getProcessDefinitionImage } from "@/api/ryFlowAble/activiti/model"

export default {
  name: "ProcessHistory",
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
      // 历史记录表格数据
      historyList: [],
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
        key: undefined,
        tenantId: 'tenant1'
      },
      // 列信息
      columns: [
        { key: 0, label: `流程ID`, visible: true },
        { key: 1, label: `流程名称`, visible: true },
        { key: 2, label: `流程Key`, visible: true },
        { key: 3, label: `版本号`, visible: true },
        { key: 4, label: `部署ID`, visible: true },
        { key: 5, label: `部署时间`, visible: true },
        { key: 6, label: `状态`, visible: true },
        { key: 7, label: `所属租户`, visible: true }
      ],
      // 查看对话框
      viewOpen: false,
      viewForm: {}
    }
  },
  created() {
    // 从路由参数获取流程Key
    this.queryParams.key = this.$route.query.key
    this.getList()
  },
  methods: {
    /** 查询流程历史列表 */
    getList() {
      this.loading = true
      const params = {
        ...this.queryParams,
      }
      
      getProcessDefinitionHistory(params).then(response => {
        console.log('History response:', response)
        this.historyList = response.list || []
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
        suspended: false,
        tenantId: undefined
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
    /** 查看按钮操作 */
    handleView(row) {
      this.viewForm = row
      this.viewOpen = true
    },
    /** 返回按钮操作 */
    handleBack() {
      this.$router.go(-1)
    },
    /** 下载XML */
    handleDownloadXml(row) {
      getProcessDefinitionXml(row.id).then(response => {
        const blob = new Blob([response.data], { type: 'application/xml' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${row.name || row.key}_v${row.version}.bpmn`
        link.click()
        window.URL.revokeObjectURL(url)
      })
    },
    /** 下载图片 */
    handleDownloadImage(row) {
      getProcessDefinitionImage(row.id).then(response => {
        const blob = new Blob([response.data], { type: 'image/png' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${row.name || row.key}_v${row.version}.png`
        link.click()
        window.URL.revokeObjectURL(url)
      })
    }
  }
}
</script>
