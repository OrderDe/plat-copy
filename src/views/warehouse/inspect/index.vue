<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="单号"><el-input v-model="query.code" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="入库单ID"><el-input v-model="query.inboundId" clearable style="width:130px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option label="草稿" :value="0" /><el-option label="已完成" :value="1" /><el-option label="已作废" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="质检结果">
        <el-select v-model="query.result" clearable placeholder="全部" style="width:140px" @change="onSearch">
          <el-option label="全部合格" :value="1" />
          <el-option label="存在不合格" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog">新建质检单</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="单号" width="180" />
      <el-table-column label="仓库" width="200">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column prop="inboundCode" label="关联入库单" width="160" />
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="({0:'info',1:'success',2:'danger'})[row.status]" size="mini">{{ ({0:'草稿',1:'已完成', 2:'已作废'})[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="质检结果" width="110">
        <template slot-scope="{row}">
          <el-tag :type="resultTagType(row)" size="mini">{{ resultText(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="送检 / 合格 / 不合格" width="170" align="center">
        <template slot-scope="{row}">
          <span>{{ row.totalReceived || 0 }}</span>
          <span class="qty-pass"> / {{ row.totalPass || 0 }}</span>
          <span :class="(row.totalFail || 0) > 0 ? 'qty-fail' : ''"> / {{ row.totalFail || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="inspectorName" label="质检员" width="120" />
      <el-table-column prop="inspectorPhone" label="联系方式" width="130" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="330" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button type="text" icon="el-icon-printer" @click="onPrint(row)">打印</el-button>
          <el-button v-if="row.status===0" type="text" @click="openEdit(row)">修改</el-button>
          <el-button v-if="row.status===0" type="text" @click="onSubmit(row)">提交生效</el-button>
          <el-button v-if="row.status===0" type="text" class="danger-text" @click="onCancel(row)">作废</el-button>
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

    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="1200px"
      top="5vh"
      custom-class="warehouse-inspect-dialog"
      @closed="resetForm"
    >
      <el-form ref="formRef" class="inspect-form" :model="form" :rules="rules" label-width="120px" size="small" :disabled="dialogMode==='view'">
        <el-row class="inspect-form-grid" :gutter="20">
          <el-col :span="8">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable style="width:100%" @change="onWarehouseSelect">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="关联入库单">
              <el-select
                v-if="dialogMode==='add'"
                v-model="form.inboundId"
                filterable
                clearable
                remote
                :remote-method="loadInboundOptions"
                :loading="inboundLoading"
                placeholder="选择已生效且未生成质检单的入库单"
                style="width:100%"
                @change="onInboundChange"
              >
                <el-option
                  v-for="ib in inboundOptions"
                  :key="ib.id"
                  :label="`${ib.code}${ib.applyUserName ? ' / ' + ib.applyUserName : ''}`"
                  :value="ib.id"
                />
              </el-select>
              <el-input v-else :value="form.inboundCode || '-'" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="质检员" prop="inspectorName" required>
              <el-input v-model="form.inspectorName" readonly>
                <el-button slot="append" icon="el-icon-user" @click="pickInspector">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系方式">
              <el-input v-model="form.inspectorPhone" maxlength="32" placeholder="选择质检员后自动带出" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="不合格区货架">
              <!-- 只列不合格区货架：判了不合格的货放进别的区，尤其是可售区，
                   会被同步成商城可售库存直接卖出去 -->
              <el-select v-model="form.ngShelfId" filterable clearable style="width:100%" placeholder="不合格品统一入这个货架(可空)" @change="onNgShelfChange">
                <el-option
                  v-for="s in ngShelfOptions"
                  :key="s.id"
                  :label="`${shelfOptionLabel(s)} (${typeMap[s.type]||''})`"
                  :value="s.id"
                  :disabled="shelfOptionDisabled(s, 'ng')"
                />
              </el-select>
              <div v-if="!ngShelfOptions.length && form.warehouseId" class="sku-missing">该仓没有不合格区货架，请先到货架管理配置</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="不合格区库位">
              <el-select v-model="form.ngLocationId" filterable clearable :disabled="!form.ngShelfId" style="width:100%" placeholder="不填则取该货架首个可用库位">
                <el-option
                  v-for="l in ngLocations(form.ngShelfId, form.ngLocationId)"
                  :key="l.id"
                  :label="ngLocationLabel(l)"
                  :value="l.id"
                  :disabled="locationOptionDisabled(l, form.ngLocationId)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>

        <el-divider class="inspect-section-divider" content-position="left">质检明细</el-divider>
        <div class="inspect-detail-toolbar">
          <div class="inspect-detail-hint">逐行填写送检数量、合格数量及处置方式</div>
          <el-button v-if="editable && !fromInbound" size="mini" type="primary" plain icon="el-icon-plus" @click="addItem">添加行</el-button>
          <span v-if="fromInbound" class="inspect-detail-hint">明细由入库单 {{ form.inboundCode }} 带出，只需填写合格/不合格数量、合格品存放库位与不合格原因</span>
        </div>
        <div class="dialog-table-scroller inspect-table-wrapper">
          <el-table class="inspect-detail-table" :data="form.items" border size="mini" max-height="360">
            <el-table-column type="index" width="50" fixed="left" />
            <el-table-column label="店铺" width="150" fixed="left">
              <template slot-scope="{row}">
                <span v-if="fromInbound">{{ merchantText(row.merId) }}</span>
                <el-select v-else v-model="row.merId" filterable size="mini" style="width:100%" placeholder="选择店铺" @change="onShopChange(row)">
                  <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="商品" min-width="200" fixed="left">
              <template slot-scope="{row}">
                <!-- 关联了入库单的明细由入库单带出，商品不允许改：改了就和实际收的货对不上 -->
                <span v-if="fromInbound">{{ row.goodsName }}</span>
                <el-input v-else v-model="row.goodsName" size="mini" readonly>
                  <el-button slot="append" size="mini" icon="el-icon-search" @click="pickProduct(row)" />
                </el-input>
              </template>
            </el-table-column>
            <el-table-column label="规格" min-width="140">
              <template slot-scope="{row}">
                <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
                <span v-else-if="row.productId" class="sku-missing">未选规格</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="商品ID" width="110">
              <template slot-scope="{row}"><el-input v-model="row.productId" size="mini" readonly /></template>
            </el-table-column>
            <el-table-column label="送检" width="100">
              <template slot-scope="{row}">
                <!-- 送检数量 = 入库单的实入库数量，不由质检员改 -->
                <span v-if="fromInbound">{{ row.qtyReceived }}</span>
                <el-input-number v-else v-model="row.qtyReceived" :min="0" :precision="0" step-strictly v-int-only size="mini" controls-position="right" @change="syncQty(row, 'received')" />
              </template>
            </el-table-column>
            <!-- 合格 + 不合格 必须正好等于送检数：送检的每一件都要有结论，
                 多填是凭空多出库存，少填则剩下的货一直卡在待检区。
                 改一栏自动把另一栏补成差额，两栏永远配平 -->
            <el-table-column label="合格" width="100">
              <template slot-scope="{row}">
                <el-input-number v-model="row.qtyPass" :min="0" :max="Number(row.qtyReceived || 0)" :precision="0" step-strictly v-int-only size="mini" controls-position="right" @change="syncQty(row, 'pass')" />
              </template>
            </el-table-column>
            <el-table-column label="不合格" width="100">
              <template slot-scope="{row}">
                <el-input-number v-model="row.qtyFail" :min="0" :max="Number(row.qtyReceived || 0)" :precision="0" step-strictly v-int-only size="mini" controls-position="right" @change="syncQty(row, 'fail')" />
              </template>
            </el-table-column>
            <el-table-column label="处置" width="140">
              <template slot-scope="{row}">
                <el-select v-model="row.disposition" size="mini" style="width:100%">
                  <el-option label="合格入库" :value="0" />
                  <el-option label="转不合格区" :value="1" />
                  <el-option label="退回供应商" :value="2" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="合格品存放-货架" width="140">
              <template slot-scope="{row}">
                <!-- 退货区/不合格区货架不能放合格品：那两个区是「这批货有问题」的意思 -->
                <el-select v-model="row.passShelfId" size="mini" filterable clearable @change="onShelfChange(row)" style="width:100%">
                  <el-option
                    v-for="s in passShelfOptions"
                    :key="s.id"
                    :label="shelfOptionLabel(s)"
                    :value="s.id"
                    :disabled="shelfOptionDisabled(s, 'pass')"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="合格品存放-库位" width="170">
              <template slot-scope="{row}">
                <!-- 只列可售区库位：合格品搬到待检区/隔离区不会计入可售库存，等于白检 -->
                <el-select v-model="row.passLocationId" size="mini" filterable clearable :disabled="!row.passShelfId" style="width:100%">
                  <el-option
                    v-for="l in sellableLocations(row.passShelfId, row.passLocationId)"
                    :key="l.id"
                    :label="locationOptionLabel(l)"
                    :value="l.id"
                    :disabled="locationOptionDisabled(l, row.passLocationId)"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="不合格原因" width="170">
              <template slot-scope="{row}"><el-input v-model="row.failReason" size="mini" /></template>
            </el-table-column>
            <el-table-column v-if="editable && !fromInbound" label="操作" width="80" fixed="right">
              <template slot-scope="{$index}"><el-button type="text" class="danger-text" @click="form.items.splice($index,1)">删除</el-button></template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <div v-if="editable" slot="footer" class="inspect-dialog-footer">
        <el-button size="small" @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSaveForm">保存</el-button>
      </div>
    </el-dialog>

    <admin-picker-dialog ref="adminPicker" title="选择质检员" />
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { inspectApi, inboundApi, warehouseApi, shelfApi, locationApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';
import { doPrint } from '@/views/warehouse/components/printUtil';
import AdminPickerDialog from '../components/AdminPickerDialog.vue';
import ProductPickerDialog from '../components/ProductPickerDialog.vue';
import { locationLabel, locationDisabled } from '@/views/warehouse/components/locationCapacity';

/** 货架类型：3退货区 4不合格区（见 wms_shelf.type） */
const SHELF_TYPE_RETURN = 3;
const SHELF_TYPE_NG = 4;
const SHELF_TYPE_QC = 7;
/** 库位用途：2隔离/不合格区（见 wms_location.usage_type） */
const USAGE_NG = 2;

export default {
  name: 'WarehouseInspect',
  components: { AdminPickerDialog, ProductPickerDialog },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      warehouseList: [], merchantList: [], shelfCache: [], locationCache: {},
      inboundOptions: [], inboundLoading: false,
      query: { page: 1, limit: 20, code: '', warehouseId: null, inboundId: null, status: null, result: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      typeMap: { 0: '普通', 1: '托盘', 2: '零散', 3: '退货', 4: '不合格', 5: '冷藏', 6: '冷冻', 7: '待检' },
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        // 质检必须挂在入库单上：不关联入库单的质检单提交后会凭空加库存，
        // 库存流水里入库业务的单号会变成质检单号，货从哪来无从追溯（后端也拦了这条）
        inboundId: [{ required: true, message: '请选择关联入库单', trigger: 'change' }],
        inspectorName: [{ required: true, message: '请选择质检员', trigger: 'change' }],
      },
    };
  },
  computed: {
    editable() { return this.dialogMode === 'add' || this.dialogMode === 'edit'; },
    /** 明细来自入库单：商品、规格、送检数量都是收货时的既成事实，质检员只填检验结果 */
    fromInbound() { return !!this.form.inboundId; },
    dialogTitle() {
      if (this.dialogMode === 'add') return '新建质检单';
      return (this.dialogMode === 'edit' ? '编辑质检单 ' : '质检单详情') + (this.form.code || '');
    },
    /** 不合格品只能进不合格区货架 */
    ngShelfOptions() {
      return this.shelfCache.filter((s) => s.type === SHELF_TYPE_NG
        && (this.shelfIsActive(s) || this.isShelfSelected(s.id)));
    },
    /**
     * 合格品可选的货架：排除退货区和不合格区。
     * 那两个区的含义就是「这批货有问题」，把检合格的货放进去，要么永远不可售，
     * 要么和真正的问题货混在一起，下一次谁也分不清哪批是好的。
     */
    passShelfOptions() {
      return this.shelfCache.filter((s) => s.type !== SHELF_TYPE_RETURN
        && s.type !== SHELF_TYPE_NG && s.type !== SHELF_TYPE_QC && this.shelfIsActive(s));
    },
  },
  created() {
    if (this.$route.query.inboundId) this.query.inboundId = Number(this.$route.query.inboundId);
    this.loadWarehouses();
    this.loadMerchants();
    this.loadPage();
  },
  methods: {
    locationLabel,
    locationDisabled,
    shelfIsActive(shelf) { return Number(shelf && shelf.status) === 1; },
    isShelfSelected(shelfId) {
      if (shelfId == null) return false;
      if (this.form && this.form.ngShelfId != null && String(this.form.ngShelfId) === String(shelfId)) return true;
      return (this.form && this.form.items || []).some((item) => item.passShelfId != null
        && String(item.passShelfId) === String(shelfId));
    },
    isSellableShelf(shelfId) {
      const shelf = this.shelfCache.find((s) => s && String(s.id) === String(shelfId));
      return !!shelf && this.shelfIsActive(shelf)
        && shelf.type !== SHELF_TYPE_RETURN && shelf.type !== SHELF_TYPE_NG && shelf.type !== SHELF_TYPE_QC;
    },
    isSellableLocation(shelfId, locationId) {
      if (!this.isSellableShelf(shelfId) || locationId == null) return false;
      const location = (this.locationCache[shelfId] || []).find((l) => String(l.id) === String(locationId));
      return !!location && !location.usageType && Number(location.status) === 1;
    },
    shelfOptionLabel(shelf) {
      const code = shelf && (shelf.code || shelf.name) ? (shelf.code || shelf.name) : `货架${shelf && shelf.id != null ? shelf.id : ''}`;
      return this.shelfIsActive(shelf) ? code : `${code}（已停用）`;
    },
    shelfOptionDisabled(shelf, kind) {
      if (!this.shelfIsActive(shelf)) return true;
      if (kind === 'ng') return shelf.type !== SHELF_TYPE_NG;
      return shelf.type === SHELF_TYPE_RETURN || shelf.type === SHELF_TYPE_NG || shelf.type === SHELF_TYPE_QC;
    },
    locationOptionLabel(location) {
      const label = locationLabel(location);
      return Number(location && location.status) === 1 ? label : `${label}（已停用）`;
    },
    locationOptionDisabled(location, currentId) {
      if (currentId != null && location && location.id != null && String(location.id) === String(currentId)) return false;
      return Number(location && location.status) !== 1 || locationDisabled(location, currentId);
    },
    /**
     * 合格 / 不合格配平：改动一栏，另一栏自动补成「送检 - 本栏」。
     *
     * 送检的每一件都必须有结论，两栏之和只能等于送检数。以前只用 max 限制上限，
     * 质检员把合格从 10 改成 9 时不合格仍是 0，单据看着填完了、实际少判了一件，
     * 提交时才被后端打回。改哪栏就以哪栏为准，另一栏跟着走。
     */
    syncQty(row, which) {
      const received = Number(row.qtyReceived || 0);
      if (which === 'received') {
        // 送检数变了以合格为准收敛，合格超出新送检数时先压回上限
        row.qtyPass = Math.min(Number(row.qtyPass || 0), received);
        row.qtyFail = received - Number(row.qtyPass || 0);
        return;
      }
      if (which === 'pass') {
        row.qtyPass = Math.min(Math.max(Number(row.qtyPass || 0), 0), received);
        row.qtyFail = received - Number(row.qtyPass);
      } else {
        row.qtyFail = Math.min(Math.max(Number(row.qtyFail || 0), 0), received);
        row.qtyPass = received - Number(row.qtyFail);
      }
    },
    emptyForm() { return { warehouseId: null, inboundId: null, inboundCode: '', inspectorId: null, inspectorName: '', inspectorPhone: '', ngShelfId: null, ngLocationId: null, remark: '', items: [] }; },
    /** 有不合格数即判为「存在不合格」，草稿还没填结果时不下结论 */
    resultText(row) {
      if ((row.totalReceived || 0) === 0) return '未填写';
      return (row.totalFail || 0) > 0 ? '存在不合格' : '全部合格';
    },
    resultTagType(row) {
      if ((row.totalReceived || 0) === 0) return 'info';
      return (row.totalFail || 0) > 0 ? 'danger' : 'success';
    },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadMerchants() {
      try {
        const r = await merchantListApi({ page: 1, limit: 999 });
        this.merchantList = (r && r.list) || (r && r.records) || [];
      } catch (e) { this.merchantList = []; }
    },
    async loadPage() { this.loading = true; try { const r = await inspectApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; } finally { this.loading = false; } },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, inboundId: null, status: null, result: null }; this.loadPage(); },
    async openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; this.loadInboundOptions(); },
    async openDetail(id) { await this.openDoc(id, 'view'); },
    async onPrint(row) {
      try { await doPrint('QC', row.id); }
      catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    /** 草稿才可编辑，状态判断以后端为准，这里只做入口控制 */
    async openEdit(row) {
      if (row.status !== 0) return this.$message.warning('只有草稿状态的质检单可以修改');
      await this.openDoc(row.id, 'edit');
    },
    async openDoc(id, mode) {
      const d = await inspectApi.detail(id);
      this.form = d || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.dialogMode = mode;
      this.dialogVisible = true;
      await this.onWarehouseChange();
      await this.loadNgLocations();
      // 明细里已选的货架要把库位选项带出来，否则编辑时库位下拉是空的
      for (const it of this.form.items) { if (it.passShelfId) await this.ensureLocations(it.passShelfId); }
      // 历史草稿可能没存合格品库位，编辑时补个默认值，免得保存被校验一直拦住
      if (mode === 'edit') await this.fillDefaultPassLocation();
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onWarehouseChange() {
      if (!this.form.warehouseId) { this.shelfCache = []; this.locationCache = {}; return; }
      try {
        const r = await shelfApi.page({ page: 1, limit: 999, warehouseId: this.form.warehouseId });
        // 保留停用项只用于展示历史草稿；下拉项通过 shelfOptionDisabled 禁止新选。
        this.shelfCache = (r && r.list) || [];
      } catch (e) { this.shelfCache = []; }
      this.locationCache = {};
    },
    /**
     * 只列已生效(status=1)且未生成质检单(inspectStatus=0)的入库单，避免选到重复质检的单。
     * 已选仓库时按仓库过滤：质检是对本仓实物抽检，关联到别的仓的入库单没有意义，
     * 明细带出来的库位也不属于当前仓。
     */
    async loadInboundOptions(keyword) {
      this.inboundLoading = true;
      try {
        const params = { page: 1, limit: 50, status: 1, inspectStatus: 0, code: keyword || '' };
        if (this.form.warehouseId) params.warehouseId = this.form.warehouseId;
        const r = await inboundApi.page(params);
        this.inboundOptions = (r && r.list) || [];
      } catch (e) { this.inboundOptions = []; } finally { this.inboundLoading = false; }
    },
    /**
     * 用户手动换仓：已选的入库单多半不属于新仓，直接清掉重新拉，
     * 不能复用 onWarehouseChange —— 那个方法也被 onInboundChange 调用，会把刚选的单清掉。
     */
    async onWarehouseSelect() {
      this.form.inboundId = null;
      this.form.inboundCode = '';
      await this.onWarehouseChange();
      await this.loadInboundOptions();
    },
    /** 选定入库单后带出单号、仓库与质检明细，仓库变化要重新拉货架 */
    async onInboundChange(id) {
      const ib = this.inboundOptions.find(x => x.id === id);
      if (!ib) {
        // 清空关联入库单时把带出来的明细一并清掉，否则会留下一堆改不了的行
        this.form.inboundCode = '';
        this.form.items = [];
        return;
      }
      this.form.inboundCode = ib.code;
      if (ib.warehouseId && ib.warehouseId !== this.form.warehouseId) {
        this.form.warehouseId = ib.warehouseId;
        await this.onWarehouseChange();
      }
      await this.loadItemsFromInbound(id);
    },
    /**
     * 按入库单明细生成质检明细：商品、规格、送检数量都取收货时的既成事实，
     * 质检员只需要填合格/不合格数量、合格品存放库位和不合格原因。
     * 实入库数量为 0 的行不用检，直接跳过。
     */
    async loadItemsFromInbound(inboundId) {
      try {
        const d = await inboundApi.detail(inboundId);
        const list = (d && d.items) || [];
        const items = [];
        for (const s of list) {
          const qty = Number(s.actualInboundNum || 0);
          if (qty <= 0) continue;
          items.push({
            productId: s.productId,
            attrValueId: s.attrValueId,
            sku: s.sku || '',
            barCode: s.barCode || '',
            merId: s.merId != null ? s.merId : (d.merId || null),
            platformType: s.platformType != null ? s.platformType : 0,
            goodsName: s.goodsName || '',
            batchId: s.batchId || null,
            qtyReceived: qty,
            qtyPass: qty, // 默认全合格，质检员按实际改
            qtyFail: 0,
            disposition: 0,
            srcShelfId: s.shelfId || null,
            srcLocationId: s.locationId || null,
            // 合格品库位不给默认值：入库的货现在停在待检区，默认成来源库位的话
            // 质检提交时判定「库位没变」不搬货，合格品会一直留在待检区变不成可售库存
            passShelfId: null,
            passLocationId: null,
            ngLocationId: null,
            failReason: '',
          });
        }
        this.form.items = items;
        await this.fillDefaultPassLocation();
        if (!items.length) this.$message.warning('该入库单没有实入库数量大于 0 的明细，无需质检');
      } catch (e) {
        this.$message.error('加载入库单明细失败');
      }
    },
    /**
     * 找本仓第一个可售区库位，作为合格品存放的默认值。
     * 合格品必须落到可售区才会计入可售库存，让操作员在最右侧的列里自己找一遍太折磨人。
     * 该仓没有可售区库位时返回 null，由校验提示去配置。
     */
    async findDefaultSellableLocation() {
      for (const shelf of this.shelfCache) {
        if (!this.shelfIsActive(shelf)
          || shelf.type === SHELF_TYPE_RETURN || shelf.type === SHELF_TYPE_NG || shelf.type === SHELF_TYPE_QC) continue;
        await this.ensureLocations(shelf.id);
        const hit = (this.locationCache[shelf.id] || []).find((l) => Number(l.usageType || 0) === 0 && Number(l.status) === 1);
        if (hit) return { shelfId: shelf.id, locationId: hit.id };
      }
      return null;
    },
    /** 给还没指定合格品库位的明细行补上默认可售库位 */
    async fillDefaultPassLocation() {
      const need = this.form.items.filter((it) => !it.passLocationId);
      if (!need.length) return;
      const def = await this.findDefaultSellableLocation();
      if (!def) return;
      need.forEach((it) => {
        this.$set(it, 'passShelfId', def.shelfId);
        this.$set(it, 'passLocationId', def.locationId);
      });
    },

    /** 合格品只能进可售区(usageType=0)；老数据 usageType 为空按可售区处理 */
    sellableLocations(shelfId, currentId) {
      if (!this.isSellableShelf(shelfId)) return [];
      return (this.locationCache[shelfId] || []).filter((l) => Number(l.usageType || 0) === 0
        && (Number(l.status) === 1 || (currentId != null && String(l.id) === String(currentId))));
    },
    /** 不合格品只能进隔离/不合格区库位(usageType=2) */
    ngLocations(shelfId, currentId) {
      return (this.locationCache[shelfId] || []).filter((l) => l.usageType === USAGE_NG
        && (Number(l.status) === 1 || (currentId != null && String(l.id) === String(currentId))));
    },
    merchantText(merId) {
      const m = this.merchantList.find(x => x.id === merId);
      return m ? m.name : (merId || '-');
    },
    async loadNgLocations() { await this.ensureLocations(this.form.ngShelfId); },
    ngLocationLabel(l) {
      const rc = [l.rowNo, l.colNo, l.layerNo].filter(v => v != null && v !== '');
      const pos = rc.length ? `（${rc.join('-')}）` : '';
      // 不良品库位同样受容量约束，位置标注之外再补一段余量
      const room = l.remainNum == null ? '' : (l.remainNum <= 0 ? '（已满）' : `（剩余 ${l.remainNum}/${l.capacity}）`);
      const label = `${l.code}${pos}${room}`;
      return Number(l.status) === 1 ? label : `${label}（已停用）`;
    },
    async onNgShelfChange() {
      this.form.ngLocationId = null;
      await this.ensureLocations(this.form.ngShelfId);
    },
    async ensureLocations(shelfId) {
      if (!shelfId || this.locationCache[shelfId]) return;
      try {
        // 停用库位要保留给历史草稿显示，是否可新选由 sellable/ngLocations 过滤。
        const list = await locationApi.list(shelfId) || [];
        this.$set(this.locationCache, shelfId, list);
      } catch (e) {}
    },
    async onShelfChange(row) {
      row.passLocationId = null;
      await this.ensureLocations(row.passShelfId);
    },
    addItem() { this.form.items.push({ merId: null, productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, goodsName: '', batchId: null, qtyReceived: 0, qtyPass: 0, qtyFail: 0, disposition: 0, passShelfId: null, passLocationId: null, ngLocationId: null, failReason: '' }); },
    onShopChange(row) {
      this.$set(row, 'productId', null);
      this.$set(row, 'goodsName', '');
      this.$set(row, 'attrValueId', null);
      this.$set(row, 'sku', '');
      this.$set(row, 'barCode', '');
      this.$set(row, 'batchId', null);
      this.$set(row, 'platformType', 0);
    },
    async pickInspector() {
      const u = await this.$refs.adminPicker.open();
      if (!u) return;
      this.form.inspectorId = u.id;
      this.form.inspectorName = u.realName || u.account || '';
      this.form.inspectorPhone = u.phone || '';
      // 程序赋值不会触发 el-input 的 change，手动清掉必填校验的红字
      this.$refs.formRef && this.$refs.formRef.validateField('inspectorName');
    },
    async pickProduct(row) {
      // 质检是对仓内实物抽检，没库存无从检起
      if (!this.form.warehouseId) return this.$message.warning('请先选择仓库，再选择商品');
      const res = await this.$refs.productPicker.open({
        merId: row.merId,
        requireStock: true,
        warehouseId: this.form.warehouseId,
      });
      if (!res || !res.product) return;
      const seen = new Set();
      const skus = (res.skus || []).filter((sku) => {
        if (!sku || sku.id == null || seen.has(sku.id)) return false;
        seen.add(sku.id);
        return true;
      });
      if (!skus.length) return;

      this.applyInspectSku(row, res.product, skus[0]);
      if (skus.length > 1) {
        const idx = this.form.items.indexOf(row);
        const extras = skus.slice(1).map((sku) => {
          // 保留当前行的数量、处置和库位上下文，每个规格生成一条独立质检明细。
          const clone = JSON.parse(JSON.stringify(row));
          this.applyInspectSku(clone, res.product, sku);
          return clone;
        });
        this.form.items.splice(idx < 0 ? this.form.items.length : idx + 1, 0, ...extras);
      }
    },
    applyInspectSku(row, product, sku) {
      this.$set(row, 'productId', product.id);
      this.$set(row, 'goodsName', product.name);
      this.$set(row, 'attrValueId', sku.id);
      this.$set(row, 'sku', sku.sku || '');
      this.$set(row, 'barCode', sku.barCode || '');
      if (product.merId != null) this.$set(row, 'merId', product.merId);
      this.$set(row, 'platformType', 0);
    },
    validateZoneSelections() {
      const passShelf = this.form.items.find((item) => Number(item.qtyPass || 0) > 0
        && !this.isSellableShelf(item.passShelfId));
      if (passShelf) {
        return this.$message.warning('合格品有入库数量，请选择启用的普通可售货架');
      }
      const needNg = this.form.items.some((item) => Number(item.qtyFail || 0) > 0
        && Number(item.disposition) === 1);
      if (needNg && !this.form.ngShelfId) {
        return this.$message.warning('有转入不合格区的数量，请选择不合格区货架');
      }
      if (needNg && !this.form.ngLocationId) {
        return this.$message.warning('有转入不合格区的数量，请选择不合格区库位');
      }
      if (this.form.ngShelfId != null && this.shelfCache.some((s) => String(s.id) === String(this.form.ngShelfId)
        && this.shelfOptionDisabled(s, 'ng'))) {
        return this.$message.warning('不合格区货架已停用或类型不匹配，请重新选择货架');
      }
      const passLocation = this.form.items.find((item) => item.passLocationId != null
        && (this.locationCache[item.passShelfId] || []).some((l) => String(l.id) === String(item.passLocationId)
          && Number(l.status) !== 1));
      if (passLocation) {
        return this.$message.warning('合格品存放库位已停用，请重新选择库位');
      }
      const invalidPassLocation = this.form.items.find((item) => Number(item.qtyPass || 0) > 0
        && !this.isSellableLocation(item.passShelfId, item.passLocationId));
      if (invalidPassLocation) {
        return this.$message.warning('合格品存放库位必须属于可售货架且处于启用状态');
      }
      if (this.form.ngLocationId != null
        && (this.locationCache[this.form.ngShelfId] || []).some((l) => String(l.id) === String(this.form.ngLocationId)
          && Number(l.status) !== 1)) {
        return this.$message.warning('不合格区库位已停用，请重新选择库位');
      }
      if (this.form.ngLocationId != null
        && !this.ngLocations(this.form.ngShelfId, this.form.ngLocationId)
          .some((l) => String(l.id) === String(this.form.ngLocationId))) {
        return this.$message.warning('不合格区库位必须属于所选不合格区货架');
      }
      return true;
    },
    async onSaveForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      const noShop = this.form.items.findIndex((item) => !item.merId);
      if (noShop >= 0) return this.$message.warning(`第 ${noShop + 1} 行未选择店铺`);
      const noProduct = this.form.items.findIndex((item) => !item.productId);
      if (noProduct >= 0) return this.$message.warning(`第 ${noProduct + 1} 行未选择商品`);
      const noSku = this.form.items.findIndex((item) => !item.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格`);
      // 数量先于库位校验：数量填错是更基础的错，先让人把数改对再去挑库位
      // input-number 的 max 只挡加减按钮和失焦校正，手输仍可能越界，保存前再算一遍
      const badQty = this.form.items.findIndex(
        (item) => Number(item.qtyPass || 0) + Number(item.qtyFail || 0) !== Number(item.qtyReceived || 0),
      );
      if (badQty >= 0) {
        const it = this.form.items[badQty];
        return this.$message.warning(
          `第 ${badQty + 1} 行合格 ${Number(it.qtyPass || 0)} + 不合格 ${Number(it.qtyFail || 0)}`
          + ` 与送检数 ${Number(it.qtyReceived || 0)} 不一致，送检的每一件都要有结论`,
        );
      }
      // 入库的货停在待检区，合格品必须指定一个可售区库位才会真正变成可售库存
      const noPassLoc = this.form.items.findIndex((item) => Number(item.qtyPass || 0) > 0
        && (!item.passShelfId || !item.passLocationId));
      if (noPassLoc >= 0) {
        return this.$message.warning(
          `第 ${noPassLoc + 1} 行有合格数量，请在明细表最右侧的「合格品存放-货架 / 库位」里选择一个可售区库位；`
          + '若下拉为空，说明该仓库还没有可售区库位，请先到货架管理配置',
        );
      }
      if (this.validateZoneSelections() !== true) return;
      this.saving = true;
      try {
        if (this.dialogMode === 'edit') { await inspectApi.update(this.form); this.$message.success('修改成功'); }
        else { await inspectApi.add(this.form); this.$message.success('保存成功'); }
        this.dialogVisible = false; this.loadPage();
      }
      finally { this.saving = false; }
    },
    async onSubmit(row) {
      await this.$confirm('提交后将按处置策略入库，不可撤销。继续', '确认', { type: 'warning' });
      // 入库单自动生成的质检单没有质检员，用当前登录用户补写
      const u = this.$store.getters.userInfo || {};
      await inspectApi.submit(row.id, {
        inspectorId: u.id,
        inspectorName: u.realName || u.account || this.$store.getters.name,
        inspectorPhone: u.phone,
      });
      this.$message.success('已完成'); this.loadPage();
    },
    async onCancel(row) { await this.$confirm(`作废单据「${row.code}」`, '提示', { type: 'warning' }); await inspectApi.cancel(row.id); this.$message.success('已作废'); this.loadPage(); },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.sku-missing { color: #f56c6c; font-size: 12px; }
.qty-pass { color: #67c23a; }
.qty-fail { color: #f56c6c; font-weight: 600; }
.dialog-table-scroller {
  margin-top: 8px;
}
</style>

<style>
.warehouse-inspect-dialog {
  display: flex;
  flex-direction: column;
  width: 1200px;
  max-width: calc(100vw - 48px);
  max-height: 90vh;
  margin-bottom: 0 !important;
  overflow: hidden;
  border: 1px solid #e6ebf2;
  border-radius: 12px;
  box-shadow: 0 16px 46px rgba(27, 46, 74, 0.22);
}

.warehouse-inspect-dialog .el-dialog__header {
  flex: 0 0 auto;
  padding: 18px 24px 16px;
  border-bottom: 1px solid #edf0f5;
  background: linear-gradient(180deg, #fbfdff 0%, #ffffff 100%);
}

.warehouse-inspect-dialog .el-dialog__title {
  color: #1f2d3d;
  font-size: 16px;
  font-weight: 600;
}

.warehouse-inspect-dialog .el-dialog__headerbtn {
  top: 18px;
  right: 22px;
}

.warehouse-inspect-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 22px 24px 18px;
  overflow-x: hidden;
  overflow-y: auto;
  background: #fff;
}

.warehouse-inspect-dialog .el-dialog__footer {
  flex: 0 0 auto;
  padding: 12px 24px;
  border-top: 1px solid #edf0f5;
  background: #fafbfd;
}

.warehouse-inspect-dialog .inspect-form-grid {
  padding: 18px 16px 2px;
  border: 1px solid #e8edf5;
  border-radius: 9px;
  background: #fbfcff;
}

.warehouse-inspect-dialog .inspect-form-grid .el-form-item {
  margin-bottom: 16px;
}

.warehouse-inspect-dialog .inspect-form-grid .el-form-item__label {
  color: #5c6b7e;
  font-weight: 500;
}

.warehouse-inspect-dialog .el-input__inner,
.warehouse-inspect-dialog .el-textarea__inner,
.warehouse-inspect-dialog .el-select .el-input__inner {
  border-color: #dce4ef;
  border-radius: 6px;
}

.warehouse-inspect-dialog .el-input.is-disabled .el-input__inner,
.warehouse-inspect-dialog .el-textarea.is-disabled .el-textarea__inner,
.warehouse-inspect-dialog .el-select .el-input.is-disabled .el-input__inner {
  color: #64748b;
  background: #f5f7fb;
  border-color: #dce4ef;
}

.warehouse-inspect-dialog .inspect-section-divider {
  margin: 22px 0 12px;
}

.warehouse-inspect-dialog .inspect-section-divider .el-divider__text {
  padding: 0 14px 0 0;
  color: #25364d;
  font-size: 15px;
  font-weight: 600;
  background: #fff;
}

.warehouse-inspect-dialog .inspect-detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 30px;
  margin-bottom: 8px;
}

.warehouse-inspect-dialog .inspect-detail-hint {
  color: #8a97a8;
  font-size: 12px;
}

.warehouse-inspect-dialog .inspect-table-wrapper {
  margin-top: 0;
  overflow: hidden;
  border: 1px solid #e4eaf3;
  border-radius: 8px;
}

.warehouse-inspect-dialog .inspect-detail-table {
  color: #3f4d60;
}

.warehouse-inspect-dialog .inspect-detail-table th {
  color: #41526b;
  font-weight: 600;
  background: #eef4ff;
}

.warehouse-inspect-dialog .inspect-detail-table td,
.warehouse-inspect-dialog .inspect-detail-table th {
  border-color: #e7edf5;
}

.warehouse-inspect-dialog .inspect-detail-table .el-table__row:hover > td {
  background: #f7faff;
}

.warehouse-inspect-dialog .inspect-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .warehouse-inspect-dialog {
    max-width: calc(100vw - 24px);
    max-height: 94vh;
  }

  .warehouse-inspect-dialog .el-dialog__body {
    padding: 16px;
  }

  .warehouse-inspect-dialog .inspect-form-grid {
    padding: 14px 10px 0;
  }

  .warehouse-inspect-dialog .inspect-detail-hint {
    display: none;
  }
}
</style>
