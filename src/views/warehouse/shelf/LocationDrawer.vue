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
        <el-table-column label="温区" width="80">
          <template slot-scope="{row}">{{ tempMap[row.tempZone] || '常温' }}</template>
        </el-table-column>
        <el-table-column label="用途" width="95">
          <template slot-scope="{row}">
            <el-tag :type="usageTagType(row.usageType)" size="mini">{{ usageMap[row.usageType || 0] }}</el-tag>
          </template>
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
        <!-- 留空由后端按批量生成那套规则补齐，两边编码格式保持一致 -->
        <el-form-item label="编码">
          <el-input v-model="form.code" :placeholder="`留空自动生成：${autoCode}`" />
          <p v-if="!form.code" class="usage-tip">
            将生成 <b>{{ autoCode }}</b>
            <span v-if="autoCodeTaken">（该编码已被占用，保存时自动顺延为 {{ autoCode }}-2 这类后缀）</span>
          </p>
        </el-form-item>
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
        <el-form-item label="用途">
          <el-select v-model="form.usageType" style="width:100%">
            <el-option label="可售区" :value="0" />
            <el-option label="待检区" :value="1" />
            <el-option label="隔离/不合格区" :value="2" />
          </el-select>
          <p class="usage-tip">
            只有<b>可售区</b>的库存会同步成商城可售库存。待检区、隔离区的货在仓里但不可卖。
          </p>
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
          <el-col :span="8"><el-form-item label="层" label-width="40px"><el-input-number v-model="batchForm.layerNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="行" label-width="40px"><el-input-number v-model="batchForm.rowNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="列" label-width="40px"><el-input-number v-model="batchForm.colNum" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="单库位容量"><el-input-number v-model="batchForm.capacity" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="温区">
          <el-select v-model="batchForm.tempZone" style="width:100%">
            <el-option label="常温" :value="0" /><el-option label="冷藏" :value="1" /><el-option label="冷冻" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="库位用途">
          <el-select v-model="batchForm.usageType" style="width:100%">
            <el-option label="可售区" :value="0" />
            <el-option label="待检区" :value="1" />
            <el-option label="隔离/不合格区" :value="2" />
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
      batchForm: { rowNum: 1, colNum: 4, layerNum: 3, capacity: 100, tempZone: 0, usageType: 0, clearExisting: false },
      tempMap: { 0: '常温', 1: '冷藏', 2: '冷冻' },
      usageMap: { 0: '可售区', 1: '待检区', 2: '隔离区' },
    };
  },
  computed: {
    /** 编码留空时后端会生成的编码，先在界面上摆出来，省得存完才知道叫什么 */
    autoCode() {
      if (!this.shelf) return '';
      const pad = (v) => String(Math.max(1, Number(v) || 1)).padStart(2, '0');
      return `${this.shelf.code}-${Math.max(1, Number(this.form.layerNo) || 1)}-${pad(this.form.rowNo)}-${pad(this.form.colNo)}`;
    },
    autoCodeTaken() {
      return this.list.some((l) => l.code === this.autoCode && l.id !== this.form.id);
    },
  },
  methods: {
    emptyForm() { return { id: null, warehouseId: null, shelfId: null, code: '', rowNo: 1, colNo: 1, layerNo: 1, capacity: 100, tempZone: 0, usageType: 0, status: 1 }; },
    /**
     * 新增时默认落到该货架第一个没被占用的层/行/列。
     *
     * 默认永远是 1-01-01 的话，货架上但凡建过一个库位，第一次保存必然撞车，
     * 然后就得自己一格一格试哪儿是空的——「自动生成」等于白给。
     */
    nextFreeSlot() {
      const used = new Set(this.list.map((l) => `${l.layerNo}-${l.rowNo}-${l.colNo}`));
      const maxLayer = Math.max(1, ...this.list.map((l) => Number(l.layerNo) || 1));
      const maxRow = Math.max(1, ...this.list.map((l) => Number(l.rowNo) || 1));
      const maxCol = Math.max(1, ...this.list.map((l) => Number(l.colNo) || 1));
      for (let layer = 1; layer <= maxLayer; layer++) {
        for (let row = 1; row <= maxRow; row++) {
          for (let col = 1; col <= maxCol; col++) {
            if (!used.has(`${layer}-${row}-${col}`)) return { layerNo: layer, rowNo: row, colNo: col };
          }
        }
      }
      // 货架排满了就往上加一层，不要退回 1-1-1 去撞已有库位
      return { layerNo: maxLayer + 1, rowNo: 1, colNo: 1 };
    },
    usageTagType(u) { return ({ 0: 'success', 1: 'warning', 2: 'danger' })[u || 0]; },
    open(shelf) { this.shelf = shelf; this.visible = true; this.load(); },
    async load() {
      if (!this.shelf) return;
      this.loading = true;
      try { this.list = await locationApi.list(this.shelf.id) || []; } finally { this.loading = false; }
    },
    openEdit(row) {
      this.form = row
        ? { ...row }
        : { ...this.emptyForm(), ...this.nextFreeSlot(), warehouseId: this.shelf.warehouseId, shelfId: this.shelf.id };
      this.editVisible = true;
    },
    async onSubmit() {
      this.form.id ? await locationApi.edit(this.form) : await locationApi.add(this.form);
      this.$message.success('保存成功');
      this.editVisible = false;
      this.load();
      // 后端保存库位时会把货架容量重算一遍（syncShelfCapacity），
      // 这里不通知外层，货架列表的容量就一直停在改之前的值，看着像没生效
      this.$emit('refresh');
    },
    onDelete(row) {
      this.$confirm(`删除库位「${row.code}」?`, '提示', { type: 'warning' })
        .then(async () => {
          await locationApi.del(row.id);
          this.$message.success('已删除');
          this.load();
          // 删库位同样会重算货架容量，外层列表要跟着刷新
          this.$emit('refresh');
        })
        .catch(() => {});
    },
    async onStatusChange(row) {
      await locationApi.updateStatus(row.id, row.status);
      this.$message.success('状态已更新');
    },
    async onBatchSubmit() {
      const n = Number(await locationApi.batchGenerate({ shelfId: this.shelf.id, ...this.batchForm })) || 0;
      // 编码已存在的会被后端跳过，一个都没新增时说清楚原因，
      // 否则运营看到「已生成 0 个库位」只会以为功能坏了
      if (n > 0) this.$message.success(`已生成 ${n} 个库位`);
      else this.$message.warning('没有新增库位：当前设置覆盖的层/行/列位置均已存在；如需重建，请勾选「清除已有库位」');
      this.batchVisible = false;
      this.load();
      this.$emit('refresh');
    },
  },
};
</script>

<style scoped>
.danger-text { color: #f56c6c; }
.usage-tip { margin: 4px 0 0; font-size: 12px; color: #909399; line-height: 1.5; }
</style>
