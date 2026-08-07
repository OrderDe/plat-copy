<template>
  <div class="app-container">
    <el-form :inline="true" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="load">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品ID"><el-input v-model="query.productId" clearable style="width:120px" /></el-form-item>
      <el-form-item label="日期区间">
        <el-date-picker v-model="dateRange" type="daterange" value-format="yyyy-MM-dd" @change="onDateChange" />
      </el-form-item>
      <el-form-item><el-button type="primary" @click="load">查询</el-button></el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column label="仓库" min-width="200"><template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template></el-table-column>
      <el-table-column prop="productId" label="商品ID" min-width="110" />
      <el-table-column prop="inQty" label="入库量" min-width="100" />
      <el-table-column prop="outQty" label="出库量" min-width="100" />
      <el-table-column prop="endingStock" label="期末库存" min-width="100" />
      <el-table-column label="周转率" min-width="120">
        <template slot-scope="{row}">
          <b :class="rateColor(row.turnoverRate)">{{ row.turnoverRate == null ? '-' : (row.turnoverRate * 100).toFixed(2) + '%' }}</b>
        </template>
      </el-table-column>
      <el-table-column label="周转天数" min-width="120">
        <template slot-scope="{row}">{{ row.turnoverDays == null ? '-' : row.turnoverDays + ' 天' }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="load"
    />
  </div>
</template>

<script>
import { reportApi, warehouseApi } from '@/api/warehouse';

export default {
  name: 'WarehouseTurnover',
  data() {
    const now = new Date(); const past = new Date(); past.setDate(past.getDate() - 30);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      loading: false, total: 0, tableData: [], warehouseList: [],
      dateRange: [fmt(past), fmt(now)],
      query: { page: 1, limit: 20, warehouseId: null, productId: null, startDate: fmt(past), endDate: fmt(now) },
    };
  },
  created() { this.loadWarehouses(); this.load(); },
  methods: {
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    rateColor(r) { if (r == null) return ''; if (r >= 1) return 'high'; if (r >= 0.3) return 'mid'; return 'low'; },
    onDateChange(v) { if (v && v.length === 2) { this.query.startDate = v[0]; this.query.endDate = v[1]; } this.load(); },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async load() {
      this.loading = true;
      try { const r = await reportApi.turnover(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.high { color: #67c23a; }
.mid { color: #e6a23c; }
.low { color: #f56c6c; }
</style>
