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
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog">新建璐ㄦ鍗</el-button>
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
      <el-table-column prop="inspectorName" label="质检员" width="120" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
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

    <el-dialog :title="dialogMode==='view'?'质检单详情'+(form.code||''):'新建质检单'" :visible.sync="dialogVisible" width="1080px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" size="small" :disabled="dialogMode==='view'">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable style="width:100%" @change="onWarehouseChange">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="关联入库单ID"><el-input v-model.number="form.inboundId" type="number" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="关联入库单号"><el-input v-model="form.inboundCode" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="质检员">
              <el-input v-model="form.inspectorName" readonly>
                <el-button slot="append" icon="el-icon-user" @click="pickInspector">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="不合格区货架">
              <el-select v-model="form.ngShelfId" filterable clearable style="width:100%" placeholder="不合格品统一入这个货架?(鍙┖)">
                <el-option v-for="s in shelfCache" :key="s.id" :label="`${s.code} (${typeMap[s.type]||''})`" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>

        <el-divider content-position="left">璐ㄦ明细</el-divider>
        <el-button v-if="dialogMode==='add'" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <div class="dialog-table-scroller">
          <el-table :data="form.items" border size="mini">
            <el-table-column type="index" width="50" fixed="left" />
            <el-table-column label="商品" min-width="200">
              <template slot-scope="{row}">
                <el-input v-model="row.goodsName" size="mini" readonly>
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
              <template slot-scope="{row}"><el-input-number v-model="row.qtyReceived" :min="0" size="mini" controls-position="right" /></template>
            </el-table-column>
            <el-table-column label="合格" width="100">
              <template slot-scope="{row}"><el-input-number v-model="row.qtyPass" :min="0" size="mini" controls-position="right" /></template>
            </el-table-column>
            <el-table-column label="不合格" width="100">
              <template slot-scope="{row}"><el-input-number v-model="row.qtyFail" :min="0" size="mini" controls-position="right" /></template>
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
            <el-table-column label="合格入库-货架" width="140">
              <template slot-scope="{row}">
                <el-select v-model="row.passShelfId" size="mini" filterable clearable @change="onShelfChange(row)" style="width:100%">
                  <el-option v-for="s in shelfCache" :key="s.id" :label="s.code" :value="s.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="合格入库-库位" width="170">
              <template slot-scope="{row}">
                <el-select v-model="row.passLocationId" size="mini" filterable clearable :disabled="!row.passShelfId" style="width:100%">
                  <el-option v-for="l in (locationCache[row.passShelfId]||[])" :key="l.id" :label="l.code" :value="l.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="不合格原因" width="170">
              <template slot-scope="{row}"><el-input v-model="row.failReason" size="mini" /></template>
            </el-table-column>
            <el-table-column v-if="dialogMode==='add'" label="操作" width="80" fixed="right">
              <template slot-scope="{$index}"><el-button type="text" class="danger-text" @click="form.items.splice($index,1)">删除</el-button></template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <div v-if="dialogMode==='add'" slot="footer">
        <el-button size="small" @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSaveForm">保存</el-button>
      </div>
    </el-dialog>

    <user-picker-dialog ref="userPicker" />
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { inspectApi, warehouseApi, shelfApi, locationApi } from '@/api/warehouse';
import UserPickerDialog from '../components/UserPickerDialog.vue';
import ProductPickerDialog from '../components/ProductPickerDialog.vue';

export default {
  name: 'WarehouseInspect',
  components: { UserPickerDialog, ProductPickerDialog },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      warehouseList: [], shelfCache: [], locationCache: {},
      query: { page: 1, limit: 20, code: '', warehouseId: null, inboundId: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      typeMap: { 0: '普通', 1: '托盘', 2: '零散', 3: '退货', 4: '不合格', 5: '冷藏', 6: '冷冻' },
      rules: { warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }] },
    };
  },
  created() {
    if (this.$route.query.inboundId) this.query.inboundId = Number(this.$route.query.inboundId);
    this.loadWarehouses();
    this.loadPage();
  },
  methods: {
    emptyForm() { return { warehouseId: null, inboundId: null, inboundCode: '', inspectorId: null, inspectorName: '', ngShelfId: null, remark: '', items: [] }; },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadPage() { this.loading = true; try { const r = await inspectApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; } finally { this.loading = false; } },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, inboundId: null, status: null }; this.loadPage(); },
    async openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) { const d = await inspectApi.detail(id); this.form = d || this.emptyForm(); if (!this.form.items) this.form.items = []; this.dialogMode = 'view'; this.dialogVisible = true; await this.onWarehouseChange(); },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onWarehouseChange() {
      if (!this.form.warehouseId) { this.shelfCache = []; this.locationCache = {}; return; }
      try { const r = await shelfApi.page({ page: 1, limit: 999, warehouseId: this.form.warehouseId, status: 1 }); this.shelfCache = (r && r.list) || []; } catch (e) {}
      this.locationCache = {};
    },
    async onShelfChange(row) {
      row.passLocationId = null;
      if (!row.passShelfId || this.locationCache[row.passShelfId]) return;
      try { const list = await locationApi.list(row.passShelfId) || []; this.$set(this.locationCache, row.passShelfId, list.filter(l => l.status === 1)); } catch (e) {}
    },
    addItem() { this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, goodsName: '', batchId: null, qtyReceived: 0, qtyPass: 0, qtyFail: 0, disposition: 0, passShelfId: null, passLocationId: null, ngLocationId: null, failReason: '' }); },
    async pickInspector() {
      const u = await this.$refs.userPicker.open();
      if (!u) return;
      this.form.inspectorId = u.uid != null ? u.uid : u.id;
      this.form.inspectorName = u.nickname || u.username || u.phone || '';
    },
    async pickProduct(row) {
      const res = await this.$refs.productPicker.open();
      if (!res || !res.product) return;
      // 质检一行对应一个批次的收货实物，只取第一个规格，不展开多行
      const sku = res.skus && res.skus.length ? res.skus[0] : null;
      this.$set(row, 'productId', res.product.id);
      this.$set(row, 'goodsName', res.product.name);
      this.$set(row, 'attrValueId', sku ? sku.id : null);
      this.$set(row, 'sku', sku ? sku.sku : '');
      this.$set(row, 'barCode', sku ? sku.barCode : '');
    },
    async onSaveForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      this.saving = true;
      try { await inspectApi.add(this.form); this.$message.success('保存成功'); this.dialogVisible = false; this.loadPage(); }
      finally { this.saving = false; }
    },
    async onSubmit(row) {
      await this.$confirm('提交后将按处置策略入库，不可撤销。继续', '确认', { type: 'warning' });
      await inspectApi.submit(row.id);
      this.$message.success('已完成'); this.loadPage();
    },
    async onCancel(row) { await this.$confirm(`作废单据「{row.code}」`, '提示', { type: 'warning' }); await inspectApi.cancel(row.id); this.$message.success('已作废'); this.loadPage(); },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.sku-missing { color: #f56c6c; font-size: 12px; }
.dialog-table-scroller {
  margin-top: 8px;
  max-height: 360px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.dialog-table-scroller >>> .el-table {
  min-width: 1300px;
}
</style>
