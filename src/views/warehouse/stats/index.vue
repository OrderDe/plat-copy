<template>
  <div class="app-container">
    <!-- 概要卡片 -->
    <el-row :gutter="16" style="margin-bottom:20px">
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-label">仓库数</div>
          <div class="metric-value">{{ summary.warehouseCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-label">低库存告警</div>
          <div class="metric-value warn">{{ summary.lowStockCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-label">今日入库单</div>
          <div class="metric-value">{{ summary.todayInbound || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-label">今日出库单</div>
          <div class="metric-value">{{ summary.todayOutbound || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-card shadow="hover" style="margin-bottom:20px">
      <div slot="header" class="clearfix">
        <span>出入库趋势</span>
        <el-radio-group v-model="trendDays" size="mini" style="float:right" @change="loadTrend">
          <el-radio-button :label="7">7天</el-radio-button>
          <el-radio-button :label="15">15天</el-radio-button>
          <el-radio-button :label="30">30天</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="trendChart" style="height:320px" />
    </el-card>

    <!-- 各仓库库存 -->
    <el-card shadow="hover">
      <div slot="header"><span>各仓库当前库存</span></div>
      <el-table :data="whStock" border stripe size="small">
        <el-table-column prop="warehouseId" label="仓库ID" width="90" />
        <el-table-column prop="warehouseName" label="仓库名称" min-width="200" />
        <el-table-column prop="skuCount" label="SKU 数" width="100" />
        <el-table-column prop="totalStock" label="总库存" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import echarts from 'echarts';
import { statsApi } from '@/api/warehouse';

export default {
  name: 'WarehouseStats',
  data() {
    return {
      summary: {},
      trendDays: 7,
      trendChart: null,
      whStock: [],
    };
  },
  mounted() {
    this.loadSummary();
    this.loadWhStock();
    this.$nextTick(() => this.loadTrend());
  },
  beforeDestroy() {
    if (this.trendChart) this.trendChart.dispose();
  },
  methods: {
    async loadSummary() {
      const res = await statsApi.summary();
      this.summary = res.data || {};
    },
    async loadWhStock() {
      const res = await statsApi.warehouseStock();
      this.whStock = res.data || [];
    },
    async loadTrend() {
      const res = await statsApi.trend(this.trendDays);
      const rows = res.data || [];
      if (!this.trendChart) {
        this.trendChart = echarts.init(this.$refs.trendChart);
      }
      this.trendChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['入库', '出库'] },
        grid: { left: 40, right: 20, bottom: 40, top: 40 },
        xAxis: { type: 'category', data: rows.map((r) => r.date) },
        yAxis: { type: 'value' },
        series: [
          { name: '入库', type: 'bar', data: rows.map((r) => r.inTotal), itemStyle: { color: '#67c23a' } },
          { name: '出库', type: 'bar', data: rows.map((r) => r.outTotal), itemStyle: { color: '#f56c6c' } },
        ],
      });
    },
  },
};
</script>

<style scoped>
.metric-card { text-align: center; }
.metric-label { color: #909399; font-size: 13px; margin-bottom: 8px; }
.metric-value { font-size: 26px; font-weight: bold; color: #303133; }
.metric-value.warn { color: #f56c6c; }
</style>
