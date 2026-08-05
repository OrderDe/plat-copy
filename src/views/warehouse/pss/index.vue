<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          value-format="yyyy-MM-dd HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          size="small"
        />
      </el-form-item>
      <el-form-item label="仓库ID">
        <el-input v-model="query.warehouseId" placeholder="仓库ID" clearable style="width:120px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="warehouseId" label="仓库ID" width="80" />
      <el-table-column prop="warehouseName" label="仓库名称" width="150" />
      <el-table-column prop="productId" label="商品ID" width="140" />
      <el-table-column label="平台" width="90">
        <template slot-scope="{row}">
          {{ row.platformType === 0 ? '自研' : '怡亚通' }}
        </template>
      </el-table-column>
      <el-table-column label="采购/入库" width="110">
        <template slot-scope="{row}">
          <span style="color:#67c23a">+{{ row.inboundTotal }}</span>
        </template>
      </el-table-column>
      <el-table-column label="销售/出库" width="110">
        <template slot-scope="{row}">
          <span style="color:#f56c6c">-{{ row.outboundTotal }}</span>
        </template>
      </el-table-column>
      <el-table-column label="报损" width="90">
        <template slot-scope="{row}">
          <span style="color:#e6a23c">-{{ row.damageTotal }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调拨" width="90">
        <template slot-scope="{row}">
          <span>{{ row.transferTotal }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前库存" width="100">
        <template slot-scope="{row}">
          <b>{{ row.currentStock }}</b>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { pssApi } from '@/api/warehouse';

export default {
  name: 'WarehousePss',
  data() {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    return {
      loading: false, tableData: [],
      dateRange: [fmt(monthAgo), fmt(now)],
      query: { warehouseId: null },
    };
  },
  created() { this.loadData(); },
  methods: {
    async loadData() {
      if (!this.dateRange || !this.dateRange.length) {
        return this.$message.warning('请选择时间范围');
      }
      this.loading = true;
      try {
        const res = await pssApi.report({
          startTime: this.dateRange[0],
          endTime: this.dateRange[1],
          warehouseId: this.query.warehouseId || undefined,
        });
        this.tableData = res.data || [];
      } finally { this.loading = false; }
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
</style>
