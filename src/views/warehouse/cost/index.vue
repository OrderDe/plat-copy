<template>
  <div class="app-container">
    <!-- 汇总卡片 -->
    <el-row :gutter="16" style="margin-bottom:16px" v-loading="sumLoading">
      <el-col :span="6"><div class="stat" style="border-left-color:#409eff">
        <div class="t">有库存 SKU 数</div><div class="v" style="color:#409eff">{{ summary.skuCount || 0 }}</div>
      </div></el-col>
      <el-col :span="6"><div class="stat" style="border-left-color:#67c23a">
        <div class="t">库存总件数</div><div class="v" style="color:#67c23a">{{ summary.totalQty || 0 }}</div>
      </div></el-col>
      <el-col :span="6"><div class="stat" style="border-left-color:#e6a23c">
        <div class="t">库存总金额 (元)</div><div class="v" style="color:#e6a23c">{{ fmtMoney(summary.totalAmount) }}</div>
      </div></el-col>
      <el-col :span="6"><div class="stat" style="border-left-color:#f56c6c">
        <div class="t">无成本记录行数</div><div class="v" style="color:#f56c6c">{{ summary.noCostRows || 0 }}</div>
      </div></el-col>
    </el-row>

    <el-alert type="info" :closable="false" style="margin-bottom:12px">
      计价方式：<b>移动加权平均法</b>。入库时 新均价 = (原库存×原均价 + 入库量×进价) ÷ (原库存 + 入库量)；出库按当前均价结转成本。
      入库单明细需填写<b>入库单价</b>才会参与成本核算。
    </el-alert>

    <el-form :inline="true" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="loadAll">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品ID"><el-input v-model="query.productId" clearable style="width:120px" /></el-form-item>
      <el-form-item label="统计区间">
        <el-date-picker v-model="dateRange" type="daterange" value-format="yyyy-MM-dd" @change="onDateChange" />
      </el-form-item>
      <el-form-item><el-button type="primary" @click="loadReport">查询</el-button></el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe show-summary :summary-method="getSummaries">
      <el-table-column prop="warehouseName" label="仓库" width="160" show-overflow-tooltip />
      <el-table-column prop="productId" label="商品ID" width="100" />
      <el-table-column prop="stockNum" label="库存数量" width="100" />
      <el-table-column label="加权均价" width="120">
        <template slot-scope="{row}">
          <span :class="{ 'no-cost': !row.avgCost || row.avgCost == 0 }">{{ fmtCost(row.avgCost) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="库存金额" width="130">
        <template slot-scope="{row}"><b class="amount">{{ fmtMoney(row.totalCost) }}</b></template>
      </el-table-column>
      <el-table-column label="期间入库" width="100"><template slot-scope="{row}">{{ row.inQty || 0 }}</template></el-table-column>
      <el-table-column label="入库金额" width="130">
        <template slot-scope="{row}"><span class="in">{{ fmtMoney(row.inAmount) }}</span></template>
      </el-table-column>
      <el-table-column label="期间出库" width="100"><template slot-scope="{row}">{{ row.outQty || 0 }}</template></el-table-column>
      <el-table-column label="销货成本" width="130">
        <template slot-scope="{row}"><span class="out">{{ fmtMoney(row.outAmount) }}</span></template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openAdjust(row)">调成本</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, sizes, prev, pager, next" @size-change="loadReport" @current-change="loadReport"
    />

    <!-- 调整成本 -->
    <el-dialog title="手工调整成本" :visible.sync="adjustVisible" width="480px">
      <el-alert type="warning" :closable="false" style="margin-bottom:12px">
        用于盘盈盘亏、进价录错等场景。调整后该仓该商品的库存总额会按新均价重算，并写一条成本流水。
      </el-alert>
      <el-form label-width="100px" size="small">
        <el-form-item label="仓库">{{ current.warehouseName }}</el-form-item>
        <el-form-item label="商品ID">{{ current.productId }}</el-form-item>
        <el-form-item label="当前库存">{{ current.stockNum }}</el-form-item>
        <el-form-item label="当前均价">{{ fmtCost(current.avgCost) }}</el-form-item>
        <el-form-item label="当前金额">{{ fmtMoney(current.totalCost) }}</el-form-item>
        <el-divider />
        <el-form-item label="新均价">
          <el-input-number v-model="adjustForm.newAvgCost" :min="0" :precision="4" :step="0.01" style="width:100%" />
        </el-form-item>
        <el-form-item label="调整后金额">
          <b class="amount">{{ fmtMoney((adjustForm.newAvgCost || 0) * (current.stockNum || 0)) }}</b>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.reason" placeholder="如：盘盈成本修正" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="adjustVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onAdjustSubmit">确认调整</el-button>
      </div>
    </el-dialog>
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
      loading: false, sumLoading: false, total: 0, tableData: [], warehouseList: [],
      summary: {},
      dateRange: [fmt(past), fmt(now)],
      query: { page: 1, limit: 20, warehouseId: null, productId: null, startDate: fmt(past), endDate: fmt(now) },
      adjustVisible: false, current: {}, adjustForm: { newAvgCost: 0, reason: '' },
    };
  },
  created() { this.loadWarehouses(); this.loadAll(); },
  methods: {
    fmtMoney(v) {
      const n = Number(v || 0);
      return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    fmtCost(v) {
      const n = Number(v || 0);
      return n === 0 ? '未记成本' : n.toFixed(4);
    },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    loadAll() { this.loadSummary(); this.loadReport(); },
    async loadSummary() {
      this.sumLoading = true;
      try { this.summary = await costApi.summary(this.query.warehouseId) || {}; }
      finally { this.sumLoading = false; }
    },
    async loadReport() {
      this.loading = true;
      try { const r = await costApi.report(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
    onDateChange(v) { if (v && v.length === 2) { this.query.startDate = v[0]; this.query.endDate = v[1]; } this.loadReport(); },
    getSummaries({ columns, data }) {
      const sums = [];
      columns.forEach((col, i) => {
        if (i === 0) { sums[i] = '本页合计'; return; }
        const moneyCols = ['库存金额', '入库金额', '销货成本'];
        const qtyCols = ['库存数量', '期间入库', '期间出库'];
        if (moneyCols.includes(col.label)) {
          const key = col.label === '库存金额' ? 'totalCost' : (col.label === '入库金额' ? 'inAmount' : 'outAmount');
          const t = data.reduce((s, r) => s + Number(r[key] || 0), 0);
          sums[i] = this.fmtMoney(t);
        } else if (qtyCols.includes(col.label)) {
          const key = col.label === '库存数量' ? 'stockNum' : (col.label === '期间入库' ? 'inQty' : 'outQty');
          sums[i] = data.reduce((s, r) => s + Number(r[key] || 0), 0);
        } else sums[i] = '';
      });
      return sums;
    },
    openAdjust(row) {
      this.current = row;
      this.adjustForm = { newAvgCost: Number(row.avgCost || 0), reason: '' };
      this.adjustVisible = true;
    },
    async onAdjustSubmit() {
      await costApi.adjust({
        warehouseId: this.current.warehouseId,
        productId: this.current.productId,
        platformType: this.current.platformType || 0,
        newAvgCost: this.adjustForm.newAvgCost,
        reason: this.adjustForm.reason,
      });
      this.$message.success('成本已调整');
      this.adjustVisible = false;
      this.loadAll();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.stat { background: #fff; border-left: 4px solid #409eff; padding: 14px 16px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
.stat .t { color: #909399; font-size: 12px; margin-bottom: 8px; }
.stat .v { font-size: 22px; font-weight: 600; }
.amount { color: #e6a23c; }
.in { color: #67c23a; }
.out { color: #f56c6c; }
.no-cost { color: #c0c4cc; font-size: 12px; }
</style>
