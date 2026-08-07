<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属商户">
        <el-select v-model="query.merId" clearable filterable placeholder="全部" style="width:180px" @change="onSearch">
          <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品ID">
        <el-input v-model="query.productId" clearable style="width:130px" @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="单号">
        <el-input v-model="query.bizCode" clearable placeholder="入库/出库单号" @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.bizType" clearable placeholder="全部" style="width:140px" @change="onSearch">
          <el-option v-for="(v, k) in bizMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="yyyy-MM-dd HH:mm:ss"
          style="width:340px"
          @change="onSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="createTime" label="时间" width="170" />
      <el-table-column label="仓库" min-width="160" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.warehouseName || warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="所属商户" width="150" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.merId ? merchantName(row.merId) : '平台自营' }}</template>
      </el-table-column>
      <el-table-column prop="productId" label="商品ID" width="90" />
      <el-table-column label="规格" min-width="130" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.sku || '-' }}</template>
      </el-table-column>
      <el-table-column label="业务类型" width="110">
        <template slot-scope="{row}">
          <el-tag size="mini">{{ bizMap[row.bizType] || row.bizType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bizCode" label="关联单号" min-width="180" show-overflow-tooltip />
      <el-table-column label="变动" width="90">
        <template slot-scope="{row}">
          <span :class="(row.changeNum || 0) >= 0 ? 'up' : 'down'">
            {{ (row.changeNum || 0) > 0 ? '+' : '' }}{{ row.changeNum || 0 }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="originalStockNum" label="变动前" width="90" />
      <el-table-column prop="resultStockNum" label="变动后" width="90" />
      <el-table-column label="结存均价" width="110">
        <template slot-scope="{row}">{{ row.afterAvgCost != null ? row.afterAvgCost : '-' }}</template>
      </el-table-column>
      <el-table-column prop="operator" label="操作人" width="120" />
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadPage"
    />
  </div>
</template>

<script>
import { stockRecordApi, warehouseApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';

export default {
  name: 'WarehouseStockRecord',
  data() {
    return {
      loading: false,
      total: 0,
      tableData: [],
      warehouseList: [],
      merchantList: [],
      dateRange: [],
      query: this.emptyQuery(),
      // 与后端 writeRecord 的 bizType 取值一一对应
      bizMap: { 0: '入库', 1: '出库', 2: '盘点', 3: '报损', 4: '调拨', 5: '手动调整', 10: '在途' },
    };
  },
  created() {
    this.loadWarehouse();
    this.loadMerchant();
    this.loadPage();
  },
  methods: {
    emptyQuery() {
      return { page: 1, limit: 20, warehouseId: null, merId: null, productId: null,
        bizCode: '', bizType: null, startTime: null, endTime: null };
    },
    warehouseText(id) {
      const w = this.warehouseList.find(x => x.id === id);
      return w ? `${w.code} / ${w.name}` : (id || '-');
    },
    merchantName(id) {
      const m = this.merchantList.find(x => x.id === id);
      return m ? m.name : ('商户#' + id);
    },
    async loadWarehouse() {
      try {
        const res = await warehouseApi.page({ page: 1, limit: 999 });
        this.warehouseList = (res && res.list) || [];
      } catch (e) { /* 下拉加载失败不影响流水查询 */ }
    },
    async loadMerchant() {
      try {
        const r = await merchantListApi({ page: 1, limit: 999 });
        this.merchantList = (r && r.list) || (r && r.records) || [];
      } catch (e) { /* 同上 */ }
    },
    async loadPage() {
      this.loading = true;
      try {
        this.query.startTime = (this.dateRange && this.dateRange[0]) || null;
        this.query.endTime = (this.dateRange && this.dateRange[1]) || null;
        const res = await stockRecordApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() {
      this.dateRange = [];
      this.query = this.emptyQuery();
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.up { color: #67c23a; }
.down { color: #f56c6c; }
</style>
