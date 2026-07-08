<template>
  <div v-if="checkPermi(['platform:maintain:orderLog:list'])" class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="tableFrom" size="small" class="mb15">
        <el-form-item label="操作人">
          <el-input v-model="tableFrom.operatorName" placeholder="请输入操作人名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="操作人类型">
          <el-select v-model="tableFrom.operatorType" placeholder="全部" clearable style="width: 120px">
            <el-option label="系统" :value="0" />
            <el-option label="用户" :value="1" />
            <el-option label="管理员" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="tableFrom.orderSn" placeholder="请输入订单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData.list" style="width: 100%" v-loading="listLoading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="operatorAvatar" label="头像" width="80">
          <template slot-scope="scope">
            <el-avatar v-if="scope.row.operatorAvatar" :src="scope.row.operatorAvatar" :size="32" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="operatorType" label="操作人类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="operatorTypeTag(scope.row.operatorType)" size="mini">
              {{ operatorTypeText(scope.row.operatorType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderSn" label="订单号" width="160" show-overflow-tooltip />
        <el-table-column prop="actionTitle" label="操作标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="actionDetail" label="操作详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="140" show-overflow-tooltip />
        <el-table-column prop="createTime" label="操作时间" width="160" />
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
    </el-card>
  </div>
</template>

<script>
import { GetOrderLogList } from '@/api/yytapi';

export default {
  name: 'OrderLog',
  data() {
    return {
      tableData: {},
      tableFrom: {
        page: 1,
        limit: 20,
        operatorName: '',
        operatorType: '',
        orderSn: '',
      },
      listLoading: false,
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    getList() {
      this.listLoading = true;
      const params = {
        page: this.tableFrom.page,
        limit: this.tableFrom.limit,
      };
      if (this.tableFrom.operatorName) params.operatorName = this.tableFrom.operatorName;
      if (this.tableFrom.operatorType !== '' && this.tableFrom.operatorType !== null) params.operatorType = this.tableFrom.operatorType;
      if (this.tableFrom.orderSn) params.orderSn = this.tableFrom.orderSn;
      GetOrderLogList(params)
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
        operatorName: '',
        operatorType: '',
        orderSn: '',
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
    operatorTypeText(type) {
      const map = { 0: '系统', 1: '用户', 2: '管理员' };
      return map[type] || '-';
    },
    operatorTypeTag(type) {
      const map = { 0: 'info', 1: '', 2: 'warning' };
      return map[type] || 'info';
    },
  },
};
</script>
