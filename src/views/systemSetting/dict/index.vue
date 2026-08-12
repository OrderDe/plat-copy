<template>
  <div class="divBox">
    <el-card class="box-card" :bordered="false" shadow="never">
      <div class="page-header">
        <div class="page-title">字典列表</div>
        <div class="page-sub">
          维护系统配置项（eb_system_config）。这里放的是不属于任何设置表单的开关/参数，改完立即生效。
        </div>
      </div>

      <el-alert type="warning" :closable="false" class="mb15">
        <template slot="title">
          键名（name）是代码里读取配置用的标识，改错或删错会让对应功能失效，请谨慎操作。
        </template>
      </el-alert>

      <el-form :inline="true" size="small" @submit.native.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="keyword"
            placeholder="键名 / 名称 / 值"
            clearable
            style="width: 240px;"
            @keyup.enter.native="getList(1)"
            @clear="getList(1)" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="getList(1)">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="openAdd">新增字典</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" size="small" class="mt10">
        <el-table-column label="ID" prop="id" width="70" />
        <el-table-column label="键名" min-width="220">
          <template slot-scope="{ row }">
            <code class="dict-code">{{ row.name }}</code>
            <i class="el-icon-document-copy copy-btn" title="复制键名" @click="copyText(row.name)"></i>
          </template>
        </el-table-column>
        <el-table-column label="名称/说明" prop="title" min-width="180" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.title || '—' }}</template>
        </el-table-column>
        <el-table-column label="值" min-width="200" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span class="dict-value">{{ row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.status === false ? 'info' : 'success'">
              {{ row.status === false ? '停用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template slot-scope="{ row }">{{ formatTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" class="danger-text" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="block">
        <el-pagination
          :page-sizes="[20, 40, 60, 100]"
          :page-size="limit"
          :current-page="page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <el-dialog :title="isAdd ? '新增字典' : '编辑字典'" :visible.sync="dialogVisible" width="520px">
      <el-form :model="form" label-width="90px" size="small">
        <el-form-item label="键名" required>
          <el-input v-model="form.name" :disabled="!isAdd" placeholder="英文，如：product_wms_managed_selectable" />
          <div class="tip">代码里读取配置用的标识，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="名称/说明">
          <el-input v-model="form.title" placeholder="给运营看的中文说明" />
        </el-form-item>
        <el-form-item label="值" required>
          <el-input v-model="form.value" type="textarea" :rows="3" placeholder="开关类一般填 1 开 / 0 关" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { dictListApi, dictSaveApi, dictDeleteApi } from '@/api/systemConfig';

export default {
  name: 'SystemDictList',
  data() {
    return {
      loading: false,
      saving: false,
      tableData: [],
      keyword: '',
      page: 1,
      limit: 20,
      total: 0,
      dialogVisible: false,
      isAdd: true,
      form: this.emptyForm(),
    };
  },
  mounted() {
    this.getList(1);
  },
  methods: {
    emptyForm() {
      return { id: null, name: '', title: '', value: '', status: true };
    },
    getList(page) {
      if (page) this.page = page;
      this.loading = true;
      dictListApi({ keyword: this.keyword, page: this.page, limit: this.limit })
        .then((res) => {
          const data = (res && (res.data !== undefined ? res.data : res)) || {};
          this.tableData = data.list || [];
          this.total = data.total || 0;
        })
        .catch((e) => {
          this.tableData = [];
          this.$message.error('加载失败: ' + (e.message || e));
        })
        .finally(() => {
          this.loading = false;
        });
    },
    resetSearch() {
      this.keyword = '';
      this.getList(1);
    },
    handleSizeChange(val) {
      this.limit = val;
      this.getList(1);
    },
    handleCurrentChange(val) {
      this.page = val;
      this.getList();
    },
    openAdd() {
      this.isAdd = true;
      this.form = this.emptyForm();
      this.dialogVisible = true;
    },
    openEdit(row) {
      this.isAdd = false;
      this.form = { ...row, status: row.status !== false };
      this.dialogVisible = true;
    },
    submit() {
      if (!this.form.name) return this.$message.warning('请填写键名');
      if (this.form.value === '' || this.form.value === null) return this.$message.warning('请填写值');
      this.saving = true;
      dictSaveApi(this.form)
        .then(() => {
          this.dialogVisible = false;
          this.$message.success('已保存');
          this.getList();
        })
        .catch((e) => {
          this.$message.error('保存失败: ' + (e.message || e));
        })
        .finally(() => {
          this.saving = false;
        });
    },
    handleDelete(row) {
      this.$confirm(`确定删除字典 [${row.name}]?依赖该配置的功能会回落到默认行为。`, '提示', { type: 'warning' })
        .then(() => {
          dictDeleteApi(row.id)
            .then(() => {
              this.$message.success('已删除');
              this.getList();
            })
            .catch((e) => {
              this.$message.error('删除失败: ' + (e.message || e));
            });
        })
        .catch(() => {});
    },
    formatTime(value) {
      if (!value) return '—';
      return String(value).replace('T', ' ').substring(0, 19);
    },
    copyText(text) {
      const ta = document.createElement('textarea');
      ta.value = text || '';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        this.$message.success('已复制: ' + text);
      } catch {
        this.$message.warning('复制失败，请手动选择');
      } finally {
        document.body.removeChild(ta);
      }
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 12px; }
.page-title { font-size: 18px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.dict-code { background: #f2f3f5; color: #606266; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
.dict-value { color: #303133; word-break: break-all; }
.copy-btn { margin-left: 6px; cursor: pointer; color: #909399; }
.copy-btn:hover { color: #409eff; }
.danger-text { color: #f56c6c; }
.tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.6; }
.block { margin-top: 16px; text-align: right; }
</style>
