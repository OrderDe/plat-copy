<template>
  <el-drawer :title="`${shelf ? shelf.code + ' · ' : ''}库位明细`" :visible.sync="visible" size="780px" direction="rtl">
    <div style="padding:0 20px">
      <div style="margin-bottom:12px">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openEdit()">新增库位</el-button>
        <el-button type="success" size="small" icon="el-icon-s-grid" @click="batchVisible = true">批量生成</el-button>
        <el-button size="small" @click="load">刷新</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border size="small" max-height="600">
        <el-table-column prop="code" label="编码" width="160" />
        <el-table-column prop="layerNo" label="层" width="60" />
        <el-table-column prop="rowNo" label="行" width="60" />
        <el-table-column prop="colNo" label="列" width="60" />
        <el-table-column prop="capacity" label="容量" width="80" />
        <el-table-column label="温区" width="90">
          <template slot-scope="{row}">{{ tempMap[row.tempZone] || '常温' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template slot-scope="{row}">
            <el-select v-model="row.status" size="mini" @change="onStatusChange(row)">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
              <el-option label="锁定" :value="2" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template slot-scope="{row}">
            <el-button type="text" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 单个新增/编辑 -->
    <el-dialog :title="form.id ? '编辑库位' : '新增库位'" :visible.sync="editVisible" width="420px" append-to-body>
      <el-form :model="form" label-width="70px" size="small">
        <el-form-item label="编码"><el-input v-model="form.code" /></el-form-item>
        <el-row :gutter="8">
          <el-col :span="8"><el-form-item label="层" label-width="40px"><el-input-number v-model="form.layerNo" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="行" label-width="40px"><el-input-number v-model="form.rowNo" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="列" label-width="40px"><el-input-number v-model="form.colNo" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="容量"><el-input-number v-model="form.capacity" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="温区">
          <el-select v-model="form.tempZone" style="width:100%">
            <el-option label="常温" :value="0" /><el-option label="冷藏" :value="1" /><el-option label="冷冻" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>

    <!-- 批量生成库位 -->
    <el-dialog title="批量生成库位" :visible.sync="batchVisible" width="420px" append-to-body>
      <el-form :model="batchForm" label-width="120px" size="small">
        <el-row :gutter="8">
          <el-col :span="8"><el-form-item label="行" label-width="40px"><el-input-number v-model="batchForm.rowNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="列" label-width="40px"><el-input-number v-model="batchForm.colNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="层" label-width="40px"><el-input-number v-model="batchForm.layerNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="单库位容量"><el-input-number v-model="batchForm.capacity" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="温区">
          <el-select v-model="batchForm.tempZone" style="width:100%">
            <el-option label="常温" :value="0" /><el-option label="冷藏" :value="1" /><el-option label="冷冻" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="清除已有库位"><el-switch v-model="batchForm.clearExisting" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="batchVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="onBatchSubmit">生成</el-button>
      </div>
    </el-dialog>
  </el-drawer>
</template>

<script>
import { locationApi } from '@/api/warehouse';

export default {
  name: 'LocationDrawer',
  data() {
    return {
      visible: false, loading: false,
      shelf: null, list: [],
      editVisible: false, batchVisible: false,
      form: this.emptyForm(),
      batchForm: { rowNum: 1, colNum: 4, layerNum: 3, capacity: 100, tempZone: 0, clearExisting: false },
      tempMap: { 0: '常温', 1: '冷藏', 2: '冷冻' },
    };
  },
  methods: {
    emptyForm() { return { id: null, warehouseId: null, shelfId: null, code: '', rowNo: 1, colNo: 1, layerNo: 1, capacity: 100, tempZone: 0, status: 1 }; },
    open(shelf) { this.shelf = shelf; this.visible = true; this.load(); },
    async load() {
      if (!this.shelf) return;
      this.loading = true;
      try { this.list = await locationApi.list(this.shelf.id) || []; } finally { this.loading = false; }
    },
    openEdit(row) {
      this.form = row ? { ...row } : { ...this.emptyForm(), warehouseId: this.shelf.warehouseId, shelfId: this.shelf.id };
      this.editVisible = true;
    },
    async onSubmit() {
      this.form.id ? await locationApi.edit(this.form) : await locationApi.add(this.form);
      this.$message.success('保存成功');
      this.editVisible = false;
      this.load();
    },
    onDelete(row) {
      this.$confirm(`删除库位「${row.code}」?`, '提示', { type: 'warning' })
        .then(async () => { await locationApi.del(row.id); this.$message.success('已删除'); this.load(); })
        .catch(() => {});
    },
    async onStatusChange(row) {
      await locationApi.updateStatus(row.id, row.status);
      this.$message.success('状态已更新');
    },
    async onBatchSubmit() {
      const n = await locationApi.batchGenerate({ shelfId: this.shelf.id, ...this.batchForm });
      this.$message.success(`已生成 ${n} 个库位`);
      this.batchVisible = false;
      this.load();
      this.$emit('refresh');
    },
  },
};
</script>

<style scoped>
.danger-text { color: #f56c6c; }
</style>
