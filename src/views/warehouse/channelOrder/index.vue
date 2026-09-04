<template>
  <div class="divBox">
    <el-card shadow="never" :bordered="false" class="filter-card">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" filterable clearable placeholder="全部已分仓订单" @change="loadList(1)">
            <el-option v-for="item in warehouseList" :key="item.id" :label="item.name || item.code || `仓库#${item.id}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model.trim="query.outOrderNo" clearable placeholder="第三方订单号" @keyup.enter.native="loadList(1)" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" @change="loadList(1)">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList(1)">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :bordered="false" class="box-card mt14">
      <el-alert
        title="此页面只展示已经分配到发货仓库的私域渠道订单和商品明细，导入、分仓、发货请在平台端渠道订单页面操作。"
        type="info"
        :closable="false"
        show-icon
      />
      <el-table v-loading="loading" :data="list" size="small" class="table mt20" border>
        <el-table-column prop="orderNo" label="我方订单号" min-width="165" />
        <el-table-column prop="outOrderNo" label="第三方订单号" min-width="160" />
        <el-table-column prop="channelName" label="渠道" min-width="120" />
        <el-table-column label="商品概要" min-width="280">
          <template slot-scope="scope">{{ itemSummary(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="收货人" min-width="145">
          <template slot-scope="scope">{{ scope.row.realName || '-' }}<br /><span class="muted">{{ scope.row.userPhone || '' }}</span></template>
        </el-table-column>
        <el-table-column prop="totalNum" label="件数" width="70" />
        <el-table-column prop="warehouseId" label="仓库 ID" width="90" />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope"><el-tag size="mini" :type="statusType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="outboundCode" label="WMS 出库单" min-width="140" />
        <el-table-column label="操作" width="80" fixed="right">
          <template slot-scope="scope"><el-button type="text" size="small" @click="showDetail(scope.row)">查看商品</el-button></template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :current-page="query.page" :page-size="query.limit" :page-sizes="[10, 20, 50, 100]" :total="total" @size-change="changeSize" @current-change="loadList" />
      </div>
    </el-card>

    <el-dialog title="渠道订单与商品明细" :visible.sync="detailVisible" width="900px">
      <el-descriptions v-if="detail" :column="3" border size="small">
        <el-descriptions-item label="我方订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="第三方订单号">{{ detail.outOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detail.channelName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仓库 ID">{{ detail.warehouseId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ detail.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货电话">{{ detail.userPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="3">{{ address(detail) }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detail && detail.items" :data="detail.items" border size="small" class="mt14">
        <el-table-column prop="productName" label="商品名称" min-width="230" />
        <el-table-column prop="sourceProductName" label="来源/店铺" min-width="150" />
        <el-table-column prop="sku" label="规格" min-width="170" />
        <el-table-column prop="outSkuCode" label="商品编码" min-width="180" />
        <el-table-column prop="num" label="数量" width="70" />
        <el-table-column label="SKU 匹配" width="100"><template slot-scope="scope"><el-tag size="mini" :type="scope.row.attrValueId ? 'success' : 'danger'">{{ scope.row.attrValueId ? '已匹配' : '待匹配' }}</el-tag></template></el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { warehouseApi } from '@/api/warehouse';
import { warehouseChannelOrderListApi, warehouseChannelOrderDetailApi } from '@/api/channel';

const STATUS = { 0: '待发货', 1: '仓库处理中', 2: '已发货', 3: '已取消' };

export default {
  name: 'WarehouseChannelOrder',
  data() {
    return {
      loading: false,
      warehouseList: [],
      list: [],
      total: 0,
      query: { page: 1, limit: 20, warehouseId: null, outOrderNo: '', status: null },
      statusOptions: Object.keys(STATUS).map((value) => ({ value: Number(value), label: STATUS[value] })),
      detailVisible: false,
      detail: null,
    };
  },
  created() {
    this.loadWarehouses();
    this.loadList(1);
  },
  methods: {
    loadWarehouses() {
      warehouseApi.page({ page: 1, limit: 999 }).then((res) => { this.warehouseList = (res && (res.list || res.records)) || []; }).catch(() => {});
    },
    clean(params) {
      const result = {};
      Object.keys(params).forEach((key) => { if (params[key] !== '' && params[key] !== null && params[key] !== undefined) result[key] = params[key]; });
      return result;
    },
    loadList(page) {
      if (page) this.query.page = page;
      this.loading = true;
      warehouseChannelOrderListApi(this.clean(this.query)).then((res) => {
        this.list = (res && (res.list || res.records)) || [];
        this.total = Number((res && res.total) || 0);
      }).finally(() => { this.loading = false; });
    },
    changeSize(size) { this.query.limit = size; this.loadList(1); },
    resetQuery() { this.query = { page: 1, limit: 20, warehouseId: null, outOrderNo: '', status: null }; this.loadList(1); },
    statusText(value) { return STATUS[value] || '-'; },
    statusType(value) { return { 0: 'warning', 1: 'info', 2: 'success', 3: 'danger' }[value] || 'info'; },
    address(row) { return [row.province, row.city, row.district, row.detailAddress].filter(Boolean).join('') || '-'; },
    itemSummary(row) {
      if (!row.items || !row.items.length) return '暂无商品明细';
      return row.items.map((item) => `${item.productName || item.outSkuCode || '未命名商品'} × ${item.num || 0}`).join('；');
    },
    showDetail(row) {
      if (!row.warehouseId) { this.$message.warning('该订单尚未分配发货仓库'); return; }
      warehouseChannelOrderDetailApi(row.orderNo, row.warehouseId).then((res) => { this.detail = res || row; this.detailVisible = true; });
    },
  },
};
</script>

<style scoped>
.filter-card { margin-bottom: 14px; }
.pagination { text-align: right; margin-top: 20px; }
.muted { color: #999; font-size: 12px; }
</style>
