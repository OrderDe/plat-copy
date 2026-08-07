<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="入库单号">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" clearable placeholder="全部" filterable style="width:180px">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" clearable placeholder="全部" style="width:130px">
          <el-option label="采购入库" :value="0" />
          <el-option label="调拨入库" :value="1" />
          <el-option label="退货入库" :value="2" />
          <el-option label="其他" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option label="草稿" :value="0" />
          <el-option label="已生效" :value="1" />
          <el-option label="已作废" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新建入库单</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="入库单号" width="180" />
      <el-table-column label="仓库" width="180">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template slot-scope="{row}">{{ typeText(row.type) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="璐ㄦ" width="100">
        <template slot-scope="{row}">
          <el-tag :type="({0:'info',1:'warning',2:'success'})[row.inspectStatus || 0]" size="mini">
            {{ ({0:'未质检',1:'质检中',2:'已质检'})[row.inspectStatus || 0] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyUserName" label="申请人" width="120" />
      <el-table-column prop="applyUserPhone" label="联系方式" width="130" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button type="text" @click="onPrint(row)">打印</el-button>
          <el-button v-if="row.status === 0" type="text" @click="onSubmit(row)">提交生效</el-button>
          <el-button v-if="row.status === 1 && (row.inspectStatus || 0) === 0" type="text" style="color:#67c23a" @click="onCreateInspect(row)">生成璐ㄦ鍗</el-button>
          <el-button v-if="row.inspectCode" type="text" @click="goInspect(row)">查看质检</el-button>
          <el-button v-if="row.status === 0" type="text" class="danger-text" @click="onCancel(row)">作废</el-button>
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
      :title="dialogMode === 'add' ? '新建入库单' : '入库单详情' + (form.code || '')"
      :visible.sync="dialogVisible"
      width="960px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" :disabled="dialogMode === 'view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option label="采购入库" :value="0" />
                <el-option label="调拨入库" :value="1" />
                <el-option label="退货入库" :value="2" />
                <el-option label="其他" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人">
              <el-input v-model="form.applyUserName" placeholder="点击选择申请人" readonly>
                <el-button slot="append" icon="el-icon-user" @click="pickApplyUser">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式">
              <el-input v-model="form.applyUserPhone" placeholder="选择申请人后自动带出，可手动修改" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">入库明细</el-divider>
        <el-button v-if="dialogMode === 'add'" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <div class="dialog-table-scroller">
          <el-table :data="form.items" border size="mini">
            <el-table-column type="index" width="50" fixed="left" />
            <el-table-column label="店铺" width="180">
              <template slot-scope="{row}">
                <el-select v-model="row.merId" filterable size="mini" style="width:100%" placeholder="选择店铺" @change="onShopChange(row)">
                  <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="220">
              <template slot-scope="{row}">
                <el-input v-model="row.goodsName" size="mini" readonly placeholder="点击选择商品">
                  <el-button slot="append" size="mini" icon="el-icon-search" @click="pickProduct(row)" />
                </el-input>
              </template>
            </el-table-column>
            <el-table-column label="规格" min-width="150">
              <template slot-scope="{row}">
                <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
                <span v-else-if="row.productId" class="sku-missing">未选规格</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="条码" width="140">
              <template slot-scope="{row}">
                <span>{{ row.barCode || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="商品ID" width="130">
              <template slot-scope="{row}">
                <el-input v-model="row.productId" size="mini" readonly />
              </template>
            </el-table-column>
            <el-table-column label="应入库" width="110">
              <template slot-scope="{row}">
                <el-input-number v-model="row.inboundTotalNum" :min="0" size="mini" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="实入库" width="110">
              <template slot-scope="{row}">
                <el-input-number v-model="row.actualInboundNum" :min="0" size="mini" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="入库单价" width="130">
              <template slot-scope="{row}">
                <el-input-number v-model="row.unitCost" :min="0" :precision="4" :step="0.01" size="mini" controls-position="right" style="width:110px" />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="110">
              <template slot-scope="{row}">
                <span class="amount">{{ ((row.unitCost || 0) * (row.actualInboundNum || 0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="货架" width="150">
              <template slot-scope="{row}">
                <el-select v-model="row.shelfId" size="mini" filterable clearable style="width:100%" @change="onShelfChange(row)" :disabled="!form.warehouseId">
                  <el-option v-for="s in shelfCache" :key="s.id" :label="s.code" :value="s.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="库位" width="180">
              <template slot-scope="{row}">
                <el-select v-model="row.locationId" size="mini" filterable clearable style="width:100%" :disabled="!row.shelfId">
                  <el-option v-for="l in (locationCache[row.shelfId] || [])" :key="l.id" :label="l.code" :value="l.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="生产日期" width="150">
              <template slot-scope="{row}">
                <el-date-picker v-model="row.productionDate" type="date" value-format="yyyy-MM-dd" size="mini" style="width:100%" />
              </template>
            </el-table-column>
            <el-table-column label="有效期至" width="150">
              <template slot-scope="{row}">
                <el-date-picker v-model="row.expiryDate" type="date" value-format="yyyy-MM-dd" size="mini" style="width:100%" />
              </template>
            </el-table-column>
            <el-table-column label="供应商批次" width="150">
              <template slot-scope="{row}"><el-input v-model="row.supplierBatchNo" size="mini" /></template>
            </el-table-column>
            <el-table-column v-if="dialogMode === 'add'" label="操作" width="80" fixed="right">
              <template slot-scope="{$index}">
                <el-button type="text" class="danger-text" @click="form.items.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <div v-if="dialogMode === 'add'" slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSubmitForm">保存</el-button>
      </div>
    </el-dialog>

    <user-picker-dialog ref="userPicker" />
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { inboundApi, shelfApi, locationApi, inspectApi } from '@/api/warehouse';
import warehouseFormMixin from '@/views/warehouse/components/warehouseFormMixin';
import { doPrint } from '@/views/warehouse/components/printUtil';

export default {
  name: 'WarehouseInbound',
  mixins: [warehouseFormMixin],
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, code: '', warehouseId: null, type: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      shelfCache: [],
      locationCache: {},
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
      },
    };
  },
  created() { this.loadPage(); },
  watch: {
    'form.warehouseId'(v) { this.loadShelves(v); },
  },
  methods: {
    emptyForm() { return { warehouseId: null, type: 0, applyUserId: null, applyUserName: '', applyUserPhone: '', remark: '', items: [] }; },
    async loadShelves(warehouseId) {
      if (!warehouseId) { this.shelfCache = []; this.locationCache = {}; return; }
      try {
        const res = await shelfApi.page({ page: 1, limit: 999, warehouseId, status: 1 });
        this.shelfCache = (res && res.list) || [];
      } catch (e) { this.shelfCache = []; }
      this.locationCache = {};
    },
    async onShelfChange(row) {
      row.locationId = null;
      if (!row.shelfId) return;
      if (this.locationCache[row.shelfId]) return;
      try {
        const list = await locationApi.list(row.shelfId) || [];
        this.$set(this.locationCache, row.shelfId, list.filter(l => l.status === 1));
      } catch (e) {}
    },
    typeText(t) { return ({ 0: '采购入库', 1: '调拨入库', 2: '退货入库', 3: '其他' })[t] || '-'; },
    statusText(s) { return ({ 0: '草稿', 1: '已生效', 2: '已作废' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger' })[s] || ''; },
    async loadPage() {
      this.loading = true;
      try {
        const res = await inboundApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, type: null, status: null }; this.loadPage(); },
    openDialog() {
      this.form = this.emptyForm();
      this.dialogMode = 'add';
      this.dialogVisible = true;
    },
    async openDetail(id) {
      const res = await inboundApi.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() {
      this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, merId: null, goodsName: '', inboundTotalNum: 0, actualInboundNum: 0, unitCost: 0, productionDate: '', expiryDate: '', supplierBatchNo: '', shelfId: null, locationId: null, _options: [], _loading: false });
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      const bad = this.form.items.find(i => !i.productId);
      if (bad) return this.$message.warning('请为每行选择商品');
      // 仓储按 SKU 记账：没有 attrValueId 的行会落到「未指定规格」兜底行，
      // 导致该规格的可售库存回写不到 eb_product_attr_value，前台库存显示偏低
      const noSku = this.form.items.findIndex(i => !i.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格，请重新选择商品并指定规格`);
      // 店铺决定库存的商户归属，漏填会落成?mer_id=NULL 的「历史数据」，后续无法按商户对账      const noShop = this.form.items.findIndex(i => !i.merId);
      if (noShop >= 0) return this.$message.warning(`第 ${noShop + 1} 行未选择店铺，库存将无法归属商户`);
      this.saving = true;
      try {
        const payload = { ...this.form, items: this.stripItemMeta(this.form.items) };
        await inboundApi.add(payload);
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onPrint(row) {
      try { await doPrint('IN', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    async onCreateInspect(row) {
      await this.$confirm(`将根据入库单「{row.code}」的明细自动生成质检单（送检数?实入库数），继续?`, '确认', { type: 'warning' });
      const d = await inspectApi.createFromInbound(row.id, {});
      this.$message.success(`已生成质检单 ${d.code}，请到"质检管理"填写质检结果`);
      this.loadPage();
    },
    goInspect(row) {
      this.$router.push({ path: '/warehouse/inspect', query: { inboundId: row.id } });
    },
    async onSubmit(row) {
      await this.$confirm('提交后将增加库存、写流水、反写商品库，不可撤销。继续', '确认', { type: 'warning' });
      await inboundApi.submit(row.id);
      this.$message.success('已生效');
      this.loadPage();
    },
    async onCancel(row) {
      await this.$confirm(`作废入库单「{row.code}」`, '提示', { type: 'warning' });
      await inboundApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.amount { color: #e6a23c; }
.dialog-table-scroller {
  margin-top: 8px;
  max-height: 360px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.dialog-table-scroller >>> .el-table {
  min-width: 1990px;
}
.sku-missing { color: #f56c6c; font-size: 12px; }
</style>
