<template>
  <!-- v-if="checkPermi(['platform:yyt:notifyLog:list'])" -->
  <div class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">怡亚通通知日志</span>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="queryForm" size="small" class="mb10">
        <el-form-item label="消息类型">
          <el-select v-model="queryForm.messageType" placeholder="全部" clearable style="width:200px">
            <el-option label="订单状态变更" :value="1" />
            <el-option label="订单发货" :value="2" />
            <el-option label="售后订单状态变更" :value="3" />
            <el-option label="商品信息、状态变更通知" :value="4" />
            <el-option label="商品删除通知" :value="5" />
            <el-option label="商品规格删除通知" :value="6" />
            <el-option label="商品规格变更通知" :value="7" />
            <el-option label="选品库商品删除通知" :value="8" />
            <el-option label="选品库商品添加通知" :value="9" />
            <el-option label="添加选品库商品通知" :value="10" />
            <el-option label="删除选品库商品通知" :value="11" />
            <el-option label="选品库商品价格变更通知" :value="12" />
            <el-option label="创建订单" :value="20" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="tableData" border size="mini">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="messageTypeName" label="消息类型" width="160">
          <template slot-scope="{ row }">
            <el-tag size="mini">{{ row.messageTypeName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enumNum" label="枚举值" width="80" align="center" />
        <el-table-column prop="tenantId" label="租户ID" width="120" show-overflow-tooltip />
        <el-table-column prop="content" label="消息内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="statusTag(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
      </el-table>

      <!-- 分页 -->
      <div class="mt15 acea-row row-right">
        <el-pagination
          background
          :current-page="queryForm.pageIndex"
          :page-sizes="[20, 50, 100]"
          :page-size="queryForm.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 消息内容对话框 -->
    <el-dialog
      title="日志详情"
      :visible.sync="dialogVisible"
      width="660px"
      :close-on-click-modal="false"
    >
      <div v-if="currentLog">
        <el-descriptions :column="2" border size="small" class="mb15">
          <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="消息类型">
            <el-tag size="mini">{{ currentLog.messageTypeName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="枚举值">{{ currentLog.enumNum }}</el-descriptions-item>
          <el-descriptions-item label="租户ID">{{ currentLog.tenantId }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(currentLog.status)" size="mini">{{ statusText(currentLog.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentLog.createTime }}</el-descriptions-item>
          <el-descriptions-item label="消息内容" :span="2">{{ currentLog.content }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ currentLog.updateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { ConsumeMessagePool } from '@/api/yytapi';
// import { checkPermi } from '@/utils/permission';

export default {
  name: 'YytNotifyLog',
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      dialogVisible: false,
      currentLog: null,
      queryForm: {
        pageIndex: 1,
        pageSize: 20,
        messageType: '',
      },
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    // checkPermi,
    getList() {
      this.loading = true;
      const { pageIndex, pageSize, messageType } = this.queryForm;
      const params = { pageIndex, pageSize };
      if (messageType) params.messageType = messageType;
      ConsumeMessagePool(params)
        .then((res) => {
          this.tableData = (res && res.list) || [];
          this.total = (res && res.total) || 0;
        })
        .finally(() => { this.loading = false; });
    },
    onSearch() { this.queryForm.pageIndex = 1; this.getList(); },
    onReset() {
      this.queryForm = { pageIndex: 1, pageSize: 20, messageType: '' };
      this.getList();
    },
    handleSizeChange(size) { this.queryForm.pageSize = size; this.queryForm.pageIndex = 1; this.getList(); },
    handleCurrentChange(page) { this.queryForm.pageIndex = page; this.getList(); },
    statusText(status) {
      const map = { 0: '未读', 1: '已读' };
      return map[status] || '-';
    },
    statusTag(status) {
      const map = { 0: 'warning', 1: 'success' };
      return map[status] || 'info';
    },
    onViewContent(row) {
      this.currentLog = row;
      this.dialogVisible = true;
    },
  },
};
</script>
