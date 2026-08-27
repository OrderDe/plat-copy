<template>
  <div class="app-container stock-page">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="视图">
        <el-radio-group v-model="viewMode" @change="loadPage" size="small">
          <el-radio-button label="agg">按商品</el-radio-button>
          <el-radio-button label="detail">按库位</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="viewMode==='detail'" label="货架">
        <el-select v-model="query.shelfId" filterable clearable placeholder="全部" style="width:160px" @change="onSearch">
          <el-option v-for="s in shelfList" :key="s.id" :label="s.code" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品ID">
        <el-input v-model="query.productId" placeholder="ID" clearable style="width:130px" />
      </el-form-item>
      <el-form-item label="所属商户">
        <el-select v-model="query.merId" filterable clearable placeholder="全部" style="width:180px" @change="onSearch">
          <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="query.lowStockOnly" @change="onSearch">仅预警</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 汇总视图：按 (仓+商品+平台) 一行 -->
    <el-table v-if="viewMode==='agg'" v-loading="loading" :data="aggData" class="stock-table" border stripe size="small">
      <el-table-column label="仓库" min-width="150" show-overflow-tooltip>
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="商品信息" min-width="240">
        <template slot-scope="{row}">
          <div class="product-cell">
            <div class="product-name">{{ row.productName || row.productId }}</div>
            <div class="product-meta">
              <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
              <span v-else>未指定规格</span>
              <span class="meta-divider" />
              <span>{{ row.barCode || '无条码' }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="所属商户" min-width="120" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-if="row.merId">{{ row.merName || merchantName(row.merId) }}</span>
          <el-tag v-else type="info" size="mini">历史数据</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="库存数量" min-width="280">
        <template slot-scope="{row}">
          <div class="stock-metrics">
            <div class="stock-metric">
              <span>总库存</span>
              <b :class="{ 'warn-stock': (row.warnNum||0) > 0 && (row.availableNum||0) <= row.warnNum }">{{ row.stockNum || 0 }}</b>
            </div>
            <div class="stock-metric stock-metric--available">
              <span>可用</span>
              <b>{{ row.availableNum || 0 }}</b>
              <!-- 账面可用里有一部分在待检/隔离区或被盘点锁着，出库根本取不出来。
                   不标出来的话，操作员照着「可用」去建出库单会被后端拒，
                   而且提示的数字比这里小，差额无从解释 -->
              <el-tooltip
                v-if="blockedStock(row) > 0"
                :content="`其中 ${blockedStock(row)} 件在待检/隔离库位或盘点锁定中，出库取不出来`"
                placement="top"
              >
                <em class="warn-stock">可发 {{ row.sellableAvailableNum }}</em>
              </el-tooltip>
            </div>
            <div class="stock-metric stock-metric--occupied">
              <span>预占</span>
              <b>{{ row.occupiedNum || 0 }}</b>
            </div>
            <div class="stock-metric stock-metric--frozen">
              <span>冻结</span>
              <b>{{ row.frozenNum || 0 }}</b>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="库存分布" min-width="170">
        <template slot-scope="{row}">
          <div class="distribution-metrics">
            <span><i class="el-icon-location-outline" /> {{ row.locationCount || 0 }} 个库位</span>
            <span>在途 {{ row.onTheWayStock || 0 }}</span>
            <span :class="{ 'warn-stock': (row.warnNum||0) > 0 && (row.availableNum||0) <= row.warnNum }">预警下限 {{ row.warnNum || 0 }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="142" fixed="right" align="center">
        <template slot-scope="{row}">
          <div class="stock-action-group">
            <el-tooltip content="查看库位分布" placement="top">
              <el-button class="stock-action-btn" type="primary" plain size="mini" icon="el-icon-location-outline" aria-label="查看库位分布" @click="openDistribution(row)" />
            </el-tooltip>
            <el-tooltip content="预占或释放库存" placement="top">
              <el-button class="stock-action-btn" type="warning" plain size="mini" icon="el-icon-lock" aria-label="预占或释放库存" @click="openOccupy(row)" />
            </el-tooltip>
            <el-tooltip content="调整库存" placement="top">
              <el-button class="stock-action-btn" type="success" plain size="mini" icon="el-icon-edit-outline" aria-label="调整库存" @click="openAdjust(row)" />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 库位维度明细 -->
    <el-table v-else v-loading="loading" :data="detailData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="仓库" width="180" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.warehouseName || warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="货架" width="150" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-if="row.shelfCode">{{ row.shelfCode }}<span v-if="row.shelfName" class="sub-text"> / {{ row.shelfName }}</span></span>
          <el-tag v-else type="warning" size="mini">未上架</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="库位" width="140" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-if="row.locationCode">{{ row.locationCode }}</span>
          <span v-else style="color:#c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column label="批次 / 效期" width="180" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-if="row.batchNo">{{ row.batchNo }}<span v-if="row.expiryDate" class="sub-text"> / {{ row.expiryDate }}</span></span>
          <span v-else style="color:#c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column label="商品" min-width="180" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.productName || row.productId }}</template>
      </el-table-column>
      <el-table-column label="规格" min-width="140" show-overflow-tooltip>
        <template slot-scope="{row}">
          <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
          <span v-else style="color:#c0c4cc">未指定</span>
        </template>
      </el-table-column>
      <el-table-column prop="barCode" label="条码" width="130" show-overflow-tooltip />
      <el-table-column label="所属商户" width="140">
        <template slot-scope="{row}">
          <span v-if="row.merId">{{ row.merName || merchantName(row.merId) }}</span>
          <span v-else style="color:#c0c4cc">历史</span>
        </template>
      </el-table-column>
      <el-table-column label="总库存" width="80">
        <template slot-scope="{row}">
          <span :class="{ 'warn-stock': (row.warnNum||0) > 0 && (row.availableNum||0) <= row.warnNum }">{{ row.stockNum }}</span>
        </template>
      </el-table-column>
      <el-table-column label="可用" width="80"><template slot-scope="{row}"><b class="text-success">{{ row.availableNum || 0 }}</b></template></el-table-column>
      <el-table-column label="预占" width="80"><template slot-scope="{row}"><span class="text-warn">{{ row.occupiedNum || 0 }}</span></template></el-table-column>
      <el-table-column label="冻结" width="80"><template slot-scope="{row}"><span class="text-danger">{{ row.frozenNum || 0 }}</span></template></el-table-column>
      <el-table-column prop="warnNum" label="预警下限" width="80" />
      <el-table-column label="均价" width="100">
        <template slot-scope="{row}">{{ row.avgCost ? Number(row.avgCost).toFixed(4) : '-' }}</template>
      </el-table-column>
      <el-table-column label="金额" width="110">
        <template slot-scope="{row}"><span class="text-warn">{{ row.totalCost ? Number(row.totalCost).toFixed(2) : '-' }}</span></template>
      </el-table-column>
      <el-table-column label="更新时间" width="160">
        <template slot-scope="{row}">{{ formatDateTime(row.updateTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openFreeze(row)">冻结</el-button>
          <el-button type="text" @click="openUnfreeze(row)">解冻</el-button>
          <el-button type="text" @click="openWarn(row)">预警</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="stock-pagination"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, sizes, prev, pager, next"
      @size-change="loadPage"
      @current-change="loadPage"
    />

    <!-- 库位分布抽屉 -->
    <el-drawer title="库位分布" :visible.sync="distVisible" size="720px">
      <div style="padding:0 20px">
        <div style="margin-bottom:12px;color:#606266">
          仓库：<b>{{ distContext.warehouseName || warehouseText(distContext.warehouseId) }}</b>
          · 商品：<b>{{ distContext.productName || distContext.productId }}</b>
          <template v-if="distContext.sku"> · 规格：<el-tag size="mini" type="info">{{ distContext.sku }}</el-tag></template>
          · 商户：{{ distContext.merId ? (distContext.merName || merchantName(distContext.merId)) : '历史数据' }}
        </div>
        <el-table :data="distList" border size="small" v-loading="distLoading">
          <el-table-column label="货架" width="150" show-overflow-tooltip>
            <template slot-scope="{row}">
              <span v-if="row.shelfCode">{{ row.shelfCode }}<span v-if="row.shelfName" class="sub-text"> / {{ row.shelfName }}</span></span>
              <el-tag v-else type="warning" size="mini">未上架</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="库位" width="130">
            <template slot-scope="{row}">{{ row.locationCode || '-' }}</template>
          </el-table-column>
          <el-table-column label="批次 / 效期" width="170" show-overflow-tooltip>
            <template slot-scope="{row}">
              <span v-if="row.batchNo">{{ row.batchNo }}<span v-if="row.expiryDate" class="sub-text"> / {{ row.expiryDate }}</span></span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="stockNum" label="总量" width="70" />
          <el-table-column prop="availableNum" label="可用" width="70" />
          <el-table-column prop="occupiedNum" label="预占" width="70" />
          <el-table-column prop="frozenNum" label="冻结" width="70" />
          <el-table-column label="更新时间" min-width="150">
            <template slot-scope="{row}">{{ formatDateTime(row.updateTime) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 冻结/解冻 -->
    <el-dialog :title="freezeMode==='freeze'?'冻结库存':'解冻库存'" :visible.sync="freezeVisible" width="440px">
      <el-form label-width="80px" size="small">
        <el-form-item label="库存ID">{{ current.id }}</el-form-item>
        <el-form-item :label="freezeMode==='freeze'?'当前可用':'当前冻结'">
          {{ freezeMode==='freeze' ? (current.availableNum||0) : (current.frozenNum||0) }}
        </el-form-item>
        <el-form-item label="数量"><el-input-number v-model="freezeNum" :min="1" /></el-form-item>
        <el-form-item label="原因"><el-input v-model="freezeReason" placeholder="盘点/质检/纠纷等" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="freezeVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onFreezeSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 预占/释放（聚合行操作） -->
    <el-dialog title="预占 / 释放预占" :visible.sync="occupyVisible" width="480px">
      <el-form label-width="90px" size="small">
        <el-form-item label="仓库">{{ warehouseText(current.warehouseId) }}</el-form-item>
        <el-form-item label="商品ID">{{ current.productId }}</el-form-item>
        <el-form-item label="当前可用">{{ current.availableNum || 0 }}</el-form-item>
        <el-form-item label="当前预占">{{ current.occupiedNum || 0 }}</el-form-item>
        <el-form-item label="操作">
          <el-radio-group v-model="occupyMode">
            <el-radio label="occupy">预占 (可用→预占)</el-radio>
            <el-radio label="release">释放 (预占→可用)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量"><el-input-number v-model="occupyNum" :min="1" /></el-form-item>
        <el-form-item label="业务单号"><el-input v-model="occupyBizCode" placeholder="订单号/关联单号" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="occupyVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onOccupySubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 调整库存（聚合行） -->
    <el-dialog title="调整库存" :visible.sync="adjustVisible" width="440px">
      <p style="color:#666;font-size:12px">正=入库、负=出库；会写流水并反写商品库。仅调整"未上架"库存池。</p>
      <el-form label-width="80px" size="small">
        <el-form-item label="仓库">{{ warehouseText(current.warehouseId) }}</el-form-item>
        <el-form-item label="商品ID">{{ current.productId }}</el-form-item>
        <el-form-item label="总库存">{{ current.stockNum }}</el-form-item>
        <el-form-item label="增量"><el-input-number v-model="delta" :min="-99999" :max="99999" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="adjustVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onAdjustSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 设预警 -->
    <el-dialog title="设置预警下限" :visible.sync="warnVisible" width="360px">
      <el-input-number v-model="warnNum" :min="0" :max="99999" />
      <div slot="footer">
        <el-button size="small" @click="warnVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onWarnSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { stockApi, warehouseApi, shelfApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';
import { formatDateTime } from '../components/dateTime';

export default {
  name: 'WarehouseStock',
  data() {
    return {
      viewMode: 'agg',
      loading: false,
      aggData: [], detailData: [], total: 0,
      warehouseList: [], shelfList: [], merchantList: [],
      query: { page: 1, limit: 20, warehouseId: null, merId: null, shelfId: null, productId: null, lowStockOnly: false },
      current: {},
      distVisible: false, distLoading: false, distList: [], distContext: {},
      freezeVisible: false, freezeMode: 'freeze', freezeNum: 1, freezeReason: '',
      occupyVisible: false, occupyMode: 'occupy', occupyNum: 1, occupyBizCode: '',
      adjustVisible: false, delta: 0,
      warnVisible: false, warnNum: 0,
    };
  },
  watch: {
    'query.warehouseId'(v) { this.loadShelves(v); },
  },
  created() { this.loadWarehouses(); this.loadMerchants(); this.loadPage(); },
  methods: {
    formatDateTime,
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    merchantName(id) { const m = this.merchantList.find(x => x.id === id); return m ? m.name : ('商户#' + id); },
    /** 账面可用里出不了库的那部分（待检/隔离区 + 盘点锁定），后端 sellableAvailableNum 已按出库口径算好 */
    blockedStock(row) {
      if (!row || row.sellableAvailableNum == null) return 0;
      return Math.max((Number(row.availableNum) || 0) - (Number(row.sellableAvailableNum) || 0), 0);
    },
    async loadMerchants() {
      try { const r = await merchantListApi({ page: 1, limit: 999 }); this.merchantList = (r && r.list) || (r && r.records) || []; } catch (e) {}
    },
    async loadWarehouses() {
      try { const res = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (res && res.list) || []; } catch (e) {}
    },
    async loadShelves(warehouseId) {
      if (!warehouseId) { this.shelfList = []; return; }
      try { const res = await shelfApi.page({ page: 1, limit: 999, warehouseId }); this.shelfList = (res && res.list) || []; } catch (e) {}
    },
    async loadPage() {
      this.loading = true;
      try {
        if (this.viewMode === 'agg') {
          const res = await stockApi.pageAgg(this.query);
          this.aggData = (res && res.list) || [];
          this.total = (res && res.total) || 0;
        } else {
          const res = await stockApi.page(this.query);
          this.detailData = (res && res.list) || [];
          this.total = (res && res.total) || 0;
        }
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, warehouseId: null, merId: null, shelfId: null, productId: null, lowStockOnly: false }; this.loadPage(); },
    async openDistribution(row) {
      this.distContext = row;
      this.distVisible = true;
      this.distLoading = true;
      try {
        // 走明细分页而非 /distribution：前者联表返回货架/库位/批次名称，
        // 后者只有裸 ID，看了也不知道去哪儿找货
        const res = await stockApi.page({
          page: 1,
          limit: 200,
          warehouseId: row.warehouseId,
          productId: row.productId,
          attrValueId: row.attrValueId,
          merId: row.merId,
        });
        this.distList = (res && res.list) || [];
      } finally { this.distLoading = false; }
    },
    openFreeze(row) { this.current = row; this.freezeMode = 'freeze'; this.freezeNum = 1; this.freezeReason = ''; this.freezeVisible = true; },
    openUnfreeze(row) { this.current = row; this.freezeMode = 'unfreeze'; this.freezeNum = 1; this.freezeReason = ''; this.freezeVisible = true; },
    async onFreezeSubmit() {
      const fn = this.freezeMode === 'freeze' ? stockApi.freeze : stockApi.unfreeze;
      await fn({ stockId: this.current.id, num: this.freezeNum, reason: this.freezeReason });
      this.$message.success('操作成功');
      this.freezeVisible = false;
      this.loadPage();
    },
    openOccupy(row) { this.current = row; this.occupyMode = 'occupy'; this.occupyNum = 1; this.occupyBizCode = ''; this.occupyVisible = true; },
    async onOccupySubmit() {
      const fn = this.occupyMode === 'occupy' ? stockApi.occupy : stockApi.releaseOccupy;
      await fn({
        warehouseId: this.current.warehouseId,
        productId: this.current.productId,
        attrValueId: this.current.attrValueId,
        merId: this.current.merId,
        num: this.occupyNum,
        bizCode: this.occupyBizCode,
      });
      this.$message.success('操作成功');
      this.occupyVisible = false;
      this.loadPage();
    },
    openAdjust(row) { this.current = row; this.delta = 0; this.adjustVisible = true; },
    async onAdjustSubmit() {
      if (!this.delta) return this.$message.warning('增量不能为 0');
      await stockApi.adjust({ warehouseId: this.current.warehouseId, productId: this.current.productId, attrValueId: this.current.attrValueId, merId: this.current.merId, delta: this.delta });
      this.$message.success('调整成功');
      this.adjustVisible = false;
      this.loadPage();
    },
    openWarn(row) { this.current = row; this.warnNum = row.warnNum || 0; this.warnVisible = true; },
    async onWarnSubmit() {
      await stockApi.updateWarn(this.current.id, this.warnNum);
      this.$message.success('已保存');
      this.warnVisible = false;
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.warn-stock { color: #f56c6c; font-weight: bold; }
.text-success { color: #67c23a; }
.text-warn { color: #e6a23c; }
.text-danger { color: #f56c6c; }
.sub-text { color: #909399; font-size: 12px; }
.stock-page { padding-top: 14px; }
.stock-table { width: 100%; }
.stock-table >>> th.el-table__cell {
  padding: 11px 0;
  background: #edf3ff;
  color: #4e5969;
  font-weight: 600;
}
.stock-table >>> td.el-table__cell { padding: 10px 0; }
.product-name {
  overflow: hidden;
  color: #303133;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-meta {
  display: flex;
  align-items: center;
  min-width: 0;
  margin-top: 5px;
  overflow: hidden;
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}
.product-meta .el-tag { flex: 0 0 auto; }
.meta-divider {
  flex: 0 0 auto;
  width: 1px;
  height: 12px;
  margin: 0 8px;
  background: #dcdfe6;
}
.stock-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(52px, 1fr));
  gap: 6px;
}
.stock-metric {
  min-width: 0;
  text-align: center;
}
.stock-metric + .stock-metric { border-left: 1px solid #ebeef5; }
.stock-metric span {
  display: block;
  margin-bottom: 3px;
  color: #909399;
  font-size: 11px;
}
.stock-metric b { color: #303133; font-size: 14px; }
.stock-metric--available b { color: #20a162; }
.stock-metric--occupied b { color: #d97706; }
.stock-metric--frozen b { color: #e34d59; }
.distribution-metrics {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 12px;
  color: #606266;
  font-size: 12px;
}
.distribution-metrics i { color: #409eff; }
.stock-pagination {
  margin-top: 0;
  padding: 14px 8px;
  border: 1px solid #ebeef5;
  border-top: 0;
  background: #fafbfc;
  text-align: right;
}
.stock-action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.stock-action-btn {
  width: 34px;
  height: 30px;
  margin: 0 !important;
  padding: 0;
  border-radius: 4px;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.stock-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(31, 45, 61, 0.12);
}
.stock-action-btn:active { transform: translateY(0); }

@media (max-width: 1200px) {
  .stock-metrics { grid-template-columns: repeat(2, minmax(60px, 1fr)); }
  .stock-metric + .stock-metric { border-left: 0; }
}
</style>
