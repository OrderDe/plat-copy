<template>
  <div class="app-container report-page">
    <section class="report-heading cost-heading">
      <div class="heading-icon"><i class="el-icon-coin" /></div>
      <div><h2>库存流动明细</h2><p>查看各仓库存数量与统计区间内的出入库流动</p></div>
      <div class="heading-tip"><i class="el-icon-date" /> {{ query.startDate }} 至 {{ query.endDate }}</div>
    </section>

    <section class="metric-grid" v-loading="sumLoading">
      <div class="metric-card sku-card"><div class="metric-icon"><i class="el-icon-goods" /></div><div><span>有库存 SKU 数</span><strong>{{ formatNumber(summary.skuCount) }}</strong><small>个</small></div></div>
      <div class="metric-card qty-card"><div class="metric-icon"><i class="el-icon-box" /></div><div><span>库存总件数</span><strong>{{ formatNumber(summary.totalQty) }}</strong><small>件</small></div></div>
    </section>

    <section class="filter-panel">
      <div class="filter-title"><i class="el-icon-search" /> 筛选条件</div>
      <el-form :inline="true" size="small" class="filter-form">
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" filterable clearable placeholder="全部仓库" style="width:220px" @change="loadAll">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品ID"><el-input v-model="query.productId" clearable placeholder="输入商品ID" style="width:150px" @keyup.enter.native="loadReport" /></el-form-item>
        <el-form-item label="统计区间"><el-date-picker v-model="dateRange" type="daterange" value-format="yyyy-MM-dd" @change="onDateChange" /></el-form-item>
        <el-form-item><el-button type="primary" icon="el-icon-search" @click="loadReport">查询</el-button></el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="panel-header">
        <div><h3>商品库存明细</h3><p>按仓库与商品展示库存数量及区间内出入库数量</p></div>
        <el-tag type="info" effect="plain">共 {{ total }} 条</el-tag>
      </div>
      <el-table v-loading="loading" :data="tableData" stripe show-summary :summary-method="getSummaries" class="report-table">
        <el-table-column prop="warehouseName" label="仓库" min-width="180" show-overflow-tooltip />
        <el-table-column label="商品ID" width="100"><template slot-scope="{row}"><el-tag size="mini" type="info">{{ row.productId }}</el-tag></template></el-table-column>
        <el-table-column label="库存数量" width="110"><template slot-scope="{row}"><b>{{ row.stockNum || 0 }}</b></template></el-table-column>
        <el-table-column label="期间入库" width="105"><template slot-scope="{row}"><span class="qty-in"><i class="el-icon-bottom" />{{ row.inQty || 0 }}</span></template></el-table-column>
        <el-table-column label="期间出库" width="105"><template slot-scope="{row}"><span class="qty-out"><i class="el-icon-top" />{{ row.outQty || 0 }}</span></template></el-table-column>
      </el-table>
      <div class="panel-footer">
        <span class="footer-note"><i class="el-icon-info" /> 出入库数量按当前筛选区间统计</span>
        <el-pagination
          :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
          layout="total, sizes, prev, pager, next" @size-change="loadReport" @current-change="loadReport"
        />
      </div>
    </section>

  </div>
</template>

<script>
import { costApi, warehouseApi } from '@/api/warehouse';

export default {
  name: 'WarehouseCost',
  data() {
    const now = new Date(); const past = new Date(); past.setDate(past.getDate() - 30);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      loading: false, sumLoading: false, total: 0, tableData: [], warehouseList: [], summary: {},
      dateRange: [fmt(past), fmt(now)],
      query: { page: 1, limit: 20, warehouseId: null, productId: null, startDate: fmt(past), endDate: fmt(now) },
    };
  },
  created() { this.loadWarehouses(); this.loadAll(); },
  methods: {
    formatNumber(value) { return Number(value || 0).toLocaleString('zh-CN'); },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    loadAll() { this.loadSummary(); this.loadReport(); },
    async loadSummary() { this.sumLoading = true; try { this.summary = await costApi.summary(this.query.warehouseId) || {}; } finally { this.sumLoading = false; } },
    async loadReport() { this.loading = true; try { const r = await costApi.report(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; } finally { this.loading = false; } },
    onDateChange(v) { if (v && v.length === 2) { this.query.startDate = v[0]; this.query.endDate = v[1]; } this.loadReport(); },
    getSummaries({ columns, data }) {
      const sums = [];
      columns.forEach((col, i) => {
        if (i === 0) { sums[i] = '本页合计'; return; }
        const qtyCols = ['库存数量', '期间入库', '期间出库'];
        if (qtyCols.includes(col.label)) {
          const key = col.label === '库存数量' ? 'stockNum' : (col.label === '期间入库' ? 'inQty' : 'outQty');
          sums[i] = data.reduce((sum, row) => sum + Number(row[key] || 0), 0);
        } else sums[i] = '';
      });
      return sums;
    },
  },
};
</script>

