<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="仓库ID">
        <el-input v-model="query.warehouseId" placeholder="ID" clearable style="width:120px" />
      </el-form-item>
      <el-form-item label="商品ID">
        <el-input v-model="query.productId" placeholder="ID" clearable style="width:140px" />
      </el-form-item>
      <el-form-item label="平台">
        <el-select v-model="query.platformType" clearable placeholder="全部" style="width:120px">
          <el-option label="自研" :value="0" />
          <el-option label="怡亚通" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="query.lowStockOnly">只看库存预警</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="warehouseId" label="仓库ID" width="90" />
      <el-table-column prop="productId" label="商品ID" width="150" />
      <el-table-column label="平台" width="90">
        <template slot-scope="{row}">
          <el-tag size="mini" :type="row.platformType === 0 ? '' : 'success'">
            {{ row.platformType === 0 ? '自研' : '怡亚通' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="库存" width="100">
        <template slot-scope="{row}">
          <span :class="{ 'warn-stock': row.warnNum > 0 && row.stockNum <= row.warnNum }">{{ row.stockNum }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="lockedStockNum" label="锁定库存" width="100" />
      <el-table-column prop="onTheWayStock" label="在途库存" width="100" />
      <el-table-column prop="warnNum" label="预警下限" width="100" />
      <el-table-column prop="updateTime" label="更新时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openAdjust(row)">调整库存</el-button>
          <el-button type="text" @click="openWarn(row)">设预警</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadPage"
    />

    <!-- 调整库存 -->
    <el-dialog title="调整库存" :visible.sync="adjustVisible" width="440px">
      <p style="color:#666;font-size:12px">增量：正数=入库、负数=出库。会写库存流水并反写商品库。</p>
      <el-form label-width="80px" size="small">
        <el-form-item label="仓库ID">{{ current.warehouseId }}</el-form-item>
        <el-form-item label="商品ID">{{ current.productId }}</el-form-item>
        <el-form-item label="当前库存">{{ current.stockNum }}</el-form-item>
        <el-form-item label="增量">
          <el-input-number v-model="delta" :min="-99999" :max="99999" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="onAdjustSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 设预警 -->
    <el-dialog title="设置预警下限" :visible.sync="warnVisible" width="360px">
      <el-input-number v-model="warnNum" :min="0" :max="99999" />
      <div slot="footer">
        <el-button size="small" @click="warnVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="onWarnSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { stockApi } from '@/api/warehouse';

export default {
  name: 'WarehouseStock',
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      query: { page: 1, limit: 20, warehouseId: null, productId: null, platformType: null, lowStockOnly: false },
      adjustVisible: false,
      warnVisible: false,
      current: {},
      delta: 0,
      warnNum: 0,
    };
  },
  created() { this.loadPage(); },
  methods: {
    async loadPage() {
      this.loading = true;
      try {
        const res = await stockApi.page(this.query);
        this.tableData = res.data.list || [];
        this.total = res.data.total || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() {
      this.query = { page: 1, limit: 20, warehouseId: null, productId: null, platformType: null, lowStockOnly: false };
      this.loadPage();
    },
    openAdjust(row) {
      this.current = row;
      this.delta = 0;
      this.adjustVisible = true;
    },
    async onAdjustSubmit() {
      if (!this.delta) return this.$message.warning('增量不能为 0');
      await stockApi.adjust({
        warehouseId: this.current.warehouseId,
        productId: this.current.productId,
        platformType: this.current.platformType,
        delta: this.delta,
      });
      this.$message.success('调整成功');
      this.adjustVisible = false;
      this.loadPage();
    },
    openWarn(row) {
      this.current = row;
      this.warnNum = row.warnNum || 0;
      this.warnVisible = true;
    },
    async onWarnSubmit() {
      await stockApi.updateWarn(this.current.id, this.warnNum);
      this.$message.success('设置成功');
      this.warnVisible = false;
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.warn-stock { color: #f56c6c; font-weight: bold; }
</style>
