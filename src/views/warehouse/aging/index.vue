<template>
  <div class="app-container">
    <el-form :inline="true" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="load">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品ID"><el-input v-model="query.productId" clearable style="width:130px" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column label="仓库" width="200"><template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template></el-table-column>
      <el-table-column prop="productId" label="商品ID" width="110" />
      <el-table-column prop="totalStock" label="总库存" width="100" />
      <el-table-column label="0-30天" width="100"><template slot-scope="{row}"><span class="b1">{{ row.bucket030 }}</span></template></el-table-column>
      <el-table-column label="31-60天" width="100"><template slot-scope="{row}"><span class="b2">{{ row.bucket3160 }}</span></template></el-table-column>
      <el-table-column label="61-90天" width="100"><template slot-scope="{row}"><span class="b3">{{ row.bucket6190 }}</span></template></el-table-column>
      <el-table-column label=">90天" width="100"><template slot-scope="{row}"><span class="b4">{{ row.bucket90plus }}</span></template></el-table-column>
      <el-table-column prop="earliestInbound" label="最早入库" width="130" />
      <el-table-column prop="maxAgingDays" label="最大库龄(天)" width="130" />
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
  name: 'WarehouseAging',
  data() {
    return {
      loading: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, warehouseId: null, productId: null },
    };
  },
  created() { this.loadWarehouses(); this.load(); },
  methods: {
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async load() {
      this.loading = true;
      try { const r = await reportApi.aging(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.b1 { color: #67c23a; }
.b2 { color: #909399; }
.b3 { color: #e6a23c; font-weight: 600; }
.b4 { color: #f56c6c; font-weight: 600; }
</style>
