<template>
  <div v-if="checkPermi(['platform:maintain:operationLog:list'])" class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="tableFrom" size="small" class="mb15">
        <el-form-item label="操作人">
          <el-input v-model="tableFrom.userName" placeholder="请输入操作人名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData.list" style="width: 100%" v-loading="listLoading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userName" label="操作人" width="120" />
        <!-- <el-table-column prop="userType" label="操作人类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="userTypeTag(scope.row.userType)" size="mini">
              {{ userTypeText(scope.row.userType) }}
            </el-tag>
          </template>
        </el-table-column> -->
        <el-table-column prop="module" label="操作模块" width="140" show-overflow-tooltip />
        <el-table-column prop="action" label="操作动作" width="140" show-overflow-tooltip />
        <el-table-column prop="url" label="请求URL" min-width="200" show-overflow-tooltip />
        <el-table-column prop="method" label="请求方法" width="100" />
        <el-table-column prop="ipAddress" label="IP地址" width="140" show-overflow-tooltip />
        <el-table-column prop="costTime" label="耗时(ms)" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="onViewDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        :page-sizes="[20, 50, 100]"
        :page-size="tableFrom.limit"
        :current-page="tableFrom.page"
        layout="total, sizes, prev, pager, next, jumper"
        :total="tableData.total"
        @size-change="handleSizeChange"
        @current-change="pageChange"
      />

      <!-- 详情弹窗 -->
      <el-dialog title="操作日志详情" :visible.sync="dialogVisible" width="700px" :close-on-click-modal="false">
        <el-descriptions :column="2" border size="small" v-if="currentRow">
          <el-descriptions-item label="操作人">{{ currentRow.userName }}</el-descriptions-item>
          <el-descriptions-item label="操作人类型">{{ userTypeText(currentRow.userType) }}</el-descriptions-item>
          <el-descriptions-item label="操作模块">{{ currentRow.module }}</el-descriptions-item>
          <el-descriptions-item label="操作动作">{{ currentRow.action }}</el-descriptions-item>
          <el-descriptions-item label="请求URL" :span="2">{{ currentRow.url }}</el-descriptions-item>
          <el-descriptions-item label="请求方法">{{ currentRow.method }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentRow.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ currentRow.costTime }} ms</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRow.status === 1 ? 'success' : 'danger'" size="mini">
              {{ currentRow.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ currentRow.createTime }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2" v-if="currentRow.errorMsg">
            <span style="color: #f56c6c">{{ currentRow.errorMsg }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="请求参数" :span="2">
            <pre style="max-height: 150px; overflow: auto; margin: 0;">{{ formatJson(currentRow.params) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="返回结果" :span="2">
            <pre style="max-height: 150px; overflow: auto; margin: 0;">{{ formatJson(currentRow.result) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
        <span slot="footer">
          <el-button size="small" @click="dialogVisible = false">关闭</el-button>
        </span>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { GetOperationLogList } from '@/api/yytapi';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'OperationLog',
  data() {
    return {
      tableData: {},
      tableFrom: {
        page: 1,
        limit: 20,
        userName: '',
      },
      listLoading: false,
      dialogVisible: false,
      currentRow: null,
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    checkPermi,
    getList() {
      this.listLoading = true;
      const params = {
        page: this.tableFrom.page,
        limit: this.tableFrom.limit,
      };
      if (this.tableFrom.userName) params.userName = this.tableFrom.userName;
      GetOperationLogList(params)
        .then((res) => {
          this.tableData = res || { list: [], total: 0 };
        })
        .finally(() => { this.listLoading = false; });
    },
    onSearch() {
      this.tableFrom.page = 1;
      this.getList();
    },
    onReset() {
      this.tableFrom = {
        page: 1,
        limit: 20,
        userName: '',
      };
      this.getList();
    },
    handleSizeChange(val) {
      this.tableFrom.limit = val;
      this.tableFrom.page = 1;
      this.getList();
    },
    pageChange(page) {
      this.tableFrom.page = page;
      this.getList();
    },
    userTypeText(type) {
      const map = { 0: '系统', 1: '用户', 2: '管理员' };
      return map[type] || '-';
    },
    userTypeTag(type) {
      const map = { 0: 'info', 1: '', 2: 'warning' };
      return map[type] || 'info';
    },
    onViewDetail(row) {
      this.currentRow = row;
      this.dialogVisible = true;
    },
    formatJson(str) {
      if (!str) return '-';
      try {
        const obj = typeof str === 'string' ? JSON.parse(str) : str;
        return JSON.stringify(obj, null, 2);
      } catch {
        return str;
      }
    },
  },
};
</script>
