<template>
  <div class="app-container warehouse-dashboard" v-loading="loading">
    <section class="dashboard-hero">
      <div class="hero-copy">
        <div class="hero-icon"><i class="el-icon-data-analysis" /></div>
        <div>
          <h2>仓储运营总览</h2>
          <p>集中查看库存结构、仓储资源、风险预警和作业趋势</p>
        </div>
      </div>
      <div class="hero-actions">
        <div class="filter-control">
          <span>统计仓库</span>
          <el-select v-model="warehouseId" filterable clearable placeholder="全部仓库" @change="load">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </div>
        <div class="filter-control days-control">
          <span>趋势周期</span>
          <el-select v-model="trendDays" @change="load">
            <el-option label="近 7 天" :value="7" />
            <el-option label="近 14 天" :value="14" />
            <el-option label="近 30 天" :value="30" />
          </el-select>
        </div>
        <el-button type="primary" icon="el-icon-refresh" :loading="loading" @click="load">刷新数据</el-button>
      </div>
    </section>

    <div class="update-line">
      <span><i class="el-icon-location-outline" /> {{ selectedWarehouseName }}</span>
      <span><i class="el-icon-time" /> 数据更新于 {{ lastUpdated || '加载中' }}</span>
    </div>

    <section class="primary-grid">
      <article v-for="item in primaryMetrics" :key="item.key" class="primary-card" :style="{ '--metric-color': item.color }">
        <div class="metric-icon" :style="{ color: item.color, background: item.background }"><i :class="item.icon" /></div>
        <div class="metric-content">
          <div class="metric-title">{{ item.title }}</div>
          <div class="metric-number"><strong>{{ item.value }}</strong><span>{{ item.unit }}</span></div>
          <div class="metric-subtitle">{{ item.subtitle }}</div>
        </div>
      </article>
    </section>

    <section class="dashboard-content">
      <div class="panel trend-panel">
        <div class="panel-header">
          <div>
            <h3>出入库趋势</h3>
            <p>近 {{ trendDays }} 天库存流动情况</p>
          </div>
          <div class="trend-summary">
            <span class="legend-dot in-dot" />入库 <b>{{ formatNumber(trendTotals.inNum) }}</b>
            <span class="legend-dot out-dot" />出库 <b>{{ formatNumber(trendTotals.outNum) }}</b>
          </div>
        </div>
        <div v-if="chartRows.length" class="chart-scroll">
          <div class="bar-chart" :style="{ minWidth: chartMinWidth + 'px' }">
            <div v-for="row in chartRows" :key="row.date" class="chart-group" :title="`${row.date} 入库 ${row.inNum || 0}，出库 ${row.outNum || 0}`">
              <div class="chart-bars">
                <div class="bar-column">
                  <span class="bar-value">{{ row.inNum || 0 }}</span>
                  <div class="vertical-bar bar-in" :style="{ height: barHeight(row.inNum) + 'px' }" />
                </div>
                <div class="bar-column">
                  <span class="bar-value">{{ row.outNum || 0 }}</span>
                  <div class="vertical-bar bar-out" :style="{ height: barHeight(row.outNum) + 'px' }" />
                </div>
              </div>
              <div class="chart-date">{{ formatTrendDate(row.date) }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-chart">
          <i class="el-icon-data-line" />
          <span>当前周期暂无出入库数据</span>
        </div>
        <div class="chart-legend">
          <span><i class="legend-dot in-dot" />入库数量</span>
          <span><i class="legend-dot out-dot" />出库数量</span>
        </div>
      </div>

      <aside class="side-column">
        <div class="panel resource-panel">
          <div class="panel-header compact-header">
            <div><h3>仓储资源</h3><p>基础设施与商品规模</p></div>
          </div>
          <div class="resource-grid">
            <div v-for="item in resourceMetrics" :key="item.key" class="resource-item">
              <div class="resource-icon" :style="{ color: item.color, background: item.background }"><i :class="item.icon" /></div>
              <div><span>{{ item.title }}</span><strong>{{ item.value }}</strong></div>
            </div>
          </div>
        </div>

        <div class="panel attention-panel">
          <div class="panel-header compact-header">
            <div><h3>库存健康与待办</h3><p>需要关注的异常和作业</p></div>
            <span class="attention-count">{{ attentionCount }} 项待关注</span>
          </div>
          <div class="attention-list">
            <!-- 带 link 的条目可下钻到对应清单页，点整行都算（不止数字） -->
            <div
              v-for="item in attentionMetrics"
              :key="item.key"
              class="attention-item"
              :class="{ 'has-risk': item.risk, 'is-linked': !!item.link }"
              @click="onAttentionClick(item)"
            >
              <div class="attention-name">
                <i :class="item.icon" :style="{ color: item.color }" />{{ item.title }}
                <i v-if="item.link" class="el-icon-top-right attention-link-icon" />
              </div>
              <div class="attention-value"><b :style="{ color: item.risk ? item.color : '#303133' }">{{ item.value }}</b><span>{{ item.unit }}</span></div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script>
import { reportApi, warehouseApi } from '@/api/warehouse';

export default {
  name: 'WarehouseDashboard',
  data() {
    return {
      loading: false,
      warehouseId: null,
      trendDays: 7,
      warehouseList: [],
      data: {},
      chartRows: [],
      lastUpdated: '',
    };
  },
  computed: {
    selectedWarehouseName() {
      if (!this.warehouseId) return '全部仓库';
      const current = this.warehouseList.find(item => item.id === this.warehouseId);
      return current ? `${current.code} / ${current.name}` : '当前仓库';
    },
    maxTrend() {
      let max = 1;
      this.chartRows.forEach(row => { max = Math.max(max, Number(row.inNum || 0), Number(row.outNum || 0)); });
      return max;
    },
    chartMinWidth() {
      return Math.max(620, this.chartRows.length * 68);
    },
    trendTotals() {
      return this.chartRows.reduce((result, row) => ({
        inNum: result.inNum + Number(row.inNum || 0),
        outNum: result.outNum + Number(row.outNum || 0),
      }), { inNum: 0, outNum: 0 });
    },
    primaryMetrics() {
      const total = Number(this.data.totalStock || 0);
      const available = Number(this.data.availableStock || 0);
      const availableRate = total > 0 ? (available * 100 / total).toFixed(1) : '0.0';
      return [
        { key: 'total', title: '总库存件数', value: this.formatNumber(total), unit: '件', subtitle: `共 ${this.formatNumber(this.data.skuCount)} 个 SKU`, icon: 'el-icon-box', color: '#316cff', background: '#edf3ff' },
        { key: 'available', title: '可用库存', value: this.formatNumber(available), unit: '件', subtitle: `占总库存 ${availableRate}%`, icon: 'el-icon-circle-check', color: '#22a66f', background: '#eaf8f2' },
        { key: 'occupied', title: '预占库存', value: this.formatNumber(this.data.occupiedStock), unit: '件', subtitle: '已被订单或作业占用', icon: 'el-icon-time', color: '#e89521', background: '#fff6e8' },
        { key: 'frozen', title: '冻结库存', value: this.formatNumber(this.data.frozenStock), unit: '件', subtitle: '暂不可参与出入库', icon: 'el-icon-lock', color: '#ef5b62', background: '#fff0f1' },
      ];
    },
    resourceMetrics() {
      return [
        { key: 'warehouse', title: '仓库', value: this.formatNumber(this.data.warehouseCount), icon: 'el-icon-office-building', color: '#316cff', background: '#edf3ff' },
        { key: 'shelf', title: '货架', value: this.formatNumber(this.data.shelfCount), icon: 'el-icon-s-grid', color: '#22a66f', background: '#eaf8f2' },
        { key: 'location', title: '库位', value: this.formatNumber(this.data.locationCount), icon: 'el-icon-location-outline', color: '#8b5cf6', background: '#f3efff' },
        { key: 'sku', title: 'SKU', value: this.formatNumber(this.data.skuCount), icon: 'el-icon-goods', color: '#e89521', background: '#fff6e8' },
      ];
    },
    attentionMetrics() {
      const metrics = [
        { key: 'utilization', title: '库位利用率', value: this.displayValue(this.data.locationUtilization), unit: '%', icon: 'el-icon-pie-chart', color: '#8b5cf6', risk: false },
        { key: 'low', title: '库存预警商品', value: this.formatNumber(this.data.lowStockCount), unit: '个', icon: 'el-icon-warning-outline', color: '#ef5b62', risk: Number(this.data.lowStockCount || 0) > 0 },
        { key: 'expiring', title: '30 天内临期批次', value: this.formatNumber(this.data.expiringBatchCount), unit: '批', icon: 'el-icon-alarm-clock', color: '#e89521', risk: Number(this.data.expiringBatchCount || 0) > 0 },
        { key: 'expired', title: '已过期批次', value: this.formatNumber(this.data.expiredBatchCount), unit: '批', icon: 'el-icon-circle-close', color: '#ef5b62', risk: Number(this.data.expiredBatchCount || 0) > 0 },
        /*
         * 这两条带 link：作业类待办点了要能直接去处理，不然看到数字还得自己找菜单。
         * 待复核走 /warehouse/review（跨波次全局清单，路由 hidden 不占菜单）——
         * 波次页里也能复核，但那是单波次视角，差异单跟进得一个波次一个波次翻。
         * 仓库筛选带过去，看板选了哪个仓，下钻后保持一致。
         */
        { key: 'pick', title: '待处理拣货单', value: this.formatNumber(this.data.pendingPickCount), unit: '单', icon: 'el-icon-tickets', color: '#316cff', risk: Number(this.data.pendingPickCount || 0) > 0, link: '/warehouse/wave' },
        { key: 'review', title: '待复核单', value: this.formatNumber(this.data.pendingReviewCount), unit: '单', icon: 'el-icon-document-checked', color: '#8b5cf6', risk: Number(this.data.pendingReviewCount || 0) > 0, link: '/warehouse/review' },
      ];
      return metrics;
    },
    attentionCount() {
      return this.attentionMetrics.filter(item => item.risk).length;
    },
  },
  created() {
    this.loadWarehouses();
    this.load();
  },
  methods: {
    /** 待办条目下钻；没配 link 的（利用率、预警之类）点了不动 */
    onAttentionClick(item) {
      if (!item || !item.link) return;
      const query = this.warehouseId ? { warehouseId: this.warehouseId } : {};
      this.$router.push({ path: item.link, query });
    },
    displayValue(value) {
      return value == null || value === '' ? '0' : value;
    },
    formatNumber(value) {
      const number = Number(value || 0);
      return Number.isFinite(number) ? number.toLocaleString('zh-CN') : '0';
    },
    formatTrendDate(value) {
      if (!value) return '-';
      const text = String(value);
      return text.length >= 10 ? text.substring(5, 10) : text;
    },
    currentTimeText() {
      const now = new Date();
      const pad = value => String(value).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    },
    barHeight(value) {
      const number = Number(value || 0);
      if (number <= 0) return 4;
      return Math.max(12, Math.round(number * 176 / this.maxTrend));
    },
    async loadWarehouses() {
      try {
        const result = await warehouseApi.page({ page: 1, limit: 999 });
        this.warehouseList = (result && result.list) || [];
      } catch (e) { /* 仓库下拉失败不影响总览加载 */ }
    },
    async load() {
      this.loading = true;
      try {
        this.data = await reportApi.dashboard({ warehouseId: this.warehouseId, trendDays: this.trendDays }) || {};
        this.chartRows = this.data.inoutTrend || [];
        this.lastUpdated = this.currentTimeText();
      } finally { this.loading = false; }
    },
  },
};
</script>

<style scoped>
.warehouse-dashboard {
  min-height: calc(100vh - 120px);
  padding: 18px 20px 26px;
  background: #f4f6f9;
}
.dashboard-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 20px 22px;
  color: #fff;
  background: linear-gradient(120deg, #245de8 0%, #367cf4 55%, #5b91ff 100%);
  border-radius: 12px;
  box-shadow: 0 8px 22px rgba(36,93,232,.18);
}
.hero-copy { display: flex; align-items: center; gap: 14px; min-width: 280px; }
.hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  font-size: 24px;
  background: rgba(255,255,255,.16);
  border: 1px solid rgba(255,255,255,.24);
  border-radius: 12px;
}
.hero-copy h2 { margin: 0 0 6px; font-size: 21px; font-weight: 600; letter-spacing: 1px; }
.hero-copy p { margin: 0; color: rgba(255,255,255,.82); font-size: 13px; }
.hero-actions { display: flex; align-items: flex-end; justify-content: flex-end; gap: 12px; }
.filter-control { display: flex; flex-direction: column; gap: 6px; }
.filter-control > span { color: rgba(255,255,255,.82); font-size: 12px; }
.filter-control .el-select { width: 220px; }
.filter-control.days-control .el-select { width: 120px; }
.hero-actions >>> .el-input__inner { border: 0; background: rgba(255,255,255,.96); }
.hero-actions >>> .el-button--primary { color: #245de8; background: #fff; border-color: #fff; }
.update-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 4px 8px;
  color: #8a94a6;
  font-size: 12px;
}
.update-line i { margin-right: 4px; }
.primary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 6px 0 16px; }
.primary-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 112px;
  padding: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(31,45,61,.05);
  transition: transform .2s ease, box-shadow .2s ease;
}
.primary-card::before { position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--metric-color); content: ''; }
.primary-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(31,45,61,.09); }
.metric-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; flex: 0 0 48px; font-size: 22px; border-radius: 12px; }
.metric-content { min-width: 0; }
.metric-title { color: #687386; font-size: 13px; }
.metric-number { margin: 5px 0 3px; color: #202939; white-space: nowrap; }
.metric-number strong { font-size: 27px; font-weight: 650; line-height: 1; }
.metric-number span { margin-left: 5px; color: #8a94a6; font-size: 12px; }
.metric-subtitle { overflow: hidden; color: #a0a8b5; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.dashboard-content { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(340px, .85fr); gap: 16px; align-items: stretch; }
.panel { background: #fff; border: 1px solid #edf0f5; border-radius: 10px; box-shadow: 0 3px 12px rgba(31,45,61,.045); }
.panel-header { display: flex; justify-content: space-between; align-items: center; min-height: 68px; padding: 15px 18px; border-bottom: 1px solid #eef1f5; }
.panel-header h3 { margin: 0 0 5px; color: #273142; font-size: 15px; font-weight: 600; }
.panel-header p { margin: 0; color: #9aa3b1; font-size: 12px; }
.trend-summary { display: flex; align-items: center; gap: 7px; color: #7d8798; font-size: 12px; }
.trend-summary b { margin-right: 8px; color: #303846; font-size: 14px; }
.legend-dot { display: inline-block; width: 8px; height: 8px; margin-right: 4px; border-radius: 50%; }
.in-dot { background: #31b978; }
.out-dot { background: #f3a632; }
.chart-scroll { height: 278px; padding: 20px 20px 0; overflow-x: auto; overflow-y: hidden; }
.bar-chart { display: flex; align-items: flex-end; height: 224px; border-bottom: 1px solid #dfe4eb; background: repeating-linear-gradient(to top, transparent 0, transparent 54px, #f1f3f6 55px); }
.chart-group { display: flex; flex: 1 0 62px; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 62px; height: 100%; }
.chart-bars { display: flex; align-items: flex-end; justify-content: center; gap: 5px; height: 198px; }
.bar-column { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: 21px; height: 100%; }
.bar-value { margin-bottom: 4px; color: #707a8c; font-size: 10px; }
.vertical-bar { width: 18px; min-height: 4px; border-radius: 4px 4px 0 0; transition: height .3s ease; }
.bar-in { background: linear-gradient(180deg, #4bd395, #28ad6e); }
.bar-out { background: linear-gradient(180deg, #ffc05a, #ee9b20); }
.chart-date { height: 26px; padding-top: 8px; color: #8a94a6; font-size: 11px; white-space: nowrap; }
.chart-legend { display: flex; justify-content: center; gap: 24px; padding: 10px 0 14px; color: #7d8798; font-size: 12px; }
.empty-chart { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 278px; color: #a8b0bd; }
.empty-chart i { margin-bottom: 10px; font-size: 34px; }
.side-column { display: flex; flex-direction: column; gap: 16px; }
.compact-header { min-height: 62px; }
.resource-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; padding: 6px 12px 12px; }
.resource-item { display: flex; align-items: center; gap: 10px; padding: 13px 10px; border-bottom: 1px dashed #edf0f4; }
.resource-item:nth-last-child(-n+2) { border-bottom: 0; }
.resource-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex: 0 0 36px; font-size: 17px; border-radius: 9px; }
.resource-item span { display: block; margin-bottom: 3px; color: #8993a3; font-size: 11px; }
.resource-item strong { color: #273142; font-size: 19px; font-weight: 600; }
.attention-panel { flex: 1; }
.attention-count { padding: 4px 8px; color: #ef5b62; font-size: 11px; background: #fff1f2; border-radius: 10px; }
.attention-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 8px 12px 12px; }
.attention-item { display: flex; justify-content: space-between; align-items: center; min-height: 44px; padding: 5px 9px; border-bottom: 1px dashed #edf0f4; }
.attention-item:nth-last-child(-n+2) { border-bottom: 0; }
.attention-item.has-risk { background: linear-gradient(90deg, rgba(245,108,108,.045), transparent); }
/* 可下钻的条目：给个手型 + hover 反馈，让人知道能点 */
.attention-item.is-linked { cursor: pointer; }
.attention-item.is-linked:hover { background: #f3f7ff; }
.attention-item.is-linked:hover .attention-name { color: #316cff; }
.attention-link-icon { width: auto !important; flex: none !important; margin-left: 4px; font-size: 12px !important; color: #b6bdc9; }
.attention-item.is-linked:hover .attention-link-icon { color: #316cff; }
.attention-name { display: flex; align-items: center; min-width: 0; color: #697487; font-size: 11px; }
.attention-name i { width: 18px; flex: 0 0 18px; margin-right: 4px; font-size: 14px; }
.attention-value { margin-left: 8px; white-space: nowrap; }
.attention-value b { font-size: 16px; }
.attention-value span { margin-left: 2px; color: #a0a8b5; font-size: 10px; }
@media (max-width: 1280px) {
  .dashboard-hero { align-items: flex-start; }
  .hero-actions { flex-wrap: wrap; }
  .primary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-content { grid-template-columns: 1fr; }
  .side-column { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .warehouse-dashboard { padding: 12px; }
  .dashboard-hero, .hero-actions { flex-direction: column; width: 100%; }
  .hero-actions { align-items: stretch; }
  .filter-control .el-select, .filter-control.days-control .el-select { width: 100%; }
  .update-line { align-items: flex-start; flex-direction: column; gap: 5px; }
  .primary-grid, .side-column { grid-template-columns: 1fr; }
  .trend-summary { display: none; }
}
</style>
