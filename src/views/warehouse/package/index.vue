<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="箱号"><el-input v-model="query.code" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="出库单号"><el-input v-model="query.outboundCode" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="运单号"><el-input v-model="query.expressNo" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:180px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px" @change="onSearch">
          <el-option v-for="(v,k) in statusMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openPackWorkbench">装箱工作台</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="code" label="箱号" width="170" />
      <el-table-column label="箱序" width="90">
        <template slot-scope="{row}"><b class="box">{{ row.boxNo }} / {{ row.boxTotal || '?' }}</b></template>
      </el-table-column>
      <el-table-column prop="outboundCode" label="出库单" width="160" />
      <el-table-column label="尺寸 (cm)" width="140">
        <template slot-scope="{row}">{{ sizeText(row) }}</template>
      </el-table-column>
      <el-table-column label="实重(kg)" width="90"><template slot-scope="{row}">{{ row.weightKg || '-' }}</template></el-table-column>
      <el-table-column label="体积重(kg)" width="100"><template slot-scope="{row}">{{ row.volumeWeightKg || '-' }}</template></el-table-column>
      <el-table-column label="计费重(kg)" width="105">
        <template slot-scope="{row}"><b class="charge">{{ row.chargeWeightKg || '-' }}</b></template>
      </el-table-column>
      <el-table-column label="承运商/运单" min-width="180">
        <template slot-scope="{row}">{{ row.expressCompany }} {{ row.expressNo }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}"><el-tag :type="statusType(row.status)" size="mini">{{ statusMap[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="packUserName" label="装箱员" width="110" />
      <el-table-column label="操作" width="330" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openEdit(row)">{{ row.status === 0 ? '编辑' : '查看' }}</el-button>
          <el-button v-if="row.status===0" type="text" @click="onSeal(row)">封箱</el-button>
          <el-button v-if="row.status===1" type="text" style="color:#67c23a" @click="openDeliver(row)">发货</el-button>
          <el-button type="text" @click="onPrintLabel(row)">打印箱唛</el-button>
          <el-button v-if="row.status!==2 && row.status!==3" type="text" class="danger-text" @click="onCancel(row)">作废</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="loadPage"
    />

    <!-- 装箱工作台 -->
    <el-dialog title="装箱工作台" :visible.sync="wbVisible" width="1080px" top="4vh" @closed="resetWb">
      <el-form :inline="true" size="small">
        <el-form-item label="出库单">
          <el-select v-model="wbOutboundId" filterable remote clearable :remote-method="searchOutbound"
                     :loading="obLoading" placeholder="输入单号搜索" style="width:280px" @change="loadProgress">
            <el-option v-for="o in obOptions" :key="o.id" :label="`${o.code} (${o.customerCode || '无客户'})`" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="wbOutboundId">
          <el-button type="success" size="small" @click="onQuickPack">快捷装箱 (剩余全装一箱)</el-button>
        </el-form-item>
      </el-form>

      <template v-if="wbOutboundId">
        <el-divider content-position="left">装箱进度</el-divider>
        <el-table :data="progress" border size="small" max-height="200">
          <el-table-column prop="productId" label="商品ID" width="100" />
          <el-table-column prop="goodsName" label="商品名称" min-width="180" />
          <el-table-column label="应出" width="90"><template slot-scope="{row}">{{ row.planNum }}</template></el-table-column>
          <el-table-column label="已装" width="90"><template slot-scope="{row}"><span class="packed">{{ row.packedNum }}</span></template></el-table-column>
          <el-table-column label="待装" width="90">
            <template slot-scope="{row}">
              <b :class="row.remainNum > 0 ? 'remain' : 'done'">{{ row.remainNum }}</b>
            </template>
          </el-table-column>
          <el-table-column label="本箱装入" width="150">
            <template slot-scope="{row}">
              <el-input-number v-model="row._pack" :min="0" :max="row.remainNum" size="mini" controls-position="right" style="width:120px" />
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">新箱信息</el-divider>
        <el-form :model="newBox" label-width="90px" size="small">
          <el-row :gutter="8">
            <el-col :span="6"><el-form-item label="长 (cm)"><el-input-number v-model="newBox.lengthCm" :min="0" :precision="1" style="width:100%" @change="calcPreview" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="宽 (cm)"><el-input-number v-model="newBox.widthCm" :min="0" :precision="1" style="width:100%" @change="calcPreview" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="高 (cm)"><el-input-number v-model="newBox.heightCm" :min="0" :precision="1" style="width:100%" @change="calcPreview" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="实重 (kg)"><el-input-number v-model="newBox.weightKg" :min="0" :precision="3" style="width:100%" @change="calcPreview" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="8">
            <el-col :span="8"><el-form-item label="承运商"><el-input v-model="newBox.expressCompany" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="运单号"><el-input v-model="newBox.expressNo" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="箱型"><el-input v-model="newBox.boxType" placeholder="如 K3 / 中通5号" /></el-form-item></el-col>
          </el-row>
          <div class="calc">
            体积 <b>{{ preview.volumeM3 }}</b> m³ &nbsp;|&nbsp;
            体积重 <b>{{ preview.volumeWeightKg }}</b> kg (系数 6000) &nbsp;|&nbsp;
            计费重 <b class="charge">{{ preview.chargeWeightKg }}</b> kg
          </div>
        </el-form>

        <el-divider content-position="left">已有箱 ({{ existBoxes.length }})</el-divider>
        <el-table :data="existBoxes" border size="small" max-height="160">
          <el-table-column prop="code" label="箱号" width="170" />
          <el-table-column label="箱序" width="80"><template slot-scope="{row}">{{ row.boxNo }}</template></el-table-column>
          <el-table-column label="件数" width="80">
            <template slot-scope="{row}">{{ (row.items || []).reduce((s,i)=>s+(i.num||0),0) }}</template>
          </el-table-column>
          <el-table-column label="计费重" width="100"><template slot-scope="{row}">{{ row.chargeWeightKg || '-' }}</template></el-table-column>
          <el-table-column label="状态" width="100">
            <template slot-scope="{row}"><el-tag :type="statusType(row.status)" size="mini">{{ statusMap[row.status] }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" min-width="150">
            <template slot-scope="{row}">
              <el-button v-if="row.status===0" type="text" size="mini" @click="onSeal(row, true)">封箱</el-button>
              <el-button type="text" size="mini" @click="onPrintLabel(row)">打印箱唛</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <div slot="footer">
        <el-button size="small" @click="wbVisible=false">关闭</el-button>
        <el-button type="primary" size="small" :disabled="!canCreateBox" :loading="saving" @click="onCreateBox">创建新箱</el-button>
      </div>
    </el-dialog>

    <!-- 发货 -->
    <el-dialog title="包裹发货" :visible.sync="deliverVisible" width="480px">
      <el-form label-width="90px" size="small">
        <el-form-item label="箱号">{{ current.code }}</el-form-item>
        <el-form-item label="出库单">{{ current.outboundCode || '-' }}</el-form-item>
        <el-form-item label="承运商"><el-input v-model="deliverForm.expressCompany" /></el-form-item>
        <el-form-item label="运单号"><el-input v-model="deliverForm.expressNo" /></el-form-item>
        <el-form-item label="发货范围">
          <el-radio-group v-model="deliverForm.scope">
            <el-radio label="one">仅本箱</el-radio>
            <el-radio label="all" :disabled="!current.outboundId">该出库单全部已封箱包裹</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="deliverVisible=false">取消</el-button>
        <el-button type="primary" size="small" :loading="delivering" @click="onDeliverSubmit">确认发货</el-button>
      </div>
    </el-dialog>

    <!-- 箱详情/编辑 -->
    <el-dialog :title="`箱 ${editForm.code || ''}`" :visible.sync="editVisible" width="800px">
      <el-form :model="editForm" label-width="90px" size="small" :disabled="editForm.status !== 0">
        <el-row :gutter="8">
          <el-col :span="6"><el-form-item label="长 (cm)"><el-input-number v-model="editForm.lengthCm" :min="0" :precision="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="宽 (cm)"><el-input-number v-model="editForm.widthCm" :min="0" :precision="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="高 (cm)"><el-input-number v-model="editForm.heightCm" :min="0" :precision="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="实重 (kg)"><el-input-number v-model="editForm.weightKg" :min="0" :precision="3" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="8">
          <el-col :span="12"><el-form-item label="承运商"><el-input v-model="editForm.expressCompany" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="运单号"><el-input v-model="editForm.expressNo" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <el-divider content-position="left">箱内明细</el-divider>
      <el-table :data="editForm.items || []" border size="small" max-height="260">
        <el-table-column type="index" width="45" />
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column prop="goodsName" label="商品名称" min-width="180" />
        <el-table-column prop="batchNo" label="批次" width="140" />
        <el-table-column label="数量" width="130">
          <template slot-scope="{row}">
            <el-input-number v-if="editForm.status === 0" v-model="row.num" :min="1" size="mini" controls-position="right" style="width:110px" />
            <span v-else>{{ row.num }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="editForm.status === 0" label="操作" width="70">
          <template slot-scope="{$index}"><el-button type="text" class="danger-text" @click="editForm.items.splice($index,1)">移除</el-button></template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button size="small" @click="editVisible=false">关闭</el-button>
        <el-button v-if="editForm.status === 0" type="primary" size="small" @click="onSaveEdit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { packageApi, outboundApi, warehouseApi } from '@/api/warehouse';
import { doPrint } from '../components/printUtil';

const VOL_FACTOR = 6000;

export default {
  name: 'WarehousePackage',
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, code: '', outboundCode: '', expressNo: '', warehouseId: null, status: null },
      statusMap: { 0: '待封箱', 1: '已封箱', 2: '已发货', 3: '已作废' },
      // 工作台
      wbVisible: false, wbOutboundId: null, obOptions: [], obLoading: false,
      progress: [], existBoxes: [],
      newBox: { lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0, expressCompany: '', expressNo: '', boxType: '' },
      preview: { volumeM3: '0.000000', volumeWeightKg: '0.000', chargeWeightKg: '0.000' },
      // 编辑
      editVisible: false, editForm: {},
      // 发货：current 为当前操作的包裹，模板中直接引用，必须初始化为对象否则首次渲染报错
      current: {},
      deliverVisible: false, delivering: false,
      deliverForm: { expressCompany: '', expressNo: '', scope: 'one' },
    };
  },
  computed: {
    canCreateBox() { return this.progress.some(r => (r._pack || 0) > 0); },
  },
  async created() {
    this.loadWarehouses();
    await this.loadPage();
    // 从复核页跳转过来时，自动打开该包裹编辑
    const pid = this.$route.query.packageId;
    if (pid) {
      const row = this.tableData.find(x => String(x.id) === String(pid));
      if (row) this.openEdit(row);
    }
  },
  methods: {
    statusType(s) { return ({ 0: 'warning', 1: 'success', 2: 'success', 3: 'info' })[s] || ''; },
    sizeText(r) {
      if (!r.lengthCm && !r.widthCm && !r.heightCm) return '-';
      return `${r.lengthCm || 0}×${r.widthCm || 0}×${r.heightCm || 0}`;
    },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadPage() {
      this.loading = true;
      try { const r = await packageApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', outboundCode: '', expressNo: '', warehouseId: null, status: null }; this.loadPage(); },

    /* ---- 工作台 ---- */
    openPackWorkbench() { this.wbVisible = true; },
    resetWb() { this.wbOutboundId = null; this.progress = []; this.existBoxes = []; this.resetNewBox(); },
    resetNewBox() {
      this.newBox = { lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0, expressCompany: '', expressNo: '', boxType: '' };
      this.calcPreview();
    },
    async searchOutbound(kw) {
      this.obLoading = true;
      try { const r = await outboundApi.page({ page: 1, limit: 30, code: kw || '' }); this.obOptions = (r && r.list) || []; }
      finally { this.obLoading = false; }
    },
    async loadProgress() {
      if (!this.wbOutboundId) { this.progress = []; this.existBoxes = []; return; }
      const [p, boxes] = await Promise.all([
        packageApi.progress(this.wbOutboundId),
        packageApi.listByOutbound(this.wbOutboundId),
      ]);
      this.progress = (p || []).map(r => ({ ...r, _pack: 0 }));
      this.existBoxes = boxes || [];
      // 自动带出承运商
      const ob = this.obOptions.find(o => o.id === this.wbOutboundId);
      if (ob && ob.expressCompany) this.newBox.expressCompany = ob.expressCompany;
    },
    calcPreview() {
      const { lengthCm: l, widthCm: w, heightCm: h, weightKg } = this.newBox;
      const cm3 = (l || 0) * (w || 0) * (h || 0);
      const volM3 = cm3 / 1000000;
      const volKg = cm3 / VOL_FACTOR;
      const charge = Math.max(weightKg || 0, volKg);
      this.preview = {
        volumeM3: volM3.toFixed(6),
        volumeWeightKg: volKg.toFixed(3),
        chargeWeightKg: charge.toFixed(3),
      };
    },
    async onCreateBox() {
      const items = this.progress.filter(r => (r._pack || 0) > 0).map(r => ({
        outboundItemId: r.outboundItemId,
        productId: r.productId,
        platformType: r.platformType,
        goodsName: r.goodsName,
        num: r._pack,
      }));
      if (!items.length) return this.$message.warning('请至少填写一个商品的装入数量');
      this.saving = true;
      try {
        await packageApi.save({ outboundId: this.wbOutboundId, ...this.newBox, items });
        this.$message.success('已创建新箱');
        this.resetNewBox();
        await this.loadProgress();
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onQuickPack() {
      await this.$confirm('将剩余未装商品全部装入一个新箱，继续?', '确认', { type: 'warning' });
      const id = await packageApi.quickPack(this.wbOutboundId);
      this.$message.success(`已生成箱 ID=${id}`);
      await this.loadProgress();
      this.loadPage();
    },

    /* ---- 列表操作 ---- */
    async openEdit(row) {
      this.editForm = await packageApi.detail(row.id) || {};
      if (!this.editForm.items) this.editForm.items = [];
      this.editVisible = true;
    },
    async onSaveEdit() {
      await packageApi.save(this.editForm);
      this.$message.success('已保存');
      this.editVisible = false;
      this.loadPage();
      if (this.wbOutboundId) this.loadProgress();
    },
    async onSeal(row, fromWb) {
      await this.$confirm(`封箱「${row.code}」? 封箱后不可修改箱内明细`, '确认', { type: 'warning' });
      await packageApi.seal(row.id);
      this.$message.success('已封箱');
      this.loadPage();
      if (fromWb || this.wbOutboundId) this.loadProgress();
    },
    async onCancel(row) {
      await this.$confirm(`作废箱「${row.code}」?`, '提示', { type: 'warning' });
      await packageApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
      if (this.wbOutboundId) this.loadProgress();
    },
    openDeliver(row) {
      this.current = row;
      this.deliverForm = { expressCompany: row.expressCompany || '', expressNo: row.expressNo || '', scope: 'one' };
      this.deliverVisible = true;
    },
    async onDeliverSubmit() {
      this.delivering = true;
      try {
        const { expressCompany, expressNo, scope } = this.deliverForm;
        if (scope === 'all') {
          const n = await packageApi.deliverByOutbound({ outboundId: this.current.outboundId, expressCompany, expressNo });
          this.$message.success(`已发货 ${n} 个包裹`);
        } else {
          await packageApi.deliver(this.current.id, { expressCompany, expressNo });
          this.$message.success('已发货');
        }
        this.deliverVisible = false;
        this.loadPage();
        if (this.wbOutboundId) this.loadProgress();
      } finally { this.delivering = false; }
    },
    async onPrintLabel(row) {
      try { await doPrint('BOX', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.box { color: #409eff; }
.charge { color: #f56c6c; }
.packed { color: #67c23a; }
.remain { color: #e6a23c; }
.done { color: #67c23a; }
.calc { padding-left: 90px; color: #606266; font-size: 12px; margin-bottom: 8px; }
</style>
