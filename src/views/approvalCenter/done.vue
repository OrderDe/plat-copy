<template>
  <div class="app-container approval-center-page">
    <div class="page-header">
      <div class="page-title">已办结</div>
      <div class="page-sub">我参与过的、已完成的审批 · 共 {{ list.length }} 条</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" size="small">
        <el-form-item label="结果">
          <el-select v-model="filter.result" placeholder="全部" clearable style="width: 120px;">
            <el-option label="通过" :value="0" />
            <el-option label="驳回" :value="1" />
            <el-option label="撤回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filter.keyword" placeholder="标题/发起人" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item class="approval-toolbar-actions">
          <el-button class="approval-toolbar-btn" type="primary" icon="el-icon-refresh" @click="load">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="filtered" style="margin-top: 12px;" v-loading="loading" @row-click="goDetail">
      <el-table-column label="业务类型" width="160">
        <template slot-scope="{ row }">
          <el-tag size="small" type="info">{{ row.businessType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" />
      <el-table-column label="发起人" prop="applyUserName" width="120" />
      <el-table-column label="我的角色" prop="myRole" width="120" />
      <el-table-column label="结果" width="100">
        <template slot-scope="{ row }">
          <el-tag size="small" :type="resultType(row.result)">{{ resultText(row.result) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="办结时间" width="160">
        <template slot-scope="{ row }">{{ formatDateTime(row.endTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template slot-scope="{ row }">
          <div class="approval-action-group">
            <el-button class="approval-action-btn" type="primary" plain size="mini" icon="el-icon-view" @click.stop="goDetail(row)">查看详情</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { listDone } from '@/api/approvalCenter';

export default {
  name: 'ApprovalDone',
  data() {
    return {
      list: [],
      loading: false,
      filter: { result: '', keyword: '' },
    };
  },
  computed: {
    userId() { return (this.$store.state.user.userInfo || {}).id; },
    filtered() {
      return this.list.filter(r => {
        if (this.filter.result !== '' && this.filter.result !== null && r.result !== this.filter.result) return false;
        if (this.filter.keyword && !((r.title || '') + (r.applyUserName || '')).includes(this.filter.keyword)) return false;
        return true;
      });
    },
  },
  created() { this.load(); },
  methods: {
    async load() {
      if (!this.userId) return;
      this.loading = true;
      try {
        const res = await listDone(this.userId);
        const data = res && (res.data !== undefined ? res.data : res);
        this.list = Array.isArray(data) ? data : [];
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    resultType(r) { return { 0: 'success', 1: 'danger', 2: 'info' }[r] || 'info'; },
    resultText(r) { return { 0: '通过', 1: '驳回', 2: '撤回' }[r] || '-'; },
    formatDateTime(value) {
      if (!value) return '-';
      return String(value).replace('T', ' ').substring(0, 19);
    },
    goDetail(row) {
      this.$router.push(`/approvalCenter/detail/${row.id}`);
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.filter-card >>> .el-card__body { padding: 12px 16px; }
.el-table >>> .el-table__row { cursor: pointer; }
</style>
