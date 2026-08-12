<template>
  <div class="app-container report-page" v-loading="loading">
    <section class="report-heading turnover-heading">
      <div class="heading-icon"><i class="el-icon-data-line" /></div>
      <div><h2>周转率分析</h2><p>衡量库存流动效率，辅助发现周转缓慢和库存积压商品</p></div>
      <div class="heading-tip"><i class="el-icon-date" /> {{ query.startDate }} 至 {{ query.endDate }}</div>
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
        <el-form-item label="统计区间"><el-date-picker v-model="dateRange" type="daterange" value-format="yyyy-MM-dd" @change="onDateChange" /></el-form-item>
        <el-form-item><el-button type="primary" icon="el-icon-search" @click="load">查询分析</el-button></el-form-item>
      </el-form>
    </section>

    <section class="metric-grid">
      <div class="metric-card stock-card"><div class="metric-icon"><i class="el-icon-box" /></div><div><span>当前页期末库存</span><strong>{{ formatNumber(pageSummary.endingStock) }}</strong><small>件</small></div></div>
      <div class="metric-card in-card"><div class="metric-icon"><i class="el-icon-bottom" /></div><div><span>期间入库量</span><strong>{{ formatNumber(pageSummary.inQty) }}</strong><small>件</small></div></div>
      <div class="metric-card out-card"><div class="metric-icon"><i class="el-icon-top" /></div><div><span>期间出库量</span><strong>{{ formatNumber(pageSummary.outQty) }}</strong><small>件</small></div></div>
      <div class="metric-card rate-card"><div class="metric-icon"><i class="el-icon-data-analysis" /></div><div><span>平均周转率</span><strong>{{ pageSummary.avgRate }}</strong><small>%</small></div></div>
    </section>

    <section class="table-panel">
      <div class="panel-header">
        <div><h3>周转明细</h3><p>周转率越高表示库存流动效率越好</p></div>
        <div class="rate-legend"><span class="legend high-dot" />高效 <span class="legend mid-dot" />一般 <span class="legend low-dot" />偏低</div>
      </div>
      <el-table :data="tableData" stripe class="report-table">
        <el-table-column label="仓库" min-width="230"><template slot-scope="{row}"><b class="warehouse-name">{{ warehouseText(row.warehouseId) }}</b></template></el-table-column>
        <el-table-column label="商品ID" min-width="120"><template slot-scope="{row}"><el-tag size="mini" type="info">{{ row.productId }}</el-tag></template></el-table-column>
        <el-table-column label="入库量" min-width="110"><template slot-scope="{row}"><span class="flow-value flow-in"><i class="el-icon-bottom" />{{ row.inQty || 0 }}</span></template></el-table-column>
        <el-table-column label="出库量" min-width="110"><template slot-scope="{row}"><span class="flow-value flow-out"><i class="el-icon-top" />{{ row.outQty || 0 }}</span></template></el-table-column>
        <el-table-column label="期末库存" min-width="120"><template slot-scope="{row}"><b>{{ row.endingStock || 0 }}</b></template></el-table-column>
        <el-table-column label="周转率" min-width="140">
          <template slot-scope="{row}"><span class="rate-badge" :class="rateColor(row.turnoverRate)">{{ row.turnoverRate == null ? '-' : (row.turnoverRate * 100).toFixed(2) + '%' }}</span></template>
        </el-table-column>
        <el-table-column label="周转天数" min-width="140">
          <template slot-scope="{row}"><span class="days-value">{{ row.turnoverDays == null ? '-' : row.turnoverDays + ' 天' }}</span></template>
        </el-table-column>
      </el-table>
      <div class="panel-footer">
        <span class="footer-note"><i class="el-icon-info" /> 周转率按期间出库量与平均库存计算</span>
        <el-pagination :current-page.sync="query.page" :page-size.sync="query.limit" :total="total" layout="total, prev, pager, next" @current-change="load" />
      </div>
    </section>
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
  computed: {
    pageSummary() {
      const result = this.tableData.reduce((summary, row) => {
        summary.inQty += Number(row.inQty || 0);
        summary.outQty += Number(row.outQty || 0);
        summary.endingStock += Number(row.endingStock || 0);
        if (row.turnoverRate != null) { summary.rateTotal += Number(row.turnoverRate || 0); summary.rateCount += 1; }
        return summary;
      }, { inQty: 0, outQty: 0, endingStock: 0, rateTotal: 0, rateCount: 0 });
      return { ...result, avgRate: result.rateCount ? (result.rateTotal * 100 / result.rateCount).toFixed(2) : '0.00' };
    },
  },
  created() { this.loadWarehouses(); this.load(); },
  methods: {
    formatNumber(value) { return Number(value || 0).toLocaleString('zh-CN'); },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    rateColor(r) { if (r == null) return 'none'; if (r >= 1) return 'high'; if (r >= 0.3) return 'mid'; return 'low'; },
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
.report-page { min-height: calc(100vh - 120px); padding: 18px 20px 28px; background: #f4f6f9; }
.report-heading { display: flex; align-items: center; gap: 14px; padding: 18px 20px; color: #fff; border-radius: 11px; box-shadow: 0 7px 20px rgba(31,163,111,.15); }
.turnover-heading { background: linear-gradient(120deg, #149664, #24b47d 58%, #55c898); }
.heading-icon { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; flex: 0 0 46px; font-size: 23px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.22); border-radius: 11px; }
.report-heading h2 { margin: 0 0 5px; font-size: 20px; font-weight: 600; }
.report-heading p { margin: 0; color: rgba(255,255,255,.8); font-size: 12px; }
.heading-tip { margin-left: auto; padding: 7px 11px; color: rgba(255,255,255,.9); font-size: 12px; background: rgba(255,255,255,.13); border-radius: 16px; }
.filter-panel { display: flex; align-items: center; gap: 24px; margin: 14px 0; padding: 14px 16px 0; background: #fff; border: 1px solid #edf0f5; border-radius: 9px; box-shadow: 0 2px 9px rgba(31,45,61,.04); }
.filter-title { align-self: flex-start; padding-top: 8px; color: #596579; font-size: 13px; font-weight: 600; white-space: nowrap; }
.filter-title i { margin-right: 5px; color: #1fa36f; }
.filter-form { flex: 1; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.metric-card { display: flex; align-items: center; gap: 12px; min-height: 82px; padding: 14px 16px; background: #fff; border: 1px solid #edf0f5; border-radius: 9px; box-shadow: 0 2px 9px rgba(31,45,61,.04); }
.metric-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex: 0 0 40px; font-size: 19px; border-radius: 10px; }
.metric-card span { display: block; margin-bottom: 4px; color: #838d9c; font-size: 12px; }
.metric-card strong { color: #263142; font-size: 23px; }
.metric-card small { margin-left: 4px; color: #9aa3af; }
.stock-card .metric-icon { color: #4f70df; background: #eef2ff; }
.in-card .metric-icon { color: #24a970; background: #eaf8f2; }
.out-card .metric-icon { color: #e69a25; background: #fff6e8; }
.rate-card .metric-icon { color: #8a5bea; background: #f3efff; }
.table-panel { overflow: hidden; background: #fff; border: 1px solid #edf0f5; border-radius: 10px; box-shadow: 0 3px 12px rgba(31,45,61,.045); }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 17px; border-bottom: 1px solid #edf0f4; }
.panel-header h3 { margin: 0 0 4px; color: #2d3748; font-size: 15px; }
.panel-header p { margin: 0; color: #9aa3af; font-size: 11px; }
.rate-legend { color: #8a94a3; font-size: 11px; }
.legend { display: inline-block; width: 7px; height: 7px; margin: 0 4px 0 10px; border-radius: 50%; }
.high-dot { background: #23a76f; } .mid-dot { background: #e69a25; } .low-dot { background: #ed5e65; }
.report-table::before { display: none; }
.report-table >>> th { height: 46px; color: #566276; font-weight: 600; background: #f5f7fb !important; }
.report-table >>> td { height: 52px; border-bottom-color: #eef1f5; }
.warehouse-name { color: #334155; }
.flow-value { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
.flow-in { color: #1f9d66; } .flow-out { color: #d88918; }
.rate-badge { display: inline-block; min-width: 64px; padding: 4px 9px; text-align: center; border-radius: 12px; font-size: 12px; font-weight: 600; }
.rate-badge.high { color: #1f9d66; background: #eaf8f2; }
.rate-badge.mid { color: #d88918; background: #fff5e5; }
.rate-badge.low { color: #e34f57; background: #ffedef; }
.rate-badge.none { color: #98a1af; background: #f1f3f6; }
.days-value { color: #697386; }
.panel-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fafbfc; border-top: 1px solid #edf0f4; }
.footer-note { color: #8b95a5; font-size: 11px; }
@media (max-width: 1100px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } .heading-tip { display: none; } }
</style>
