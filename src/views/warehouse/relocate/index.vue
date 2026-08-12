<template>
  <div class="app-container warehouse-relocate-page">
    <el-form :inline="true" :model="query" size="small" class="filter-container relocate-filter-card">
      <el-form-item label="业务">
        <el-select v-model="query.bizType" clearable placeholder="全部" style="width:130px" @change="onSearch">
          <el-option v-for="(v,k) in bizMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="单号"><el-input v-model="query.code" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option label="草稿" :value="0" /><el-option label="已生效" :value="1" /><el-option label="已作废" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="create-buttons">
      <el-button class="create-action-btn" type="primary" icon="el-icon-upload2" size="small" @click="openDialog(0)">新建上架单</el-button>
      <el-button class="create-action-btn" type="primary" icon="el-icon-sort" size="small" @click="openDialog(1)">新建移库单</el-button>
      <el-button class="create-action-btn" type="primary" icon="el-icon-box" size="small" @click="openDialog(2)">新建补货单</el-button>
    </div>

    <el-table class="relocate-table" v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="单号" width="180" />
      <el-table-column label="业务" width="90">
        <template slot-scope="{row}"><el-tag size="mini">{{ bizMap[row.bizType] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="仓库" width="200">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="({0:'info',1:'success',2:'danger'})[row.status]" size="mini">{{ ({0:'草稿',1:'已生效',2:'已作废'})[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyUserName" label="申请人" width="120" />
      <el-table-column prop="applyUserPhone" label="联系方式" width="130" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right" align="center">
        <template slot-scope="{row}">
          <div class="relocate-action-group">
            <el-button class="relocate-action-btn" type="primary" plain size="mini" icon="el-icon-view" @click="openDetail(row.id)">详情</el-button>
            <el-button v-if="row.status===0" class="relocate-action-btn" type="warning" plain size="mini" icon="el-icon-edit" @click="openEdit(row)">修改</el-button>
            <el-button v-if="row.status===0" class="relocate-action-btn" type="success" plain size="mini" icon="el-icon-check" @click="onSubmit(row)">提交生效</el-button>
            <el-button v-if="row.status===0" class="relocate-action-btn" type="danger" plain size="mini" icon="el-icon-close" @click="onCancel(row)">作废</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="relocate-pagination"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadPage"
    />

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="1080px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" size="small" :disabled="dialogMode==='view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable style="width:100%" @change="onWarehouseChange">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人">
              <el-input v-model="form.applyUserName" readonly>
                <el-button slot="append" icon="el-icon-user" @click="pickApplyUser">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式">
              <el-input v-model="form.applyUserPhone" placeholder="选择申请人后自动带出，可手动修改" />
            </el-form-item>
          </el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>

        <el-divider content-position="left">明细</el-divider>
        <el-button v-if="editable" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <div class="dialog-table-scroller">
          <el-table :data="form.items" border size="mini" max-height="360">
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
            <el-table-column label="源货架" width="150">
              <template slot-scope="{row}">
                <el-select v-model="row.fromShelfId" size="mini" filterable clearable style="width:100%" @change="onShelfChange(row, 'from')">
                  <el-option v-for="s in shelfCache" :key="s.id" :label="s.code" :value="s.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="源库位" width="170">
              <template slot-scope="{row}">
                <el-select v-model="row.fromLocationId" size="mini" filterable clearable style="width:100%" :disabled="!row.fromShelfId">
                  <el-option v-for="l in (locationCache[row.fromShelfId]||[])" :key="l.id" :label="l.code" :value="l.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="目标货架" width="150">
              <template slot-scope="{row}">
                <el-select v-model="row.toShelfId" size="mini" filterable clearable style="width:100%" @change="onShelfChange(row, 'to')">
                  <el-option v-for="s in shelfCache" :key="s.id" :label="s.code" :value="s.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="目标库位" width="170">
              <template slot-scope="{row}">
                <el-select v-model="row.toLocationId" size="mini" filterable clearable style="width:100%" :disabled="!row.toShelfId">
                  <el-option v-for="l in (locationCache[row.toShelfId]||[])" :key="l.id" :label="l.code" :value="l.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="110">
              <template slot-scope="{row}"><el-input-number v-model="row.num" :min="1" size="mini" controls-position="right" /></template>
            </el-table-column>
            <el-table-column v-if="editable" label="操作" width="80" fixed="right">
              <template slot-scope="{$index}"><el-button type="text" class="danger-text" @click="form.items.splice($index,1)">删除</el-button></template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <div v-if="editable" slot="footer">
        <el-button size="small" @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSaveForm">保存</el-button>
      </div>
    </el-dialog>

    <admin-picker-dialog ref="adminPicker" title="选择申请人" />
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { relocateApi, warehouseApi, shelfApi, locationApi } from '@/api/warehouse';
import AdminPickerDialog from '../components/AdminPickerDialog.vue';
import ProductPickerDialog from '../components/ProductPickerDialog.vue';

export default {
  name: 'WarehouseRelocate',
  components: { AdminPickerDialog, ProductPickerDialog },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      warehouseList: [], shelfCache: [], locationCache: {},
      query: { page: 1, limit: 20, code: '', warehouseId: null, bizType: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      bizMap: { 0: '上架', 1: '移库', 2: '补货' },
      rules: { warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }] },
    };
  },
  computed: {
    editable() { return this.dialogMode === 'add' || this.dialogMode === 'edit'; },
    dialogTitle() {
      const biz = this.bizMap[this.form.bizType];
      if (this.dialogMode === 'add') return '新建' + biz + '单';
      return (this.dialogMode === 'edit' ? '编辑' + biz + '单 ' : biz + '单详情 ') + (this.form.code || '');
    },
  },
  created() { this.loadWarehouses(); this.loadPage(); },
  methods: {
    emptyForm() { return { bizType: 1, warehouseId: null, applyUserId: null, applyUserName: '', applyUserPhone: '', remark: '', items: [] }; },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadPage() {
      this.loading = true;
      try { const r = await relocateApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, bizType: null, status: null }; this.loadPage(); },
    openDialog(bizType) { this.form = { ...this.emptyForm(), bizType }; this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) { await this.openDoc(id, 'view'); },
    /** 草稿才可编辑，状态判断以后端为准，这里只做入口控制 */
    async openEdit(row) {
      if (row.status !== 0) return this.$message.warning('只有草稿状态的单据可以修改');
      await this.openDoc(row.id, 'edit');
    },
    async openDoc(id, mode) {
      const d = await relocateApi.detail(id);
      this.form = d || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.dialogMode = mode;
      this.dialogVisible = true;
      await this.onWarehouseChange();
      // 明细里已选的货架要把库位选项带出来，否则编辑时库位下拉是空的
      for (const it of this.form.items) {
        await this.ensureLocations(it.fromShelfId);
        await this.ensureLocations(it.toShelfId);
      }
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onWarehouseChange() {
      if (!this.form.warehouseId) { this.shelfCache = []; this.locationCache = {}; return; }
      try {
        const r = await shelfApi.page({ page: 1, limit: 999, warehouseId: this.form.warehouseId, status: 1 });
        this.shelfCache = (r && r.list) || [];
      } catch (e) {}
      this.locationCache = {};
    },
    async ensureLocations(shelfId) {
      if (!shelfId || this.locationCache[shelfId]) return;
      try { const list = await locationApi.list(shelfId) || []; this.$set(this.locationCache, shelfId, list.filter(l => l.status === 1)); } catch (e) {}
    },
    async onShelfChange(row, side) {
      if (side === 'from') row.fromLocationId = null;
      else row.toLocationId = null;
      await this.ensureLocations(side === 'from' ? row.fromShelfId : row.toShelfId);
    },
    addItem() { this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, goodsName: '', fromShelfId: null, fromLocationId: null, fromBatchId: null, toShelfId: null, toLocationId: null, toBatchId: null, num: 1 }); },
    async pickApplyUser() {
      const u = await this.$refs.adminPicker.open();
      if (!u) return;
      this.$set(this.form, 'applyUserId', u.id);
      this.$set(this.form, 'applyUserName', u.realName || u.account || '');
      this.$set(this.form, 'applyUserPhone', u.phone || '');
    },
    /**
     * 移库不复用 mixin 的 pickProduct：这里一行明细描述的是「从某库位搬到某库位」，
     * 多选规格自动展开成多行没有意义（每行的源/目标库位都不同），所以只取第一个规格。
     */
    async pickProduct(row) {
      // 上架/移库/补货都是搬动仓内已有的货，没库存搬不了
      const res = await this.$refs.productPicker.open({ requireStock: true });
      if (!res || !res.product) return;
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
      if (this.form.items.find((i) => !i.productId)) return this.$message.warning('请为每行选择商品');
      // 移库按 SKU 定位源库位，缺 attrValueId 会搬错规格甚至找不到库存行
      const noSku = this.form.items.findIndex((i) => !i.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格，请重新选择商品并指定规格`);
      this.saving = true;
      try {
        if (this.dialogMode === 'edit') { await relocateApi.update(this.form); this.$message.success('修改成功'); }
        else { await relocateApi.add(this.form); this.$message.success('保存成功'); }
        this.dialogVisible = false; this.loadPage();
      } finally { this.saving = false; }
    },
    async onSubmit(row) {
      await this.$confirm('提交后将按明细执行库位间移动，不可撤销。继续', '确认', { type: 'warning' });
      await relocateApi.submit(row.id);
      this.$message.success('已生效'); this.loadPage();
    },
    async onCancel(row) { await this.$confirm(`作废单据「${row.code}」?`, '提示', { type: 'warning' }); await relocateApi.cancel(row.id); this.$message.success('已作废'); this.loadPage(); },
  },
};
</script>

<style scoped>
.warehouse-relocate-page { padding-bottom: 18px; }
.relocate-filter-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px 18px 2px;
  margin-bottom: 16px;
  border: 1px solid #e6ebf2;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.04);
}
.relocate-filter-card >>> .el-form-item { margin-bottom: 14px; }
.relocate-filter-card >>> .el-form-item__label { color: #53657b; font-weight: 500; }
.relocate-filter-card >>> .el-input__inner,
.relocate-filter-card >>> .el-select .el-input__inner { border-color: #dce4ef; border-radius: 6px; }
.create-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.create-action-btn { min-width: 126px; border-radius: 6px; box-shadow: 0 3px 8px rgba(64, 158, 255, 0.16); }
.relocate-table { overflow: hidden; border-radius: 8px; border: 1px solid #e4eaf3; }
.relocate-table >>> th {
  height: 48px;
  color: #41526b;
  font-weight: 600;
  background: #eef4ff;
  border-color: #e1e8f2;
}
.relocate-table >>> td { height: 58px; color: #3f4d60; border-color: #edf1f6; }
.relocate-table >>> .el-table__row:hover > td { background: #f7faff; }
.relocate-table >>> .el-tag { border-radius: 4px; }
.relocate-action-group { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 7px; }
.relocate-action-btn { min-width: 64px; margin: 0 !important; border-radius: 5px; }
.relocate-pagination { margin-top: 16px; text-align: right; }
.danger-text { color: #f56c6c; }
.sku-missing { color: #f56c6c; font-size: 12px; }
.dialog-table-scroller {
  margin-top: 8px;
}

@media (max-width: 960px) {
  .relocate-filter-card { padding-left: 12px; padding-right: 12px; }
  .relocate-action-btn { min-width: 58px; padding-left: 8px; padding-right: 8px; }
}
</style>
