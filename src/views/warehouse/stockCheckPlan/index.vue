<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="名称"><el-input v-model="query.name" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:110px">
          <el-option label="启用" :value="1" /><el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openEdit()">新增计划</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="计划名称" min-width="160" />
      <el-table-column label="仓库" width="200"><template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template></el-table-column>
      <el-table-column label="频率" width="90"><template slot-scope="{row}">{{ freqMap[row.frequency] }}</template></el-table-column>
      <el-table-column label="模式" width="90"><template slot-scope="{row}">{{ row.checkMode === 1 ? '盲盘' : '明盘' }}</template></el-table-column>
      <el-table-column prop="diffApprovalThreshold" label="审批阈值%" width="100" />
      <el-table-column prop="nextRunDate" label="下次执行" width="130" />
      <el-table-column prop="lastRunDate" label="上次执行" width="130" />
      <el-table-column label="状态" width="80">
        <template slot-scope="{row}"><el-tag :type="row.status===1?'success':'info'" size="mini">{{ row.status===1?'启用':'停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openEdit(row)">编辑</el-button>
          <el-button type="text" @click="onRunOnce(row)">立即执行</el-button>
          <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="loadPage"
    />

    <el-dialog :title="form.id?'编辑计划':'新增计划'" :visible.sync="editVisible" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="计划名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <el-select v-model="form.warehouseId" filterable style="width:100%" @change="loadShelves">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点货架">
          <el-select v-model="shelfSel" multiple filterable style="width:100%" placeholder="留空 = 全仓">
            <el-option v-for="s in shelfList" :key="s.id" :label="s.code" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="频率">
          <el-radio-group v-model="form.frequency">
            <el-radio :label="0">每日</el-radio>
            <el-radio :label="1">每周</el-radio>
            <el-radio :label="2">每月</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="盘点模式">
          <el-radio-group v-model="form.checkMode">
            <el-radio :label="0">明盘</el-radio>
            <el-radio :label="1">盲盘</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="差异审批阈值">
          <el-input-number v-model="form.diffApprovalThreshold" :min="0" :max="100" /> <span style="color:#909399;font-size:12px">% (差异比例 > 阈值 时需审批)</span>
        </el-form-item>
        <el-form-item label="下次执行"><el-date-picker v-model="form.nextRunDate" value-format="yyyy-MM-dd" style="width:100%" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio><el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { stockCheckPlanApi, warehouseApi, shelfApi } from '@/api/warehouse';

export default {
  name: 'WarehouseStockCheckPlan',
  data() {
    return {
      loading: false, total: 0, tableData: [], warehouseList: [], shelfList: [],
      query: { page: 1, limit: 20, name: '', warehouseId: null, status: null },
      editVisible: false, form: this.emptyForm(), shelfSel: [],
      freqMap: { 0: '每日', 1: '每周', 2: '每月' },
      rules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
      },
    };
  },
  created() { this.loadWarehouses(); this.loadPage(); },
  methods: {
    emptyForm() { return { id: null, name: '', warehouseId: null, scopeType: 0, shelfIds: '', frequency: 1, checkMode: 0, diffApprovalThreshold: 5, status: 1, nextRunDate: null, remark: '' }; },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadShelves() {
      this.shelfList = [];
      if (!this.form.warehouseId) return;
      try { const r = await shelfApi.page({ page: 1, limit: 999, warehouseId: this.form.warehouseId }); this.shelfList = (r && r.list) || []; } catch (e) {}
    },
    async loadPage() { this.loading = true; try { const r = await stockCheckPlanApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; } finally { this.loading = false; } },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, name: '', warehouseId: null, status: null }; this.loadPage(); },
    async openEdit(row) {
      this.form = row ? { ...row } : this.emptyForm();
      this.shelfSel = row && row.shelfIds ? row.shelfIds.split(',').map(Number) : [];
      await this.loadShelves();
      this.editVisible = true;
    },
    async onSubmit() {
      await this.$refs.formRef.validate();
      this.form.shelfIds = this.shelfSel.join(',');
      this.form.id ? await stockCheckPlanApi.edit(this.form) : await stockCheckPlanApi.add(this.form);
      this.$message.success('已保存');
      this.editVisible = false;
      this.loadPage();
    },
    async onRunOnce(row) {
      await this.$confirm(`立即根据当前库存快照生成一张盘点单?`, '确认', { type: 'warning' });
      const id = await stockCheckPlanApi.runOnce(row.id);
      this.$message.success(`已生成盘点单 ID=${id}`);
      this.loadPage();
    },
    onDelete(row) {
      this.$confirm(`删除计划「${row.name}」?`, '提示', { type: 'warning' })
        .then(async () => { await stockCheckPlanApi.del(row.id); this.$message.success('已删除'); this.loadPage(); }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
</style>
