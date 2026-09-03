<template>
  <div class="app-container stock-expired-page">
    <el-alert
      title="过期批次库存仅供查看，不会自动从可用库存中扣除；是否报损/退供应商需仓管人工处理"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />

    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品ID">
        <el-input v-model="query.productId" placeholder="ID" clearable style="width:130px" />
      </el-form-item>
      <el-form-item label="所属商户">
        <el-select v-model="query.merId" filterable clearable placeholder="全部" style="width:180px" @change="onSearch">
          <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="仓库" width="180" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.warehouseName || warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="货架 / 库位" width="160" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-if="row.shelfCode">{{ row.shelfCode }}<span v-if="row.locationCode"> / {{ row.locationCode }}</span></span>
          <el-tag v-else type="warning" size="mini">未上架</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="批次 / 效期" width="200">
        <template slot-scope="{row}">
          <div>{{ row.batchNo || '-' }}</div>
          <div class="expire-text">{{ row.expiryDate }}（已过期 {{ overdueDays(row.expiryDate) }} 天）</div>
        </template>
      </el-table-column>
      <el-table-column label="商品" min-width="180" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.productName || row.productId }}</template>
      </el-table-column>
      <el-table-column label="规格" min-width="140" show-overflow-tooltip>
        <template slot-scope="{row}">
          <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
          <span v-else style="color:#c0c4cc">未指定</span>
        </template>
      </el-table-column>
      <el-table-column prop="barCode" label="条码" width="130" show-overflow-tooltip />
      <el-table-column label="所属商户" width="140">
        <template slot-scope="{row}">
          <span v-if="row.merId">{{ row.merName || merchantName(row.merId) }}</span>
          <span v-else style="color:#c0c4cc">历史</span>
        </template>
      </el-table-column>
      <el-table-column label="总库存" width="80" prop="stockNum" />
      <el-table-column label="可用" width="80"><template slot-scope="{row}"><b class="text-success">{{ row.availableNum || 0 }}</b></template></el-table-column>
      <el-table-column label="预占" width="80"><template slot-scope="{row}"><span class="text-warn">{{ row.occupiedNum || 0 }}</span></template></el-table-column>
      <el-table-column label="冻结" width="80"><template slot-scope="{row}"><span class="text-danger">{{ row.frozenNum || 0 }}</span></template></el-table-column>
      <el-table-column label="金额" width="110">
        <template slot-scope="{row}"><span class="text-warn">{{ row.totalCost ? Number(row.totalCost).toFixed(2) : '-' }}</span></template>
      </el-table-column>
      <el-table-column label="更新时间" width="160">
        <template slot-scope="{row}">{{ formatDateTime(row.updateTime) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="stock-pagination"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, sizes, prev, pager, next"
      @size-change="loadPage"
      @current-change="loadPage"
    />
  </div>
</template>

<script>
import { stockApi, warehouseApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';
import { formatDateTime } from '../components/dateTime';

export default {
  name: 'WarehouseStockExpired',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      warehouseList: [],
      merchantList: [],
      query: { page: 1, limit: 20, warehouseId: null, merId: null, productId: null },
    };
  },
  created() {
    this.loadWarehouses();
    this.loadMerchants();
    this.loadPage();
  },
  methods: {
    formatDateTime,
    warehouseText(id) {
      const w = this.warehouseList.find((x) => x.id === id);
      return w ? `${w.code} / ${w.name}` : id || '-';
    },
    merchantName(id) {
      const m = this.merchantList.find((x) => x.id === id);
      return m ? m.name : '商户#' + id;
    },
    overdueDays(expiryDate) {
      if (!expiryDate) return 0;
      const diff = Date.now() - new Date(expiryDate).getTime();
      return Math.max(Math.floor(diff / 86400000), 0);
    },
    async loadMerchants() {
      try {
        const r = await merchantListApi({ page: 1, limit: 999 });
        this.merchantList = (r && r.list) || (r && r.records) || [];
      } catch (e) {}
    },
    async loadWarehouses() {
      try {
        const res = await warehouseApi.page({ page: 1, limit: 999 });
        this.warehouseList = (res && res.list) || [];
      } catch (e) {}
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await stockApi.pageExpired(this.query);
        this.list = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally {
        this.loading = false;
      }
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, warehouseId: null, merId: null, productId: null };
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.text-success { color: #67c23a; }
.text-warn { color: #e6a23c; }
.text-danger { color: #f56c6c; }
.expire-text { margin-top: 3px; font-size: 12px; color: #f56c6c; }
.stock-pagination {
  margin-top: 0;
  padding: 14px 8px;
  border: 1px solid #ebeef5;
  border-top: 0;
  background: #fafbfc;
  text-align: right;
}
</style>
