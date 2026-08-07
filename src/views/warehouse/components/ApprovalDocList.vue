<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="单号">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" clearable placeholder="全部" filterable style="width:180px">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="审批状态">
        <el-select v-model="query.approvalStatus" clearable placeholder="全部" style="width:130px">
          <el-option label="草稿" :value="0" />
          <el-option label="审批中" :value="1" />
          <el-option label="通过" :value="2" />
          <el-option label="拒绝" :value="3" />
          <el-option label="作废" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新建{{ title }}</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="单号" width="180" />
      <slot name="extra-columns" :warehouse-text="warehouseText" />
      <el-table-column label="审批状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.approvalStatus)" size="mini">{{ statusText(row.approvalStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyUserName" label="申请人" width="120" />
      <el-table-column prop="applyUserPhone" label="联系方式" width="130" />
      <el-table-column prop="approvalInstanceId" label="审批实例ID" width="110" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="row.approvalStatus === 0" type="text" @click="onSubmit(row)">提交审批</el-button>
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
      :title="dialogMode === 'add' ? ('新建' + title) : (title + '详情 ' + (form.code || ''))"
      :visible.sync="dialogVisible"
      width="960px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" :disabled="dialogMode === 'view'">
        <slot name="form-fields" :form="form" :warehouse-list="warehouseList" />
        <el-form-item label="申请人">
          <el-input v-model="form.applyUserName" placeholder="点击选择申请人" readonly>
            <el-button slot="append" icon="el-icon-user" @click="pickApplyUser">选择</el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.applyUserPhone" placeholder="选择申请人后自动带出，可手动修改" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider content-position="left">明细</el-divider>
        <el-button v-if="dialogMode === 'add'" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <el-table :data="form.items" border style="margin-top:8px" size="mini">
          <el-table-column type="index" width="40" />
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
          <el-table-column label="商品ID" width="110">
            <template slot-scope="{row}"><el-input v-model="row.productId" size="mini" readonly /></template>
          </el-table-column>
          <el-table-column :label="qtyLabel" width="130">
            <template slot-scope="{row}">
              <el-input-number v-model="row[qtyField]" :min="0" size="mini" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column v-if="dialogMode === 'add'" label="操作" width="60">
            <template slot-scope="{$index}">
              <el-button type="text" class="danger-text" @click="form.items.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
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
import warehouseFormMixin from './warehouseFormMixin';

export default {
  name: 'ApprovalDocList',
  mixins: [warehouseFormMixin],
  props: {
    title: { type: String, required: true },
    api: { type: Object, required: true },
    qtyField: { type: String, required: true },
    qtyLabel: { type: String, default: '数量' },
    emptyForm: { type: Function, required: true },
    rules: { type: Object, default: () => ({}) },
    emptyItem: { type: Function, required: true },
  },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, code: '', warehouseId: null, approvalStatus: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
    };
  },
  created() { this.loadPage(); },
  methods: {
    statusText(s) { return ({ 0: '草稿', 1: '审批中', 2: '通过', 3: '拒绝', 4: '作废' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: 'info' })[s] || ''; },
    async loadPage() {
      this.loading = true;
      try {
        const res = await this.api.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, approvalStatus: null }; this.loadPage(); },
    openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) {
      const res = await this.api.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() {
      const base = this.emptyItem();
      // attrValueId/sku 必须预先声明：Vue 2 里给未声明的属性赋值不会触发视图更新
      this.form.items.push({ merId: null, attrValueId: null, sku: '', barCode: '', _options: [], _loading: false, ...base });
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
        await this.api.add(payload);
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onSubmit(row) {
      await this.$confirm(`提交审批后将进入 Flowable 审批流。继续?`, '确认', { type: 'warning' });
      await this.api.submit(row.id);
      this.$message.success('已提交审批');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.sku-missing { color: #f56c6c; font-size: 12px; }
</style>
