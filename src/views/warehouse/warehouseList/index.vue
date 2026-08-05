<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="仓库名称">
        <el-input v-model="query.name" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库编码">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" clearable placeholder="全部" style="width:120px">
          <el-option label="城市仓" :value="0" />
          <el-option label="物业仓" :value="1" />
          <el-option label="门店仓" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
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
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新增仓库</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="code" label="仓库编码" width="140" />
      <el-table-column prop="name" label="仓库名称" min-width="150" />
      <el-table-column label="类型" width="90">
        <template slot-scope="{row}">
          <el-tag size="mini">{{ typeText(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactName" label="联系人" width="100" />
      <el-table-column prop="contactPhone" label="电话" width="130" />
      <el-table-column label="地址" min-width="200" show-overflow-tooltip>
        <template slot-scope="{row}">
          {{ [row.province, row.city, row.region, row.detailAddress].filter(Boolean).join('') }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template slot-scope="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="mini">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="170" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDialog(row)">编辑</el-button>
          <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadPage"
      @current-change="loadPage"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="form.id ? '编辑仓库' : '新增仓库'" :visible.sync="dialogVisible" width="640px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="仓库编码" prop="code">
          <el-input v-model="form.code" placeholder="唯一编码" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="城市仓" :value="0" />
            <el-option label="物业仓" :value="1" />
            <el-option label="门店仓" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="省">
          <el-input v-model="form.province" />
        </el-form-item>
        <el-form-item label="市">
          <el-input v-model="form.city" />
        </el-form-item>
        <el-form-item label="区">
          <el-input v-model="form.region" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="form.detailAddress" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { warehouseApi } from '@/api/warehouse';

export default {
  name: 'WarehouseList',
  data() {
    return {
      loading: false,
      saving: false,
      total: 0,
      tableData: [],
      query: { page: 1, limit: 20, name: '', code: '', type: null, status: null },
      dialogVisible: false,
      form: this.emptyForm(),
      rules: {
        code: [{ required: true, message: '请输入仓库编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
      },
    };
  },
  created() {
    this.loadPage();
  },
  methods: {
    emptyForm() {
      return { id: null, code: '', name: '', type: 0, contactName: '', contactPhone: '',
        province: '', city: '', region: '', detailAddress: '', status: 1, remark: '' };
    },
    typeText(t) {
      return ({ 0: '城市仓', 1: '物业仓', 2: '门店仓' })[t] || '-';
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await warehouseApi.page(this.query);
        this.tableData = res.data.list || [];
        this.total = res.data.total || 0;
      } finally {
        this.loading = false;
      }
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, name: '', code: '', type: null, status: null };
      this.loadPage();
    },
    openDialog(row) {
      this.form = row ? { ...row } : this.emptyForm();
      this.dialogVisible = true;
    },
    resetForm() {
      this.$refs.formRef && this.$refs.formRef.resetFields();
    },
    async onSubmit() {
      await this.$refs.formRef.validate();
      this.saving = true;
      try {
        if (this.form.id) {
          await warehouseApi.edit(this.form);
        } else {
          await warehouseApi.add(this.form);
        }
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally {
        this.saving = false;
      }
    },
    onDelete(row) {
      this.$confirm(`确定删除仓库「${row.name}」?`, '提示', { type: 'warning' })
        .then(async () => {
          await warehouseApi.del(row.id);
          this.$message.success('删除成功');
          this.loadPage();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
</style>