<style scoped>
.report-page { min-height: calc(100vh - 120px); padding: 18px 20px 28px; background: #f4f6f9; }
.report-heading { display: flex; align-items: center; gap: 14px; padding: 18px 20px; color: #fff; border-radius: 11px; box-shadow: 0 7px 20px rgba(217,139,25,.16); }
.cost-heading { background: linear-gradient(120deg, #d58a1f, #eda435 58%, #f4b95f); }
.heading-icon { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; flex: 0 0 46px; font-size: 23px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.24); border-radius: 11px; }
.report-heading h2 { margin: 0 0 5px; font-size: 20px; font-weight: 600; }
.report-heading p { margin: 0; color: rgba(255,255,255,.84); font-size: 12px; }
.heading-tip { margin-left: auto; padding: 7px 11px; color: rgba(255,255,255,.92); font-size: 12px; background: rgba(255,255,255,.15); border-radius: 16px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 14px 0; }
.metric-card { display: flex; align-items: center; gap: 12px; min-height: 86px; padding: 15px 16px; background: #fff; border: 1px solid #edf0f5; border-radius: 9px; box-shadow: 0 2px 9px rgba(31,45,61,.04); }
.metric-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex: 0 0 42px; font-size: 20px; border-radius: 10px; }
.metric-card span { display: block; margin-bottom: 4px; color: #838d9c; font-size: 12px; }
.metric-card strong { color: #263142; font-size: 23px; }
.metric-card small { margin-left: 4px; color: #9aa3af; }
.sku-card .metric-icon { color: #4f70df; background: #eef2ff; }
.qty-card .metric-icon { color: #24a970; background: #eaf8f2; }
.money-card .metric-icon { color: #d98b19; background: #fff5e6; }
.missing-card .metric-icon { color: #ee5c63; background: #fff0f1; }
.missing-card.has-risk { border-color: #ffd4d7; }
.formula-panel { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 13px 16px; color: #6f5a35; background: linear-gradient(90deg, #fff8ec, #fffdf8); border: 1px solid #f8e3bd; border-radius: 9px; }
.formula-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex: 0 0 36px; color: #dc911f; background: #ffedcc; border-radius: 9px; }
.formula-panel b { font-size: 13px; }
.formula-panel p { margin: 3px 0 0; color: #9a835e; font-size: 11px; }
.formula-tip { margin-left: auto; color: #b37b27; font-size: 11px; white-space: nowrap; }
.filter-panel { display: flex; align-items: center; gap: 24px; margin-bottom: 14px; padding: 14px 16px 0; background: #fff; border: 1px solid #edf0f5; border-radius: 9px; box-shadow: 0 2px 9px rgba(31,45,61,.04); }
.filter-title { align-self: flex-start; padding-top: 8px; color: #596579; font-size: 13px; font-weight: 600; white-space: nowrap; }
.filter-title i { margin-right: 5px; color: #dc911f; }
.filter-form { flex: 1; }
.table-panel { overflow: hidden; background: #fff; border: 1px solid #edf0f5; border-radius: 10px; box-shadow: 0 3px 12px rgba(31,45,61,.045); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 17px; border-bottom: 1px solid #edf0f4; }
.panel-header h3 { margin: 0 0 4px; color: #2d3748; font-size: 15px; }
.panel-header p { margin: 0; color: #9aa3af; font-size: 11px; }
.report-table::before { display: none; }
.report-table >>> th { height: 46px; color: #566276; font-weight: 600; background: #f5f7fb !important; }
.report-table >>> td { height: 52px; border-bottom-color: #eef1f5; }
.report-table >>> .el-table__footer-wrapper td { color: #4f5b6c; background: #fafbfc; font-weight: 600; }
.cost-value { color: #485469; font-weight: 600; }
.amount { color: #d98715; }
.in, .qty-in { color: #23a66e; }
.out { color: #ef5b62; }
.qty-out { color: #dc8d1d; }
.qty-in i, .qty-out i { margin-right: 3px; }
.no-cost { display: inline-block; padding: 3px 7px; color: #e34f57; background: #ffedef; border-radius: 10px; font-size: 11px; }
.panel-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fafbfc; border-top: 1px solid #edf0f4; }
.footer-note { color: #8b95a5; font-size: 11px; }
.current-cost-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; padding: 12px; background: #f7f8fa; border-radius: 6px; }
.current-cost-box div:last-child { grid-column: span 2; }
.current-cost-box span { display: block; margin-bottom: 3px; color: #929baa; font-size: 11px; }
.current-cost-box b { color: #394457; }
@media (max-width: 1100px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } .heading-tip, .formula-tip { display: none; } }
</style>
