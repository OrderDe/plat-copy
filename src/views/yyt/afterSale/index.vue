<template>
  <div v-if="checkPermi(['platform:yyt:afterSale:list'])" class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">怡亚通售后管理</span>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="queryForm" size="small" class="mb10">
        <el-form-item label="订单编号">
          <el-input v-model="queryForm.orderSn" placeholder="请输入订单编号" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="售后单号">
          <el-input v-model="queryForm.returnSn" placeholder="请输入售后单号" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="第三方退款单号">
          <el-input v-model="queryForm.channelReturnSn" placeholder="请输入第三方退款单号" clearable style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="tableData" border size="mini">
        <el-table-column prop="orderSn" label="订单号" width="180" show-overflow-tooltip />
        <el-table-column prop="returnSn" label="售后单号" width="180" show-overflow-tooltip />
        <el-table-column prop="channelReturnSn" label="第三方退款单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="returnTypeName" label="售后类型" width="100" align="center" />
        <el-table-column prop="returnStatusName" label="售后状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini">{{ row.returnStatusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="订单金额" width="110" align="right">
          <template slot-scope="{ row }">
            <span class="price-text">¥{{ row.totalPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applyReturnAmount" label="申请退款金额" width="120" align="right">
          <template slot-scope="{ row }">
            <span class="price-danger">¥{{ row.applyReturnAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualReturnAmount" label="实际退款金额" width="120" align="right">
          <template slot-scope="{ row }">
            <span class="price-text">¥{{ row.actualReturnAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="returnReason" label="退款原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="onViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt15 acea-row row-right">
        <el-pagination
          background
          :current-page="queryForm.page"
          :page-sizes="[20, 50, 100]"
          :page-size="queryForm.limit"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 退款详情抽屉 -->
    <refund-detail-drawer ref="refundDetailDrawer" />
  </div>
</template>

<script>
import { GetRefundList } from '@/api/yytapi';
import RefundDetailDrawer from './components/RefundDetailDrawer.vue';

export default {
  name: 'YytAfterSale',
  components: { RefundDetailDrawer },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      queryForm: {
        page: 1,
        limit: 20,
        orderSn: '',
        returnSn: '',
        channelReturnSn: '',
      },
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      GetRefundList(this.queryForm)
        .then((res) => {
          this.tableData = res.list || [];
          this.total = Number(res.total) || 0;
        })
        .finally(() => { this.loading = false; });
    },
    onSearch() { this.getList(); },
    onReset() {
      this.queryForm = { page: 1, limit: 20, orderSn: '', returnSn: '', channelReturnSn: '' };
      this.getList();
    },
    handleSizeChange(size) { this.queryForm.limit = size; this.getList(); },
    handleCurrentChange(page) { this.queryForm.page = page; this.getList(); },
    onViewDetail(row) { this.$refs.refundDetailDrawer.open(row.returnSn); },
  },
};
</script>

<style scoped>
.price-text { color: #f56c6c; font-weight: 600; }
.price-danger { color: #E6A23C; font-weight: 600; }
</style>
