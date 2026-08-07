<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
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

    <div style="margin-bottom:12px">
      <el-dropdown @command="openDialog" size="small">
        <el-button type="primary" icon="el-icon-plus" size="small">新建 <i class="el-icon-arrow-down el-icon--right"></i></el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item :command="0">上架单</el-dropdown-item>
          <el-dropdown-item :command="1">移库单</el-dropdown-item>
          <el-dropdown-item :command="2">补货单</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
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
import { relocateApi, warehouseApi, shelfApi, locationApi } from '@/api/warehouse';
import UserPickerDialog from '../components/UserPickerDialog.vue';
import ProductPickerDialog from '../components/ProductPickerDialog.vue';

export default {
  name: 'WarehouseRelocate',
  components: { UserPickerDialog, ProductPickerDialog },
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
    dialogTitle() { return this.dialogMode === 'view' ? (this.bizMap[this.form.bizType] + '单详情 ' + (this.form.code || '')) : '新建' + this.bizMap[this.form.bizType] + '单'; },
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
    async openDetail(id) { const d = await relocateApi.detail(id); this.form = d || this.emptyForm(); if (!this.form.items) this.form.items = []; this.dialogMode = 'view'; this.dialogVisible = true; await this.onWarehouseChange(); },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onWarehouseChange() {
      if (!this.form.warehouseId) { this.shelfCache = []; this.locationCache = {}; return; }
      try {
        const r = await shelfApi.page({ page: 1, limit: 999, warehouseId: this.form.warehouseId, status: 1 });
        this.shelfCache = (r && r.list) || [];
      } catch (e) {}
      this.locationCache = {};
    },
    async onShelfChange(row, side) {
      if (side === 'from') row.fromLocationId = null;
      else row.toLocationId = null;
      const sid = side === 'from' ? row.fromShelfId : row.toShelfId;
      if (!sid || this.locationCache[sid]) return;
      try { const list = await locationApi.list(sid) || []; this.$set(this.locationCache, sid, list.filter(l => l.status === 1)); } catch (e) {}
    },
    addItem() { this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, goodsName: '', fromShelfId: null, fromLocationId: null, fromBatchId: null, toShelfId: null, toLocationId: null, toBatchId: null, num: 1 }); },
    async pickApplyUser() {
      const u = await this.$refs.userPicker.open();
      if (!u) return;
      this.$set(this.form, 'applyUserId', u.uid != null ? u.uid : u.id);
      this.$set(this.form, 'applyUserName', u.nickname || u.username || u.phone || '');
      this.$set(this.form, 'applyUserPhone', u.phone || '');
    },
    /**
     * 移库不复用 mixin 的 pickProduct：这里一行明细描述的是「从某库位搬到某库位」，
     * 多选规格自动展开成多行没有意义（每行的源/目标库位都不同），所以只取第一个规格。
     */
    async pickProduct(row) {
      const res = await this.$refs.productPicker.open();
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
      try { await relocateApi.add(this.form); this.$message.success('保存成功'); this.dialogVisible = false; this.loadPage(); }
      finally { this.saving = false; }
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
  min-width: 1240px;
}
</style>
