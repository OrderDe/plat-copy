<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="保质期(天)">
        <el-input-number v-model="query.shelfLifeDays" :min="1" :max="9999" size="small" />
      </el-form-item>
      <el-form-item label="预警(天)">
        <el-input-number v-model="query.warnDays" :min="1" :max="365" size="small" />
      </el-form-item>
      <el-form-item label="仓库ID">
        <el-input v-model="query.warehouseId" placeholder="仓库ID" clearable style="width:120px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:8px;color:#909399;font-size:13px">
      规则: 入库明细的 (生产日期 + 保质期天数 - 今天) ≤ 预警天数 且未过期，显示在此。
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="warehouseId" label="仓库ID" width="90" />
      <el-table-column prop="inboundCode" label="入库单号" width="180" />
      <el-table-column prop="productId" label="商品ID" width="140" />
      <el-table-column prop="goodsName" label="商品名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="productionDate" label="生产日期" width="120" />
      <el-table-column prop="expireDate" label="到期日期" width="120" />
      <el-table-column label="剩余天数" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.remainDays <= 7 ? 'danger' : row.remainDays <= 15 ? 'warning' : ''" size="mini">
            {{ row.remainDays }} 天
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="stockNum" label="入库数量" width="100" />
    </el-table>
  </div>
</template>

<script>
import { expiryApi } from '@/api/warehouse';

export default {
  name: 'WarehouseExpiry',
  data() {
    return {
      loading: false, tableData: [],
      query: { shelfLifeDays: 365, warnDays: 30, warehouseId: null },
    };
  },
  created() { this.loadData(); },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const res = await expiryApi.warning(this.query);
        this.tableData = res.data || [];
      } finally { this.loading = false; }
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
</style>
