<template>
  <div class="app-container">
    <el-form :inline="true" size="small" style="margin-bottom:12px">
      <el-form-item label="仓库">
        <el-select v-model="warehouseId" filterable clearable placeholder="全部仓" style="width:220px" @change="load">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="趋势天数">
        <el-select v-model="trendDays" style="width:110px" @change="load">
          <el-option label="近7天" :value="7" /><el-option label="近14天" :value="14" /><el-option label="近30天" :value="30" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button icon="el-icon-refresh" @click="load">刷新</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="16" v-loading="loading">
      <el-col :span="4"><stat-card title="仓库数" :value="data.warehouseCount" icon="el-icon-office-building" color="#409eff" /></el-col>
      <el-col :span="4"><stat-card title="货架" :value="data.shelfCount" icon="el-icon-s-grid" color="#67c23a" /></el-col>
      <el-col :span="4"><stat-card title="库位" :value="data.locationCount" icon="el-icon-menu" color="#909399" /></el-col>
      <el-col :span="4"><stat-card title="SKU 数" :value="data.skuCount" icon="el-icon-goods" color="#909399" /></el-col>
      <el-col :span="4"><stat-card title="库位利用率%" :value="data.locationUtilization" icon="el-icon-pie-chart" color="#e6a23c" /></el-col>
      <el-col :span="4"><stat-card title="总库存件数" :value="data.totalStock" icon="el-icon-box" color="#67c23a" /></el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:12px">
      <el-col :span="6"><stat-card title="可用库存" :value="data.availableStock" color="#67c23a" /></el-col>
      <el-col :span="6"><stat-card title="预占库存" :value="data.occupiedStock" color="#e6a23c" /></el-col>
      <el-col :span="6"><stat-card title="冻结库存" :value="data.frozenStock" color="#f56c6c" /></el-col>
      <el-col :span="6"><stat-card title="库存预警商品数" :value="data.lowStockCount" color="#f56c6c" /></el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:12px">
      <el-col :span="6"><stat-card title="临期 30 天批次" :value="data.expiringBatchCount" color="#e6a23c" /></el-col>
      <el-col :span="6"><stat-card title="已过期批次" :value="data.expiredBatchCount" color="#f56c6c" /></el-col>
      <el-col :span="6"><stat-card title="待/在拣拣货单" :value="data.pendingPickCount" color="#409eff" /></el-col>
      <el-col :span="6"><stat-card title="待复核单" :value="data.pendingReviewCount" color="#409eff" /></el-col>
    </el-row>

    <el-card style="margin-top:16px">
      <div slot="header">出入库趋势</div>
      <div style="height:280px" v-if="chartRows.length">
        <div class="trend-row" v-for="r in chartRows" :key="r.date">
          <span class="date">{{ r.date }}</span>
          <div class="bar-in" :style="{ width: barWidth(r.inNum, maxTrend) + '%' }">入 {{ r.inNum || 0 }}</div>
          <div class="bar-out" :style="{ width: barWidth(r.outNum, maxTrend) + '%' }">出 {{ r.outNum || 0 }}</div>
        </div>
      </div>
      <div v-else style="color:#909399;text-align:center;padding:30px">暂无趋势数据</div>
    </el-card>
  </div>
</template>

<script>
import { reportApi, warehouseApi } from '@/api/warehouse';

const StatCard = {
  props: ['title', 'value', 'icon', 'color'],
  render(h) {
    return h('div', { class: 'stat-card', style: { borderLeftColor: this.color } }, [
      h('div', { class: 'stat-title' }, this.title),
      h('div', { class: 'stat-value', style: { color: this.color } }, [this.value == null ? '-' : this.value]),
    ]);
  },
};

export default {
  name: 'WarehouseDashboard',
  components: { StatCard },
  data() {
    return {
      loading: false,
      warehouseId: null,
      trendDays: 7,
      warehouseList: [],
      data: {},
      chartRows: [],
    };
  },
  computed: {
    maxTrend() {
      let max = 1;
      this.chartRows.forEach(r => { max = Math.max(max, r.inNum || 0, r.outNum || 0); });
      return max;
    },
  },
  created() { this.loadWarehouses(); this.load(); },
  methods: {
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async load() {
      this.loading = true;
      try {
        this.data = await reportApi.dashboard({ warehouseId: this.warehouseId, trendDays: this.trendDays }) || {};
        this.chartRows = this.data.inoutTrend || [];
      } finally { this.loading = false; }
    },
    barWidth(v, max) { return Math.max(1, Math.min(100, (v || 0) * 100 / max)); },
  },
};
</script>

<style scoped>
.stat-card { background: #fff; border-left: 4px solid #409eff; padding: 14px 16px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
.stat-title { color: #909399; font-size: 12px; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 600; }
.trend-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
.trend-row .date { width: 110px; color: #606266; font-size: 12px; }
.trend-row .bar-in, .trend-row .bar-out {
  height: 22px; line-height: 22px; padding: 0 8px; color: #fff; font-size: 12px; border-radius: 3px; white-space: nowrap;
}
.trend-row .bar-in { background: #67c23a; }
.trend-row .bar-out { background: #e6a23c; }
</style>
