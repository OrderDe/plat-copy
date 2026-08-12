<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="发货单号">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="采购单号">
        <el-input v-model="query.purchaseCode" placeholder="请输入" clearable />
      </el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" clearable placeholder="全部" filterable style="width:180px">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option label="待发货" :value="0" />
          <el-option label="已发货" :value="1" />
          <el-option label="已入库" :value="2" />
          <el-option label="已取消" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px">
      <template slot="title">
        采购发货单：供应商针对采购单实际发货的记录单据（一张采购单可分批发多次货）。
      </template>
      <div style="line-height:22px">
        用于登记本次发出的商品与数量、目标仓库、快递公司及运单号，跟踪货物在途情况；
        货到后由发货单直接生成入库单，进入收货质检与上架流程，从而实现"采购 → 发货 → 在途 → 入库"全链路可追溯。
        <br>
        状态流转：待发货（已创建、尚未交运）→ 已发货（在途）→ 已入库（收货完成）；未入库前可取消。
      </div>
    </el-alert>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新建发货单</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="发货单号" width="180" />
      <el-table-column prop="purchaseCode" label="采购单号" width="160" />
      <el-table-column prop="supplierName" label="供应商" width="140" />
      <el-table-column label="目标仓库" width="180">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="快递" min-width="180">
        <template slot-scope="{row}">{{ row.expressCompany }} {{ row.expressNo }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button type="text" @click="onPrintLabel(row)">打印面单</el-button>
          <el-button v-if="row.status === 0" type="text" @click="openDeliverDialog(row)">标记发货</el-button>
          <el-button v-if="row.status === 1" type="text" @click="onGenInbound(row)">生成入库单</el-button>
          <el-button v-if="row.status !== 2 && row.status !== 3" type="text" class="danger-text" @click="onCancel(row)">取消</el-button>
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
      :title="dialogMode === 'add' ? '新建发货单' : '发货单详情' + (form.code || '')"
      :visible.sync="dialogVisible"
      width="960px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" :disabled="dialogMode === 'view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="采购单号">
              <el-input v-model="form.purchaseCode" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="form.supplierName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable placeholder="请选择目标仓库" style="width:100%">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="快递公司">
              <el-input v-model="form.expressCompany" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">发货明细</el-divider>
        <el-button v-if="dialogMode === 'add'" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <div class="deliver-items-scroller">
          <el-table :data="form.items" border size="mini" max-height="360">
            <el-table-column type="index" width="50" fixed="left" />
            <el-table-column label="店铺" width="180" fixed="left">
              <template slot-scope="{row}">
                <el-select v-model="row.merId" filterable size="mini" style="width:100%" placeholder="选择店铺" @change="onShopChange(row)">
                  <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="220" fixed="left">
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
            <el-table-column label="商品ID" width="130">
              <template slot-scope="{row}"><el-input v-model="row.productId" size="mini" readonly /></template>
            </el-table-column>
            <el-table-column label="发货数量" width="140">
              <template slot-scope="{row}">
                <el-input-number v-model="row.deliverNum" :min="0" size="mini" controls-position="right" />
              </template>
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

    <admin-picker-dialog ref="adminPicker" title="选择申请人" />
    <product-picker-dialog ref="productPicker" />

    <el-dialog title="标记发货" :visible.sync="deliverVisible" width="440px">
      <el-form label-width="100px" size="small">
        <el-form-item label="快递公司">
          <el-input v-model="deliverForm.expressCompany" />
        </el-form-item>
        <el-form-item label="快递单号">
          <el-input v-model="deliverForm.expressNo" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="deliverVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="onDeliverSubmit">确认畾</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { deliverApi } from '@/api/warehouse';
import warehouseFormMixin from '@/views/warehouse/components/warehouseFormMixin';
import { doPrint } from '@/views/warehouse/components/printUtil';

export default {
  name: 'WarehouseDeliver',
  mixins: [warehouseFormMixin],
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, code: '', purchaseCode: '', warehouseId: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      rules: { warehouseId: [{ required: true, message: '请选择目标仓库', trigger: 'change' }] },
      deliverVisible: false, deliverForm: { id: null, expressCompany: '', expressNo: '' },
    };
  },
  created() { this.loadPage(); },
  methods: {
    emptyForm() { return { purchaseCode: '', supplierName: '', warehouseId: null, expressCompany: '', remark: '', items: [] }; },
    statusText(s) { return ({ 0: '待发货', 1: '已发货', 2: '已入库', 3: '已取消' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' })[s] || ''; },
    async loadPage() {
      this.loading = true;
      try {
        const res = await deliverApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', purchaseCode: '', warehouseId: null, status: null }; this.loadPage(); },
    openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) {
      const res = await deliverApi.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() {
      this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, merId: null, goodsName: '', deliverNum: 0, _options: [], _loading: false });
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      if (this.form.items.find((i) => !i.productId)) return this.$message.warning('请为每行选择商品');
      // 仓储按 SKU 记账，缺 attrValueId 会作用到「未指定规格」的兜底行上
      const noSku = this.form.items.findIndex((i) => !i.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格，请重新选择商品并指定规格`);
      this.saving = true;
      try {
        const payload = { ...this.form, items: this.stripItemMeta(this.form.items) };
        await deliverApi.add(payload);
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onPrintLabel(row) {
      try { await doPrint('DL', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    openDeliverDialog(row) {
      this.deliverForm = { id: row.id, expressCompany: row.expressCompany || '', expressNo: row.expressNo || '' };
      this.deliverVisible = true;
    },
    async onDeliverSubmit() {
      await deliverApi.deliver(this.deliverForm.id, {
        expressCompany: this.deliverForm.expressCompany,
        expressNo: this.deliverForm.expressNo,
      });
      this.$message.success('已标记发货');
      this.deliverVisible = false;
      this.loadPage();
    },
    async onGenInbound(row) {
      await this.$confirm('将根据发货单自动生成入库单 (草稿)。继续?', '确认', { type: 'warning' });
      const res = await deliverApi.generateInbound(row.id);
      this.$message.success(`已生成入库单 ID=${res}, 请到入库管理页提交生效`);
      this.loadPage();
    },
    async onCancel(row) {
      await this.$confirm(`取消发货单「{row.code}」`, '提示', { type: 'warning' });
      await deliverApi.cancel(row.id);
      this.$message.success('已取消');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.sku-missing { color: #f56c6c; font-size: 12px; }
.deliver-items-scroller {
  margin-top: 8px;
}
</style>
