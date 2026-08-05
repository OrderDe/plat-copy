<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="盘点单号">
        <el-input v-model="query.checkNo" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库ID">
        <el-input v-model="query.warehouseId" placeholder="仓库ID" clearable style="width:120px" />
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
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新建盘点单</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="checkNo" label="盘点单号" width="180" />
      <el-table-column prop="warehouseId" label="仓库ID" width="80" />
      <el-table-column prop="checkPeople" label="盘点人" width="120" />
      <el-table-column prop="totalDiff" label="差异累计" width="100" />
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="checkTime" label="盘点时间" width="160" />
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="220" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="row.status === 0" type="text" @click="onSubmit(row)">提交生效</el-button>
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
      :title="dialogMode === 'add' ? '新建盘点单' : '盘点单详情 ' + (form.checkNo || '')"
      :visible.sync="dialogVisible"
      width="900px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" :disabled="dialogMode === 'view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="仓库ID" prop="warehouseId">
              <el-input v-model.number="form.warehouseId" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="盘点人">
              <el-input v-model="form.checkPeople" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">盘点明细</el-divider>
        <el-button v-if="dialogMode === 'add'" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <el-table :data="form.details" border style="margin-top:8px" size="mini">
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
          <el-table-column label="账面库存" width="120">
            <template slot-scope="{row}">
              <el-input-number v-model="row.bookStock" :min="0" size="mini" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="实盘库存" width="120">
            <template slot-scope="{row}">
              <el-input-number v-model="row.actualStock" :min="0" size="mini" controls-position="right" @change="updateDiff(row)" />
            </template>
          </el-table-column>
          <el-table-column label="差异" width="100">
            <template slot-scope="{row}">
              <span :class="{'diff-plus': row.diffNum > 0, 'diff-minus': row.diffNum < 0}">
                {{ row.diffNum }}
              </span>
            </template>
          </el-table-column>
          <el-table-column v-if="dialogMode === 'add'" label="操作" width="60">
            <template slot-scope="{$index}">
              <el-button type="text" class="danger-text" @click="form.details.splice($index, 1)">删除</el-button>
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
import { stockCheckApi } from '@/api/warehouse';

export default {
  name: 'WarehouseStockCheck',
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, checkNo: '', warehouseId: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      rules: { warehouseId: [{ required: true, message: '请输入仓库ID', trigger: 'blur' }] },
    };
  },
  created() { this.loadPage(); },
  methods: {
    emptyForm() { return { warehouseId: null, checkPeople: '', remark: '', details: [] }; },
    statusText(s) { return ({ 0: '草稿', 1: '已生效', 2: '已作废' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger' })[s] || ''; },
    async loadPage() {
      this.loading = true;
      try {
        const res = await stockCheckApi.page(this.query);
        this.tableData = res.data.list || [];
        this.total = res.data.total || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, checkNo: '', warehouseId: null, status: null }; this.loadPage(); },
    openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) {
      const res = await stockCheckApi.detail(id);
      this.form = res.data;
      if (!this.form.details) this.form.details = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() { this.form.details.push({ productId: null, platformType: 0, bookStock: 0, actualStock: 0, diffNum: 0 }); },
    updateDiff(row) {
      row.diffNum = (row.actualStock || 0) - (row.bookStock || 0);
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.details.length) return this.$message.warning('请至少添加一行明细');
      this.form.details.forEach(this.updateDiff);
      this.saving = true;
      try {
        await stockCheckApi.add(this.form);
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onSubmit(row) {
      await this.$confirm('提交后将按差异校准库存，写流水并反写商品库。继续?', '确认', { type: 'warning' });
      await stockCheckApi.submit(row.id);
      this.$message.success('已生效');
      this.loadPage();
    },
    async onCancel(row) {
      await this.$confirm(`作废盘点单「${row.checkNo}」?`, '提示', { type: 'warning' });
      await stockCheckApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.diff-plus { color: #67c23a; }
.diff-minus { color: #f56c6c; }
</style>
