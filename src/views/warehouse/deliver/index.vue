<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="发货单号">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="采购单号">
        <el-input v-model="query.purchaseCode" placeholder="请输入" clearable />
      </el-form-item>
      <el-form-item label="仓库ID">
        <el-input v-model="query.warehouseId" placeholder="仓库ID" clearable style="width:120px" />
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

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新建发货单</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="发货单号" width="180" />
      <el-table-column prop="purchaseCode" label="采购单号" width="160" />
      <el-table-column prop="supplierName" label="供应商" width="140" />
      <el-table-column prop="warehouseId" label="目标仓库" width="80" />
      <el-table-column label="快递" min-width="180">
        <template slot-scope="{row}">{{ row.expressCompany }} {{ row.expressNo }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
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
      :title="dialogMode === 'add' ? '新建发货单' : '发货单详情 ' + (form.code || '')"
      :visible.sync="dialogVisible"
      width="880px"
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
              <el-input v-model.number="form.warehouseId" type="number" />
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
          <el-table-column label="发货数量" width="120">
            <template slot-scope="{row}">
              <el-input-number v-model="row.deliverNum" :min="0" size="mini" controls-position="right" />
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

    <!-- 标记发货 -->
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
        <el-button type="primary" size="small" @click="onDeliverSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { deliverApi } from '@/api/warehouse';

export default {
  name: 'WarehouseDeliver',
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, code: '', purchaseCode: '', warehouseId: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      rules: { warehouseId: [{ required: true, message: '请输入目标仓库', trigger: 'blur' }] },
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
        this.tableData = res.data.list || [];
        this.total = res.data.total || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', purchaseCode: '', warehouseId: null, status: null }; this.loadPage(); },
    openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) {
      const res = await deliverApi.detail(id);
      this.form = res.data;
      if (!this.form.items) this.form.items = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() { this.form.items.push({ productId: null, platformType: 0, goodsName: '', deliverNum: 0 }); },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      this.saving = true;
      try {
        await deliverApi.add(this.form);
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
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
      this.$message.success(`已生成入库单 ID=${res.data}, 请到入库管理页提交生效`);
      this.loadPage();
    },
    async onCancel(row) {
      await this.$confirm(`取消发货单「${row.code}」?`, '提示', { type: 'warning' });
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
</style>
