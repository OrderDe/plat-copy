<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="单号">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库ID">
        <el-input v-model="query.warehouseId" placeholder="仓库ID" clearable style="width:120px" />
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
      <slot name="extra-columns" />
      <el-table-column label="审批状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.approvalStatus)" size="mini">{{ statusText(row.approvalStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyUserName" label="申请人" width="100" />
      <el-table-column prop="approvalInstanceId" label="审批实例ID" width="110" />
      <el-table-column prop="createTime" label="创建时间" width="160" />
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
      width="880px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" :disabled="dialogMode === 'view'">
        <slot name="form-fields" :form="form" />
        <el-form-item label="申请人">
          <el-input v-model="form.applyUserName" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider content-position="left">明细</el-divider>
        <el-button v-if="dialogMode === 'add'" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <el-table :data="form.items" border style="margin-top:8px" size="mini">
          <el-table-column type="index" width="40" />
          <el-table-column label="商品ID" width="140">
            <template slot-scope="{row}">
              <el-input v-model.number="row.productId" type="number" size="mini" />
            </template>
          </el-table-column>
          <el-table-column label="平台" width="110">
            <template slot-scope="{row}">
              <el-select v-model="row.platformType" size="mini" style="width:100%">
                <el-option label="自研" :value="0" />
                <el-option label="怡亚通" :value="1" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="商品名称">
            <template slot-scope="{row}">
              <el-input v-model="row.goodsName" size="mini" />
            </template>
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
  </div>
</template>

<script>
export default {
  name: 'ApprovalDocList',
  props: {
    title: { type: String, required: true },
    api: { type: Object, required: true },
    qtyField: { type: String, required: true }, // 明细数量字段: damageNum / receiveNum / transferNum / returnNum
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
        this.tableData = res.data.list || [];
        this.total = res.data.total || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, approvalStatus: null }; this.loadPage(); },
    openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) {
      const res = await this.api.detail(id);
      this.form = res.data;
      if (!this.form.items) this.form.items = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() { this.form.items.push(this.emptyItem()); },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      this.saving = true;
      try {
        await this.api.add(this.form);
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
</style>
