<template>
  <div class="app-container report-page" v-loading="loading">
    <section class="report-heading aging-heading">
      <div class="heading-icon"><i class="el-icon-time" /></div>
      <div>
        <h2>库龄分析</h2>
        <p>按库存停留时间分层，快速识别长期积压和临近呆滞的商品</p>
      </div>
      <div class="heading-tip"><i class="el-icon-info" /> 数据按当前库存批次计算</div>
    </section>

    <section class="filter-panel">
      <div class="filter-title"><i class="el-icon-search" /> 筛选条件</div>
      <el-form :inline="true" size="small" class="filter-form">
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" filterable clearable placeholder="全部仓库" style="width:220px" @change="load">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品ID"><el-input v-model="query.productId" clearable placeholder="输入商品ID" style="width:150px" @keyup.enter.native="load" /></el-form-item>
        <el-form-item><el-button type="primary" icon="el-icon-search" @click="load">查询分析</el-button></el-form-item>
      </el-form>
    </section>

    <section class="metric-grid">
      <div class="metric-card total-card">
        <div class="metric-icon"><i class="el-icon-box" /></div>
        <div><span>当前页总库存</span><strong>{{ formatNumber(pageSummary.totalStock) }}</strong><small>件</small></div>
      </div>
      <div class="metric-card fresh-card">
        <div class="metric-icon"><i class="el-icon-circle-check" /></div>
        <div><span>0-30 天新鲜库存</span><strong>{{ formatNumber(pageSummary.freshStock) }}</strong><small>件</small></div>
      </div>
      <div class="metric-card watch-card">
        <div class="metric-icon"><i class="el-icon-alarm-clock" /></div>
        <div><span>31-90 天关注库存</span><strong>{{ formatNumber(pageSummary.watchStock) }}</strong><small>件</small></div>
      </div>
      <div class="metric-card risk-card">
        <div class="metric-icon"><i class="el-icon-warning-outline" /></div>
        <div><span>90 天以上积压</span><strong>{{ formatNumber(pageSummary.riskStock) }}</strong><small>件</small></div>
      </div>
    </section>

    <section class="table-panel">
      <div class="panel-header">
        <div><h3>库龄明细</h3><p>颜色越深表示库存停留时间越长</p></div>
        <el-tag type="info" effect="plain">共 {{ total }} 条</el-tag>
      </div>
      <el-table :data="tableData" stripe class="report-table" header-row-class-name="report-table-header">
        <el-table-column label="仓库" min-width="220"><template slot-scope="{row}"><b class="warehouse-name">{{ warehouseText(row.warehouseId) }}</b></template></el-table-column>
        <el-table-column label="商品ID" width="110"><template slot-scope="{row}"><el-tag size="mini" type="info">{{ row.productId }}</el-tag></template></el-table-column>
        <el-table-column label="总库存" width="110"><template slot-scope="{row}"><b>{{ row.totalStock || 0 }}</b></template></el-table-column>
        <el-table-column label="0-30 天" width="110"><template slot-scope="{row}"><span class="age-value age-fresh">{{ row.bucket030 || 0 }}</span></template></el-table-column>
        <el-table-column label="31-60 天" width="110"><template slot-scope="{row}"><span class="age-value age-normal">{{ row.bucket3160 || 0 }}</span></template></el-table-column>
        <el-table-column label="61-90 天" width="110"><template slot-scope="{row}"><span class="age-value age-watch">{{ row.bucket6190 || 0 }}</span></template></el-table-column>
        <el-table-column label=">90 天" width="110"><template slot-scope="{row}"><span class="age-value age-risk">{{ row.bucket90plus || 0 }}</span></template></el-table-column>
        <el-table-column prop="earliestInbound" label="最早入库" width="140" />
        <el-table-column label="最大库龄" width="140">
          <template slot-scope="{row}"><span class="aging-badge" :class="agingLevel(row.maxAgingDays)">{{ row.maxAgingDays || 0 }} 天</span></template>
        </el-table-column>
      </el-table>
      <div class="panel-footer">
        <span class="footer-note"><i class="el-icon-warning-outline" /> 建议优先处理 90 天以上库存</span>
        <el-pagination
          :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
          layout="total, prev, pager, next" @current-change="load"
        />
      </div>
    </section>
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
  computed: {
    pageSummary() {
      return this.tableData.reduce((summary, row) => ({
        totalStock: summary.totalStock + Number(row.totalStock || 0),
        freshStock: summary.freshStock + Number(row.bucket030 || 0),
        watchStock: summary.watchStock + Number(row.bucket3160 || 0) + Number(row.bucket6190 || 0),
        riskStock: summary.riskStock + Number(row.bucket90plus || 0),
      }), { totalStock: 0, freshStock: 0, watchStock: 0, riskStock: 0 });
    },
  },
  created() { this.loadWarehouses(); this.load(); },
  methods: {
    formatNumber(value) { return Number(value || 0).toLocaleString('zh-CN'); },
    agingLevel(days) {
      const value = Number(days || 0);
      if (value > 90) return 'danger';
      if (value > 60) return 'warning';
      return 'normal';
    },
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
.report-page { min-height: calc(100vh - 120px); padding: 18px 20px 28px; background: #f4f6f9; }
.report-heading { display: flex; align-items: center; gap: 14px; padding: 18px 20px; color: #fff; border-radius: 11px; box-shadow: 0 7px 20px rgba(91,93,216,.16); }
.aging-heading { background: linear-gradient(120deg, #5f63d8, #777ae8 60%, #9495f1); }
.heading-icon { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; flex: 0 0 46px; font-size: 23px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.22); border-radius: 11px; }
.report-heading h2 { margin: 0 0 5px; font-size: 20px; font-weight: 600; }
.report-heading p { margin: 0; color: rgba(255,255,255,.8); font-size: 12px; }
.heading-tip { margin-left: auto; padding: 7px 11px; color: rgba(255,255,255,.9); font-size: 12px; background: rgba(255,255,255,.13); border-radius: 16px; }
.filter-panel { display: flex; align-items: center; gap: 24px; margin: 14px 0; padding: 14px 16px 0; background: #fff; border: 1px solid #edf0f5; border-radius: 9px; box-shadow: 0 2px 9px rgba(31,45,61,.04); }
.filter-title { align-self: flex-start; padding-top: 8px; color: #596579; font-size: 13px; font-weight: 600; white-space: nowrap; }
.filter-title i { margin-right: 5px; color: #6569dc; }
.filter-form { flex: 1; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.metric-card { display: flex; align-items: center; gap: 12px; min-height: 82px; padding: 14px 16px; background: #fff; border: 1px solid #edf0f5; border-radius: 9px; box-shadow: 0 2px 9px rgba(31,45,61,.04); }
.metric-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex: 0 0 40px; font-size: 19px; border-radius: 10px; }
.metric-card span { display: block; margin-bottom: 4px; color: #838d9c; font-size: 12px; }
.metric-card strong { color: #263142; font-size: 23px; }
.metric-card small { margin-left: 4px; color: #9aa3af; }
.total-card .metric-icon { color: #4e70df; background: #eef2ff; }
.fresh-card .metric-icon { color: #27a96f; background: #eaf8f2; }
.watch-card .metric-icon { color: #e69a25; background: #fff6e8; }
.risk-card .metric-icon { color: #ee5f66; background: #fff0f1; }
.table-panel { overflow: hidden; background: #fff; border: 1px solid #edf0f5; border-radius: 10px; box-shadow: 0 3px 12px rgba(31,45,61,.045); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 17px; border-bottom: 1px solid #edf0f4; }
.panel-header h3 { margin: 0 0 4px; color: #2d3748; font-size: 15px; }
.panel-header p { margin: 0; color: #9aa3af; font-size: 11px; }
.report-table::before { display: none; }
.report-table >>> th { height: 46px; color: #566276; font-weight: 600; background: #f5f7fb !important; }
.report-table >>> td { height: 50px; border-bottom-color: #eef1f5; }
.warehouse-name { color: #334155; }
.age-value { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 24px; padding: 0 7px; border-radius: 12px; font-weight: 600; }
.age-fresh { color: #1f9d66; background: #eaf8f2; }
.age-normal { color: #667085; background: #f1f3f6; }
.age-watch { color: #d88918; background: #fff5e5; }
.age-risk { color: #e34f57; background: #ffedef; }
.aging-badge { display: inline-block; padding: 4px 9px; color: #657083; background: #f1f3f6; border-radius: 12px; font-size: 12px; }
.aging-badge.warning { color: #d88918; background: #fff5e5; }
.aging-badge.danger { color: #e34f57; background: #ffedef; }
.panel-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fafbfc; border-top: 1px solid #edf0f4; }
.footer-note { color: #9a7a43; font-size: 11px; }
@media (max-width: 1000px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } .heading-tip { display: none; } }
</style>
