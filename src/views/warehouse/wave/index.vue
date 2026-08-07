<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="单号"><el-input v-model="query.code" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option v-for="(v,k) in statusMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openBuild">组波次</el-button>
      <el-button type="success" icon="el-icon-magic-stick" size="small" @click="autoDialog=true">自动组波</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="波次号" width="180" />
      <el-table-column label="仓库" width="200"><template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template></el-table-column>
      <el-table-column label="策略" width="80"><template slot-scope="{row}">{{ row.strategy === 1 ? 'FEFO' : 'FIFO' }}</template></el-table-column>
      <el-table-column label="组波依据" width="100"><template slot-scope="{row}">{{ groupByMap[row.groupBy] || '按仓' }}</template></el-table-column>
      <el-table-column label="拣货模式" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.pickMode === 1 ? 'warning' : 'info'" size="mini">{{ row.pickMode === 1 ? '批量拣' : '按单拣' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="出库单数" width="90"><template slot-scope="{row}">{{ (row.outboundIds || '').split(',').filter(Boolean).length }}</template></el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}"><el-tag :type="statusType(row.status)" size="mini">{{ statusMap[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="createUserName" label="创建人" width="120" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="row.status===0" type="text" @click="onRelease(row)">释放</el-button>
          <el-button v-if="row.status>=1" type="text" @click="openBatchPick(row)">批量拣货视图</el-button>
          <el-button v-if="row.status===0" type="text" class="danger-text" @click="onCancel(row)">作废</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="loadPage"
    />

    <!-- 组波次 -->
    <el-dialog title="组波次" :visible.sync="buildVisible" width="820px">
      <el-form :model="buildForm" label-width="90px" size="small">
        <el-form-item label="仓库">
          <el-select v-model="buildForm.warehouseId" filterable placeholder="请选择仓库" style="width:100%" @change="loadOutboundCandidates">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配策略">
          <el-radio-group v-model="buildForm.strategy">
            <el-radio :label="0">FIFO (先入先出)</el-radio>
            <el-radio :label="1">FEFO (先到期先出)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择出库单">
          <el-table ref="candidateTable" :data="candidates" border size="small" max-height="280" @selection-change="s => selectedOutbounds = s">
            <el-table-column type="selection" width="45" />
            <el-table-column prop="code" label="出库单号" width="200" />
            <el-table-column prop="applyUserName" label="申请人" width="120" />
            <el-table-column label="创建时间">
              <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="buildForm.remark" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="buildVisible=false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onBuildSubmit">生成波次</el-button>
      </div>
    </el-dialog>

    <!-- 自动组波 -->
    <el-dialog title="自动组波" :visible.sync="autoDialog" width="560px">
      <el-form :model="autoForm" label-width="110px" size="small">
        <el-form-item label="仓库">
          <el-select v-model="autoForm.warehouseId" filterable placeholder="请选择仓库" style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="组波依据">
          <el-radio-group v-model="autoForm.groupBy">
            <el-radio :label="0">全部一波</el-radio>
            <el-radio :label="1">按客户</el-radio>
            <el-radio :label="2">按承运商</el-radio>
            <el-radio :label="3">按优先级分批</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="autoForm.groupBy===3" label="每波单数">
          <el-input-number v-model="autoForm.batchSize" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="分配策略">
          <el-radio-group v-model="autoForm.strategy">
            <el-radio :label="0">FIFO (先入先出)</el-radio>
            <el-radio :label="1">FEFO (先到期先出)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="拣货模式">
          <el-radio-group v-model="autoForm.pickMode">
            <el-radio :label="0">按单拣</el-radio>
            <el-radio :label="1">批量合并拣</el-radio>
          </el-radio-group>
        </el-form-item>
        <div style="color:#909399;font-size:12px;padding-left:110px">
          将扫描该仓所有<b>草稿状态</b>的出库单，并按依据聚合成波次
        </div>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="autoDialog=false">取消</el-button>
        <el-button type="primary" size="small" :loading="autoLoading" @click="onAutoBuild">开始组波</el-button>
      </div>
    </el-dialog>

    <!-- 批量拣货视图 -->
    <el-dialog :title="`批量拣货 ${batchWave.code||''}`" :visible.sync="batchVisible" width="1000px" top="5vh">
      <el-alert type="info" :closable="false" style="margin-bottom:12px">
        同一库位 × 批次 × 商品的拣货需求已合并，按库位路径顺序排列。拣完后请回到「拣货管理」逐单确认。
      </el-alert>
      <el-table :data="batchRows" border size="small" max-height="520">
        <el-table-column type="index" width="45" />
        <el-table-column prop="locationCode" label="库位" width="150">
          <template slot-scope="{row}"><b>{{ row.locationCode || '通用池' }}</b></template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次" width="150" />
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column prop="goodsName" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="合计应拣" width="100">
          <template slot-scope="{row}"><b class="plan">{{ row.totalPlan }}</b></template>
        </el-table-column>
        <el-table-column label="已拣" width="90">
          <template slot-scope="{row}">{{ row.totalPicked }}</template>
        </el-table-column>
        <el-table-column label="来源单数" width="100">
          <template slot-scope="{row}">
            <el-tooltip placement="top">
              <div slot="content">
                <div v-for="s in row.sources" :key="s.pickItemId">拣货单 {{ s.pickOrderId }} 应拣 {{ s.plan }}</div>
              </div>
              <el-tag size="mini">{{ (row.sources || []).length }} 单</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:10px;color:#606266">
        共 <b>{{ batchRows.length }}</b> 个拣货点位，合计 <b>{{ batchTotal }}</b> 件
      </div>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog :title="`波次详情 ${detailData.code||''}`" :visible.sync="detailVisible" width="900px">
      <div style="margin-bottom:12px">
        <b>关联出库单：</b>{{ detailData.outboundIds }}<br />
        <b>拣货单：</b>{{ (detailData.pickOrders||[]).length }} 张
      </div>
      <el-table :data="detailData.pickOrders || []" border size="small">
        <el-table-column prop="code" label="拣货单号" width="240" />
        <el-table-column prop="outboundCode" label="关联出库单" width="200" />
        <el-table-column label="状态"><template slot-scope="{row}">{{ pickStatusMap[row.status] }}</template></el-table-column>
        <el-table-column prop="pickerName" label="拣货员" width="120" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { waveApi, warehouseApi, outboundApi } from '@/api/warehouse';

export default {
  name: 'WarehouseWave',
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, code: '', warehouseId: null, status: null },
      buildVisible: false, buildForm: { warehouseId: null, strategy: 0, remark: '' },
      candidates: [], selectedOutbounds: [],
      detailVisible: false, detailData: {},
      autoDialog: false, autoLoading: false,
      autoForm: { warehouseId: null, groupBy: 0, strategy: 0, pickMode: 0, batchSize: 20 },
      batchVisible: false, batchWave: {}, batchRows: [],
      statusMap: { 0: '草稿', 1: '已释放', 2: '已完成', 3: '已作废' },
      pickStatusMap: { 0: '待拣', 1: '拣货中', 2: '已拣完', 3: '已复核', 4: '已作废' },
      groupByMap: { 0: '按仓', 1: '按客户', 2: '按承运商', 3: '按优先级' },
    };
  },
  computed: {
    batchTotal() { return this.batchRows.reduce((s, r) => s + (r.totalPlan || 0), 0); },
  },
  created() { this.loadWarehouses(); this.loadPage(); },
  methods: {
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' })[s] || ''; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) { /* ignore */ } },
    async loadPage() { this.loading = true; try { const r = await waveApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; } finally { this.loading = false; } },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, status: null }; this.loadPage(); },
    openBuild() { this.buildForm = { warehouseId: null, strategy: 0, remark: '' }; this.candidates = []; this.selectedOutbounds = []; this.buildVisible = true; },
    async loadOutboundCandidates() {
      if (!this.buildForm.warehouseId) return;
      const r = await outboundApi.page({ page: 1, limit: 200, warehouseId: this.buildForm.warehouseId, status: 0 });
      this.candidates = (r && r.list) || [];
    },
    async onBuildSubmit() {
      if (!this.buildForm.warehouseId) return this.$message.warning('请选择仓库');
      if (!this.selectedOutbounds.length) return this.$message.warning('请勾选出库单');
      this.saving = true;
      try {
        await waveApi.build({ ...this.buildForm, outboundIds: this.selectedOutbounds.map(x => x.id) });
        this.$message.success('已创建波次');
        this.buildVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onRelease(row) {
      await this.$confirm('释放波次将自动按 FIFO/FEFO 生成拣货单，可用库存会预留。继续?', '确认', { type: 'warning' });
      const n = await waveApi.release(row.id);
      this.$message.success(`已生成 ${n} 张拣货单`);
      this.loadPage();
    },
    async onCancel(row) {
      await this.$confirm(`作废波次「${row.code}」?`, '提示', { type: 'warning' });
      await waveApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
    },
    async openDetail(id) { this.detailData = await waveApi.detail(id) || {}; this.detailVisible = true; },
    async onAutoBuild() {
      if (!this.autoForm.warehouseId) return this.$message.warning('请选择仓库');
      this.autoLoading = true;
      try {
        const list = await waveApi.autoBuild(this.autoForm);
        const n = (list || []).length;
        if (!n) this.$message.warning('该仓没有草稿状态的出库单');
        else this.$message.success(`已生成 ${n} 个波次`);
        this.autoDialog = false;
        this.loadPage();
      } finally { this.autoLoading = false; }
    },
    async openBatchPick(row) {
      this.batchWave = row;
      this.batchRows = await waveApi.batchPick(row.id) || [];
      this.batchVisible = true;
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.plan { color: #409eff; }
</style>
