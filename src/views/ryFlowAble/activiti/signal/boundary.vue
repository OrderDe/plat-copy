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
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd">发起流程</el-button>
      </el-col>

      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="processInstanceList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="流程ID" align="center" key="id" prop="id" v-if="columns[0].visible" :show-overflow-tooltip="true" />
      <!-- <el-table-column label="流程名称" align="center" key="processDefinitionName" prop="processDefinitionName" v-if="columns[1].visible" :show-overflow-tooltip="true" /> -->
      <el-table-column label="流程名称" align="center" key="processName" prop="processName" v-if="columns[1].visible" :show-overflow-tooltip="true" />
      <el-table-column label="开始时间" align="center" key="startTime" prop="startTime" v-if="columns[2].visible" :show-overflow-tooltip="true" />
      <el-table-column label="结束时间" align="center" key="endTime" prop="endTime" v-if="columns[3].visible"  />
      <el-table-column label="状态" align="center" key="status" v-if="columns[5].visible" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.endTime ? 'danger' : 'success'">
            {{ scope.row.endTime ? '已结束' : '运行中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="耗时" align="center" key="cost" prop="cost" v-if="columns[4].visible" />
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
           <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
           <el-button size="mini" type="text" icon="el-icon-top" @click="handleTrigger(scope.row)">触发</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />


    <!-- 启动流程对话框 -->
    <el-dialog title="启动流程" :visible.sync="startOpen" width="500px" append-to-body>
      <el-form ref="startForm" :model="startForm" :rules="startRules" label-width="100px">
        <el-form-item label="模型Key">
          <el-input v-model="startForm.modelKey" />
        </el-form-item>
        <el-form-item label="故障内容" prop="error">
             <el-select v-model="startForm.error" radio placeholder="请选择故障内容">
                <el-option v-for="item in errorOptions" :key="item.id" :label="item.name" :value="item.id"  ></el-option>
            </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="startOpen = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitStart">确 定</el-button>
    </div>
    </el-dialog>
  </div>
</template>

<script>
import { pageQuery } from "@/api/ryFlowAble/activiti/process"
import { boundary,boundaryTrigger } from "@/api/ryFlowAble/activiti/signal"

export default {
  name: "ProcessModel",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 提交加载
      submitLoading: false,
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
      // 流程实例表格数据
      processInstanceList: [],
      //故障内容
      errorOptions:[
        {id: "WIFI故障",name: "WIFI故障"},
        {id: "网页打不开",name: "网页打不开"},
        {id: "服务器故障",name: "服务器故障"},
        {id: "响应慢",name: "响应慢"},
      ],
      // 查询参数
      queryParams: {
        modelKey: "",
        pageNum: 1,
        pageSize: 10,
        processName: undefined,
      },
      // 列信息
      columns: [
        { key: 0, label: `ID`, visible: true },
        { key: 1, label: `流程名称`, visible: true },
        { key: 2, label: `开始时间`, visible: true },
        { key: 3, label: `结束时间`, visible: true },
        { key: 4, label: `状态`, visible: true },
        { key: 5, label: `耗时`, visible: true }
      ],
      // 启动流程对话框
      startOpen: false,
      startForm: {
        modelKey: "",
        error: "",
      },
      startRules: {
        error: [
          { required: true, message: "快递员不能为空", trigger: "blur" }
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
      }
      
      pageQuery(params).then(response => {
        this.processInstanceList = response.list || []
        this.total = response.data.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
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
     /** 触发信号事件 */
    handleTrigger(row){
        var params = {"processInstanceId": row.id}
        boundaryTrigger(params).then(res=>{
             this.$modal.msgSuccess("用户撤回了")
             this.resetQuery();
        })
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
        this.startOpen = true;
        this.startForm.error = "";
    },
    /** 查看按钮操作 */
    handleView(row) {
      // 跳转到流程详情页面
      this.$router.push({
        path: '/model/highlight',
        query: {
          processDefinitionId: row.processDefinitionId,
          processInstanceId: row.id
        }
      })
    },
    /** 提交启动流程 */
    submitStart() {
      this.submitLoading = true;
      this.$refs["startForm"].validate(valid => {
        if (valid) {
          // 构建流程变量
          const variables = {
            modelKey: this.startForm.modelKey,  
            error: this.startForm.error,
          }
          
          console.log('Form data:', this.startForm)
          console.log('Variables:', variables)

          
          boundary(variables).then(response => {
            this.$modal.msgSuccess("流程启动成功")
            this.resetQuery();
          }).catch(error => {
            console.error('启动流程失败:', error)
            this.$modal.msgError("启动流程失败: " + (error.message || '未知错误'))
          }).finally(()=>{
             this.submitLoading = false;
             this.startOpen = false
          })
        }
      })
    },
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
