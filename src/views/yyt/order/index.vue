<template>
  <!-- v-if="checkPermi(['platform:yyt:order:list'])" -->
  <div class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">怡亚通订单管理</span>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="queryForm" size="small" class="mb10">
        <el-form-item label="订单号">
          <el-input v-model="queryForm.orderSn" placeholder="请输入订单号" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="批次订单号">
          <el-input v-model="queryForm.batchOrderSn" placeholder="请输入批次订单号" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="关联本地订单号">
          <el-input v-model="queryForm.outOrderSn" placeholder="请输入本地订单号" clearable style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="tableData" border size="mini">
        <el-table-column prop="orderSn" label="订单号" width="180" show-overflow-tooltip />
        <el-table-column prop="batchOrderSn" label="批次订单号" width="180" show-overflow-tooltip />
        <el-table-column prop="outOrderSn" label="关联的本地系统订单号" width="180" show-overflow-tooltip />
        <el-table-column prop="totalAmount" label="订单总额" width="110" align="right">
          <template slot-scope="{ row }">
            <span class="price-text">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="支付金额" width="110" align="right">
          <template slot-scope="{ row }">
            <span>¥{{ row.payAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="statusTagType(row.orderStatus)" size="mini">{{ row.orderStatusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发货状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="sendTypeTag(row.sendType)" size="mini">{{ sendTypeLabel(row.sendType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="skuIds" label="SKU IDs" min-width="120" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
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
          :current-page="queryForm.pageNum"
          :page-sizes="[20, 50, 100]"
          :page-size="queryForm.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情抽屉 -->
    <order-detail-drawer ref="orderDetailDrawer" />
  </div>
</template>

<script>
import { GetSoldOrderList } from '@/api/yytapi';
import OrderDetailDrawer from './components/OrderDetailDrawer.vue';
// import { checkPermi } from '@/utils/permission';

const STATUS_MAP = {
  0: { label: '待支付', type: 'warning' },
  1: { label: '待发货', type: 'primary' },
  2: { label: '部分发货', type: 'success' },
  3: { label: '待核销', type: 'warning' },
  4: { label: '待收货', type: 'primary' },
  5: { label: '已收货', type: 'success' },
  6: { label: '已完成', type: 'success' },
  9: { label: '已取消', type: 'info' },
};

const SEND_TYPE_MAP = {
  0: { label: '未发货', type: 'info' },
  1: { label: '已发货', type: 'success' },
  2: { label: '部分发货', type: 'warning' },
};

export default {
  name: 'YytOrder',
  components: { OrderDetailDrawer },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      queryForm: {
        pageNum: 0,
        pageSize: 20,
        orderSn: '',
        batchOrderSn: '',
        outOrderSn: '',
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
      GetSoldOrderList(this.queryForm)
        .then((res) => {
          console.log(res);
          this.tableData = (res && res.list) || [];
          this.total = (res && res.total) || 0;
        })
        .finally(() => { this.loading = false; });
    },
    onSearch() { this.getList(); },
    onReset() {
      this.queryForm = { pageNum: 0, pageSize: 20, orderSn: '', batchOrderSn: '', outOrderSn: '' };
      this.getList();
    },
    handleSizeChange(size) { this.queryForm.pageSize = size; this.getList(); },
    handleCurrentChange(page) { this.queryForm.pageNum = page; this.getList(); },
    statusLabel(status) { return STATUS_MAP[status] && STATUS_MAP[status].label || status; },
    statusTagType(status) { return STATUS_MAP[status] && STATUS_MAP[status].type || 'info'; },
    sendTypeLabel(type) { return (SEND_TYPE_MAP[type] && SEND_TYPE_MAP[type].label) || type || '-'; },
    sendTypeTag(type) { return (SEND_TYPE_MAP[type] && SEND_TYPE_MAP[type].type) || 'info'; },
    onViewDetail(row) { this.$refs.orderDetailDrawer.open(row.orderSn); },
  },
};
</script>

<style scoped>
.price-text { color: #f56c6c; font-weight: 600; }
.goods-cell { display: flex; align-items: center; }
</style>
