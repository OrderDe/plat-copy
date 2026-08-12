<template>
  <div class="app-container">
    <div class="page-header">
      <div class="page-title">仓储字典</div>
      <div class="page-sub">
        维护单据类型等下拉选项。改完商户/操作员下次打开单据即生效，不用改代码发版。
      </div>
    </div>

    <el-alert type="info" :closable="false" class="mb10">
      <template slot="title">
        「值」是单据表里实际存的数字，历史单据靠它反查名称，
        <b>已在用的项只能改名称/排序，不要改值</b>；不想再被选择时改为「停用」，历史单据仍显示原名称。
      </template>
    </el-alert>

    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="字典类型">
        <el-select v-model="query.dictType" placeholder="全部" clearable style="width:180px" @change="onSearch">
          <el-option v-for="t in dictTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="名称 / 备注" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width:110px" @change="onSearch">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
        <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        <el-button type="primary" icon="el-icon-plus" @click="openAdd">新增字典项</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" size="small">
      <el-table-column label="字典类型" width="150">
        <template slot-scope="{ row }">
          <el-tag size="mini" type="info">{{ dictTypeText(row.dictType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="值" prop="itemValue" width="80" align="center" />
      <el-table-column label="名称" min-width="150">
        <template slot-scope="{ row }">
          {{ row.itemName }}
          <el-tag v-if="row.builtin === 1" size="mini" type="warning" effect="plain" style="margin-left:4px;">内置</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="80" align="center" />
      <el-table-column label="状态" width="90">
        <template slot-scope="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="onToggle(row)" />
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip>
        <template slot-scope="{ row }">{{ row.remark || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template slot-scope="{ row }">
          <el-button type="text" @click="openEdit(row)">编辑</el-button>
          <el-tooltip v-if="row.builtin === 1" content="内置项不允许删除，如需隐藏请改为停用" placement="top">
            <span><el-button type="text" disabled>删除</el-button></span>
          </el-tooltip>
          <el-button v-else type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        :page-sizes="[20, 40, 60, 100]"
        :page-size="query.limit"
        :current-page="query.page"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="onSizeChange"
        @current-change="onPageChange" />
    </div>

    <el-dialog :title="isAdd ? '新增字典项' : '编辑字典项'" :visible.sync="dialogVisible" width="480px">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px" size="small">
        <el-form-item label="字典类型" prop="dictType">
          <el-select v-model="form.dictType" :disabled="!isAdd" style="width:100%">
            <el-option v-for="t in dictTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="值" prop="itemValue">
          <el-input-number v-model="form.itemValue" :min="0" :max="9999" :disabled="!isAdd" style="width:100%" />
          <div class="tip">单据表里实际存的数字，同类型下不能重复，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="名称" prop="itemName">
          <el-input v-model="form.itemName" maxlength="64" placeholder="如：平台入库" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" style="width:100%" />
          <div class="tip">越小越靠前</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="255" placeholder="什么场景用这个类型" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { dictApi } from '@/api/warehouse';

// 已接入字典的类型，后续新增在这里补一行即可
const DICT_TYPES = [
  { value: 'inbound_type', label: '入库类型' },
  { value: 'outbound_type', label: '出库类型' },
];

export default {
  name: 'WarehouseDict',
  data() {
    return {
      loading: false,
      saving: false,
      total: 0,
      tableData: [],
      dictTypes: DICT_TYPES,
      query: { page: 1, limit: 20, dictType: 'inbound_type', keyword: '', status: null },
      dialogVisible: false,
      isAdd: true,
      form: this.emptyForm(),
      rules: {
        dictType: [{ required: true, message: '请选择字典类型', trigger: 'change' }],
        itemValue: [{ required: true, message: '请填写值', trigger: 'blur' }],
        itemName: [{ required: true, message: '请填写名称', trigger: 'blur' }],
      },
    };
  },
  created() {
    this.loadPage();
  },
  methods: {
    emptyForm() {
      return { id: null, dictType: 'inbound_type', itemValue: 0, itemName: '', sort: 0, status: 1, remark: '' };
    },
    dictTypeText(t) {
      const hit = DICT_TYPES.find((x) => x.value === t);
      return hit ? hit.label : t;
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await dictApi.page(this.query);
        const data = (res && (res.data !== undefined ? res.data : res)) || {};
        this.tableData = data.list || data.records || [];
        this.total = data.total || 0;
      } catch (e) {
        this.tableData = [];
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, dictType: 'inbound_type', keyword: '', status: null };
      this.loadPage();
    },
    onSizeChange(v) {
      this.query.limit = v;
      this.query.page = 1;
      this.loadPage();
    },
    onPageChange(v) {
      this.query.page = v;
      this.loadPage();
    },
    openAdd() {
      this.isAdd = true;
      this.form = this.emptyForm();
      if (this.query.dictType) this.form.dictType = this.query.dictType;
      // 新值默认取当前类型里最大值 +1，省得手动查重
      const sameType = this.tableData.filter((x) => x.dictType === this.form.dictType);
      this.form.itemValue = sameType.length ? Math.max(...sameType.map((x) => x.itemValue)) + 1 : 0;
      this.dialogVisible = true;
    },
    openEdit(row) {
      this.isAdd = false;
      this.form = { ...row };
      this.dialogVisible = true;
    },
    onSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await dictApi.save(this.form);
          this.dialogVisible = false;
          this.$message.success('已保存');
          this.loadPage();
        } catch (e) {
          this.$message.error('保存失败: ' + (e.message || e));
        } finally {
          this.saving = false;
        }
      });
    },
    async onToggle(row) {
      try {
        await dictApi.save(row);
        this.$message.success(row.status === 1 ? '已启用' : '已停用');
      } catch (e) {
        row.status = row.status === 1 ? 0 : 1; // 失败回滚，别让界面显示成已生效
        this.$message.error('切换失败: ' + (e.message || e));
      }
    },
    onDelete(row) {
      this.$confirm(`确定删除字典项 [${row.itemName}]?已使用该类型的历史单据会显示为原始数字。`, '提示', { type: 'warning' })
        .then(async () => {
          try {
            await dictApi.del(row.id);
            this.$message.success('已删除');
            this.loadPage();
          } catch (e) {
            this.$message.error('删除失败: ' + (e.message || e));
          }
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 12px; }
.page-title { font-size: 18px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.mb10 { margin-bottom: 10px; }
.filter-container { margin-top: 12px; }
.pager { margin-top: 16px; text-align: right; }
.danger-text { color: #f56c6c; }
.tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.6; }
</style>
