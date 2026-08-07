<template>
  <div class="app-container">
    <el-form :inline="true" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="load">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="呆滞阈值">
        <el-select v-model="query.thresholdDays" style="width:130px" @change="load">
          <el-option label="30 天无出库" :value="30" />
          <el-option label="60 天无出库" :value="60" />
          <el-option label="90 天无出库" :value="90" />
          <el-option label="180 天无出库" :value="180" />
          <el-option label="365 天无出库" :value="365" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column label="仓库" min-width="200"><template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template></el-table-column>
      <el-table-column prop="productId" label="商品ID" min-width="110" />
      <el-table-column prop="currentStock" label="当前库存" min-width="110" />
      <el-table-column prop="lastOutboundTime" label="最后出库时间" min-width="180" />
      <el-table-column label="无出库天数" min-width="130">
        <template slot-scope="{row}">
          <el-tag :type="row.daysSinceLastOut > 180 ? 'danger' : (row.daysSinceLastOut > 90 ? 'warning' : 'info')" size="mini">
            {{ row.daysSinceLastOut }} 天
          </el-tag>
        </template>
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
  name: 'WarehouseSlowMoving',
  data() {
    return {
      loading: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, warehouseId: null, thresholdDays: 90 },
    };
  },
  created() { this.loadWarehouses(); this.load(); },
  methods: {
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async load() {
      this.loading = true;
      try { const r = await reportApi.slowMoving(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
</style>
