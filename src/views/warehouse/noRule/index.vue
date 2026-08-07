<template>
  <div class="app-container">
    <el-form :inline="true" size="small" class="filter-container">
      <el-form-item label="业务代码"><el-input v-model="query.bizType" clearable @keyup.enter.native="load" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-plus" @click="openEdit()">新增规则</el-button>
      </el-form-item>
    </el-form>

    <el-alert type="info" :closable="false" style="margin-bottom:12px">
      内置业务代码：IN 入库 · OUT 出库 · WV 波次 · PK 拣货 · RV 复核 · PU 上架 · RL 移库 · RP 补货 · QC 质检 · CK 盘点 · DL 发货 · DM 报损 · RC 领用 · TR 调拨 · RT 退库 · BATCH 批次号
    </el-alert>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="bizType" label="业务代码" width="120" />
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="prefix" label="前缀" width="100" />
      <el-table-column prop="datePattern" label="日期格式" width="110" />
      <el-table-column prop="seqDigits" label="序号位数" width="90" />
      <el-table-column label="策略" width="120">
        <template slot-scope="{row}">{{ ({0:'按日循环',1:'按月循环',2:'永续'})[row.seqStrategy] }}</template>
      </el-table-column>
      <el-table-column label="当前序号" width="110">
        <template slot-scope="{row}">{{ row.currentSeq }} <small style="color:#909399">({{ row.seqDate || '未使用' }})</small></template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template slot-scope="{row}">
          <el-tag :type="row.status===1?'success':'info'" size="mini">{{ row.status===1?'启用':'停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="试算预览" min-width="180">
        <template slot-scope="{row}">
          <el-button size="mini" @click="onPreview(row)">试算</el-button>
          <span v-if="previewCache[row.bizType]" style="margin-left:8px;color:#409eff">{{ previewCache[row.bizType] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openEdit(row)">编辑</el-button>
          <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="load"
    />

    <el-dialog :title="form.id?'编辑规则':'新增规则'" :visible.sync="editVisible" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="业务代码" prop="bizType"><el-input v-model="form.bizType" :disabled="!!form.id" placeholder="如 IN / OUT / WV" /></el-form-item>
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="前缀"><el-input v-model="form.prefix" placeholder="留空取业务代码" /></el-form-item>
        <el-form-item label="日期格式">
          <el-select v-model="form.datePattern" clearable style="width:100%" placeholder="不带日期">
            <el-option label="yyyyMMdd (20260806)" value="yyyyMMdd" />
            <el-option label="yyMMdd (260806)" value="yyMMdd" />
            <el-option label="yyyyMM (202608)" value="yyyyMM" />
            <el-option label="yyMM (2608)" value="yyMM" />
          </el-select>
        </el-form-item>
        <el-form-item label="序号位数"><el-input-number v-model="form.seqDigits" :min="1" :max="12" /></el-form-item>
        <el-form-item label="策略">
          <el-radio-group v-model="form.seqStrategy">
            <el-radio :label="0">按日循环</el-radio>
            <el-radio :label="1">按月循环</el-radio>
            <el-radio :label="2">永续</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="当前序号"><el-input-number v-model="form.currentSeq" :min="0" /></el-form-item>
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
import { noRuleApi } from '@/api/warehouse';

export default {
  name: 'WarehouseNoRule',
  data() {
    return {
      loading: false, total: 0, tableData: [],
      query: { page: 1, limit: 50, bizType: '' },
      editVisible: false, form: this.emptyForm(),
      previewCache: {},
      rules: {
        bizType: [{ required: true, message: '请输入业务代码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
      },
    };
  },
  created() { this.load(); },
  methods: {
    emptyForm() { return { id: null, bizType: '', name: '', prefix: '', datePattern: 'yyyyMMdd', seqDigits: 6, seqStrategy: 0, currentSeq: 0, status: 1, remark: '' }; },
    async load() {
      this.loading = true;
      try { const r = await noRuleApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
    openEdit(row) { this.form = row ? { ...row } : this.emptyForm(); this.editVisible = true; },
    async onSubmit() {
      await this.$refs.formRef.validate();
      this.form.id ? await noRuleApi.edit(this.form) : await noRuleApi.add(this.form);
      this.$message.success('已保存');
      this.editVisible = false;
      this.load();
    },
    onDelete(row) {
      this.$confirm(`删除规则「${row.bizType}」? 相关单据将回退到内置兜底编号`, '提示', { type: 'warning' })
        .then(async () => { await noRuleApi.del(row.id); this.$message.success('已删除'); this.load(); }).catch(() => {});
    },
    async onPreview(row) {
      const no = await noRuleApi.preview(row.bizType);
      this.$set(this.previewCache, row.bizType, no);
      this.$message.warning('试算会占用序号（+1），仅用于验证格式');
      this.load();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
</style>
