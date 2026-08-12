<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="编码">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" clearable placeholder="全部" style="width:140px">
          <el-option v-for="(v,k) in typeMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:110px">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
        <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openEdit()">新增货架</el-button>
      <el-button type="success" icon="el-icon-s-grid" size="small" @click="batchDialog = true">批量生成</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="编码" width="130" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column label="所属仓库" width="200">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="110">
        <template slot-scope="{row}"><el-tag size="mini">{{ typeMap[row.type] || '-' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="规格" width="130">
        <template slot-scope="{row}">{{ row.rowNum }}×{{ row.colNum }}×{{ row.layerNum }}</template>
      </el-table-column>
      <el-table-column prop="capacity" label="容量" width="100" />
      <el-table-column label="状态" width="80">
        <template slot-scope="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="mini">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openLocation(row)">库位明细</el-button>
          <el-button type="text" @click="openEdit(row)">编辑</el-button>
          <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadPage"
      @current-change="loadPage"
    />

    <!-- 新增/编辑 -->
    <el-dialog :title="form.id ? '编辑货架' : '新增货架'" :visible.sync="editVisible" width="560px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="仓库" prop="warehouseId">
          <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="货架编码" prop="code"><el-input v-model="form.code" placeholder="濡?A-01" /></el-form-item>
        <el-form-item label="货架名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="(v,k) in typeMap" :key="k" :label="v" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="8"><el-form-item label="行" label-width="40px"><el-input-number v-model="form.rowNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="列" label-width="40px"><el-input-number v-model="form.colNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="层" label-width="40px"><el-input-number v-model="form.layerNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="容量"><el-input-number v-model="form.capacity" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio><el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>

    <!-- 批量生成 -->
    <el-dialog title="批量生成货架 + 库位" :visible.sync="batchDialog" width="560px">
      <el-form :model="batchForm" label-width="120px" size="small">
        <el-form-item label="仓库">
          <el-select v-model="batchForm.warehouseId" filterable style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="货架编码前缀"><el-input v-model="batchForm.prefix" placeholder="A" /></el-form-item>
        <el-row :gutter="8">
          <el-col :span="12"><el-form-item label="起始编号"><el-input-number v-model="batchForm.startNo" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生成数量"><el-input-number v-model="batchForm.shelfCount" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="货架类型">
          <el-select v-model="batchForm.type" style="width:100%">
            <el-option v-for="(v,k) in typeMap" :key="k" :label="v" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="8"><el-form-item label="行"><el-input-number v-model="batchForm.rowNum" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="列"><el-input-number v-model="batchForm.colNum" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="层"><el-input-number v-model="batchForm.layerNum" :min="1" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="单库位容量"><el-input-number v-model="batchForm.locationCapacity" :min="0" style="width:100%" /></el-form-item>
        <div class="hint">将创建 {{ batchForm.shelfCount }} 个货架，共{{ batchTotal }} 个库位</div>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="batchDialog = false">取消</el-button>
        <el-button type="primary" size="small" :loading="batchLoading" @click="onBatchGenerate">生成</el-button>
      </div>
    </el-dialog>

    <!-- 库位明细 -->
    <location-drawer ref="locationDrawer" @refresh="loadPage" />
  </div>
</template>

<script>
import { shelfApi, warehouseApi } from '@/api/warehouse';
import LocationDrawer from './LocationDrawer.vue';

export default {
  name: 'WarehouseShelf',
  components: { LocationDrawer },
  data() {
    return {
      loading: false, saving: false, batchLoading: false,
      total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, warehouseId: null, code: '', type: null, status: null },
      editVisible: false, batchDialog: false,
      form: this.emptyForm(),
      batchForm: { warehouseId: null, prefix: 'A', startNo: 1, shelfCount: 5, type: 0, rowNum: 1, colNum: 4, layerNum: 3, locationCapacity: 100 },
      typeMap: { 0: '普通货架', 1: '托盘位', 2: '零散区', 3: '退货区', 4: '不合格区', 5: '冷藏区', 6: '冷冻区' },
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
      },
    };
  },
  computed: {
    batchTotal() { return (this.batchForm.shelfCount || 0) * (this.batchForm.rowNum || 0) * (this.batchForm.colNum || 0) * (this.batchForm.layerNum || 0); },
  },
  created() { this.loadWarehouses(); this.loadPage(); },
  methods: {
    emptyForm() { return { id: null, warehouseId: null, code: '', name: '', type: 0, rowNum: 1, colNum: 4, layerNum: 3, capacity: 0, status: 1, remark: '' }; },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    async loadWarehouses() {
      try { const res = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (res && res.list) || []; } catch (e) {}
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await shelfApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, warehouseId: null, code: '', type: null, status: null }; this.loadPage(); },
    openEdit(row) {
      this.form = row ? { ...row } : this.emptyForm();
      this.editVisible = true;
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmit() {
      await this.$refs.formRef.validate();
      this.saving = true;
      try {
        this.form.id ? await shelfApi.edit(this.form) : await shelfApi.add(this.form);
        this.$message.success('保存成功');
        this.editVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    onDelete(row) {
      this.$confirm(`删除货架「${row.code}」? 该货架下所有库位将无法定位。`, '提示', { type: 'warning' })
        .then(async () => { await shelfApi.del(row.id); this.$message.success('已删除'); this.loadPage(); })
        .catch(() => {});
    },
    async onBatchGenerate() {
      if (!this.batchForm.warehouseId) return this.$message.warning('请选择仓库');
      this.batchLoading = true;
      try {
        const n = await shelfApi.batchGenerate(this.batchForm);
        this.$message.success(`已生成 ${this.batchForm.shelfCount} 个货架、{n} 个库位`);
        this.batchDialog = false;
        this.loadPage();
      } finally { this.batchLoading = false; }
    },
    openLocation(row) { this.$refs.locationDrawer.open(row); },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.hint { color: #909399; font-size: 12px; padding-left: 120px; }
</style>
