<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="盘点单号">
        <el-input v-model="query.checkNo" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" clearable placeholder="全部" filterable style="width:180px">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option label="草稿" :value="0" />
          <el-option label="已生效" :value="1" />
          <el-option label="已作废" :value="2" />
          <el-option label="待审批" :value="3" />
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

    <el-table v-loading="loading" :data="tableData" border stripe size="small">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="checkNo" label="盘点单号" min-width="190" show-overflow-tooltip />
      <el-table-column label="仓库" min-width="190" show-overflow-tooltip>
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column prop="checkPeople" label="盘点人" min-width="140" show-overflow-tooltip />
      <el-table-column prop="totalDiff" label="差异累计" min-width="110" />
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="盘点时间" min-width="170">
        <template slot-scope="{row}">{{ row.checkTime ? row.checkTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="170">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="row.status === 0" type="text" @click="onSubmit(row)">提交生效</el-button>
          <el-button v-if="row.status === 3" type="text" @click="onApprove(row)">瀹℃壒通过</el-button>
          <el-button v-if="row.status === 0 || row.status === 3" type="text" class="danger-text" @click="onCancel(row)">作废</el-button>
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
      :title="dialogMode === 'add' ? '新建盘点单' : '盘点单详情' + (form.checkNo || '')"
      :visible.sync="dialogVisible"
      width="960px"
      top="6vh"
      custom-class="warehouse-check-dialog"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" class="check-form" label-width="88px" size="small" :disabled="dialogMode === 'view'">
        <div class="check-form-card">
          <el-row :gutter="24" class="check-form-row">
          <el-col :span="12">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%" @change="onWarehouseChange">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="盘点人">
              <el-input v-model="form.checkPeople" placeholder="点击选择盘点人" readonly>
                <el-button slot="append" icon="el-icon-user" @click="pickCheckUser">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          </el-row>
          <el-row :gutter="24" class="check-form-row">
          <el-col :span="12">
            <el-form-item label="盘点模式">
              <el-select v-model="form.checkMode" style="width:100%">
                <el-option label="明盘 (显示账面数)" :value="0" />
                <el-option label="盲盘 (不显示账面数)" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="锁定货架">
              <el-select
                v-model="lockedShelfIdList"
                multiple
                collapse-tags
                filterable
                clearable
                :disabled="!form.warehouseId || dialogMode === 'view'"
                :placeholder="form.warehouseId ? '请选择该仓库的货架' : '请先选择仓库'"
                style="width:100%"
              >
                <el-option v-for="s in shelfList" :key="s.id" :label="shelfLabel(s)" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          </el-row>
          <el-row class="check-form-row check-form-row--last">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          </el-row>
        </div>

        <div class="check-section-title"><span>盘点明细</span></div>
        <div class="check-detail-toolbar">
          <el-button v-if="dialogMode === 'add'" type="primary" plain size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
          <span class="check-detail-tip">请选择店铺和商品，并填写账面库存与实盘库存</span>
        </div>
        <div class="dialog-table-scroller">
          <el-table :data="form.details" border size="mini" max-height="360">
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
            <el-table-column label="账面库存" width="130">
              <template slot-scope="{row}">
                <el-input-number v-model="row.bookStock" :min="0" size="mini" controls-position="right" @change="updateDiff(row)" />
              </template>
            </el-table-column>
            <el-table-column label="实盘库存" width="130">
              <template slot-scope="{row}">
                <el-input-number v-model="row.actualStock" :min="0" size="mini" controls-position="right" @change="updateDiff(row)" />
              </template>
            </el-table-column>
            <el-table-column label="差异" width="100">
              <template slot-scope="{row}">
                <span :class="{'diff-plus': row.diffNum > 0, 'diff-minus': row.diffNum < 0}">{{ row.diffNum }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="dialogMode === 'add'" label="操作" width="80" fixed="right">
              <template slot-scope="{$index}">
                <el-button type="text" class="danger-text" @click="form.details.splice($index, 1)">删除</el-button>
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

    <admin-picker-dialog ref="adminPicker" title="选择盘点人" />
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { stockCheckApi, shelfApi } from '@/api/warehouse';
import warehouseFormMixin from '@/views/warehouse/components/warehouseFormMixin';

export default {
  name: 'WarehouseStockCheck',
  mixins: [warehouseFormMixin],
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, checkNo: '', warehouseId: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      shelfList: [],
      lockedShelfIdList: [],
      form: this.emptyForm(),
      rules: { warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }] },
    };
  },
  created() { this.loadPage(); },
  methods: {
    emptyForm() { return { warehouseId: null, checkUserId: null, checkPeople: '', checkMode: 0, lockedShelfIds: '', remark: '', details: [] }; },
    shelfLabel(shelf) { return shelf.name ? `${shelf.code} / ${shelf.name}` : shelf.code; },
    async onWarehouseChange(warehouseId) {
      this.lockedShelfIdList = [];
      this.shelfList = [];
      if (!warehouseId) return;
      try {
        const res = await shelfApi.page({ page: 1, limit: 999, warehouseId, status: 1 });
        this.shelfList = (res && res.list) || [];
      } catch (e) { this.shelfList = []; }
    },
    async loadShelfOptions(warehouseId) {
      this.shelfList = [];
      if (!warehouseId) return;
      try {
        const res = await shelfApi.page({ page: 1, limit: 999, warehouseId, status: 1 });
        this.shelfList = (res && res.list) || [];
      } catch (e) { this.shelfList = []; }
    },
    statusText(s) { return ({ 0: '草稿', 1: '已生效', 2: '已作废', 3: '待审批' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' })[s] || ''; },
    async onApprove(row) {
      await this.$confirm(`审批通过盘点单曘€?{row.checkNo}」，将按差异执行库存校准。继续?`, '确认', { type: 'warning' });
      await stockCheckApi.approve(row.id);
      this.$message.success('审批通过，库存已校准'); this.loadPage();
    },
    async pickCheckUser() {
      const u = await this.$refs.adminPicker.open();
      if (!u) return;
      this.form.checkUserId = u.id;
      this.form.checkPeople = u.realName || u.account || '';
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await stockCheckApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, checkNo: '', warehouseId: null, status: null }; this.loadPage(); },
    openDialog() {
      this.form = this.emptyForm();
      this.shelfList = [];
      this.lockedShelfIdList = [];
      this.dialogMode = 'add';
      this.dialogVisible = true;
    },
    async openDetail(id) {
      const res = await stockCheckApi.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.details) this.form.details = [];
      this.lockedShelfIdList = (this.form.lockedShelfIds || '')
        .split(',')
        .filter(Boolean)
        .map((idValue) => Number(idValue));
      await this.loadShelfOptions(this.form.warehouseId);
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() {
      this.form.details.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, merId: null, goodsName: '', bookStock: 0, actualStock: 0, diffNum: 0, _options: [], _loading: false });
    },
    updateDiff(row) {
      row.diffNum = (row.actualStock || 0) - (row.bookStock || 0);
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.details.length) return this.$message.warning('请至少添加一行明细');
      if (this.form.details.find((i) => !i.productId)) return this.$message.warning('请为每行选择商品');
      // 仓储按 SKU 记账，缺 attrValueId 会盘到「未指定规格」的兜底行上
      const noSku = this.form.details.findIndex((i) => !i.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格，请重新选择商品并指定规格`);
      this.form.details.forEach(this.updateDiff);
      this.saving = true;
      try {
        const payload = {
          ...this.form,
          lockedShelfIds: this.lockedShelfIdList.join(','),
          diffApprovalThreshold: null,
          details: this.stripItemMeta(this.form.details),
        };
        await stockCheckApi.add(payload);
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
      await this.$confirm(`作废盘点单「{row.checkNo}」`, '提示', { type: 'warning' });
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
.sku-missing { color: #f56c6c; font-size: 12px; }
.diff-plus { color: #67c23a; }
.diff-minus { color: #f56c6c; }
.check-form-card {
  padding: 20px 22px 2px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.check-form-row { margin-bottom: 2px; }
.check-form-row--last { margin-bottom: 0; }
.check-form >>> .el-form-item { margin-bottom: 18px; }
.check-form >>> .el-form-item__label {
  color: #606266;
  font-weight: 500;
}
.check-form >>> .el-input,
.check-form >>> .el-select,
.check-form >>> .el-input-number { width: 100%; }
.check-section-title {
  display: flex;
  align-items: center;
  margin: 22px 0 14px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}
.check-section-title::before {
  width: 3px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
  background: #409eff;
  content: '';
}
.check-section-title::after {
  flex: 1;
  height: 1px;
  margin-left: 12px;
  background: #ebeef5;
  content: '';
}
.check-detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.check-detail-tip { color: #909399; font-size: 12px; }
.dialog-table-scroller {
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}
.dialog-table-scroller >>> .el-table { margin: -1px; width: calc(100% + 2px); }
.dialog-table-scroller >>> th.el-table__cell {
  background: #edf3ff;
  color: #4e5969;
  font-weight: 600;
}
</style>

<style>
.warehouse-check-dialog {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 40px);
  max-height: 88vh;
  margin-bottom: 0 !important;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 12px 36px rgba(31, 45, 61, 0.2);
}
.warehouse-check-dialog .el-dialog__header {
  flex: 0 0 auto;
  padding: 18px 24px 16px;
  border-bottom: 1px solid #ebeef5;
}
.warehouse-check-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px 24px 16px;
  overflow-y: auto;
}
.warehouse-check-dialog .el-dialog__footer {
  flex: 0 0 auto;
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}
</style>
