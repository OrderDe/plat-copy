<template>
  <div class="app-container approval-center-page">
    <div class="page-header">
      <div class="page-title">我的待办</div>
      <div class="page-sub">共 {{ list.length }} 条待处理审批</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" size="small">
        <el-form-item label="业务类型">
          <el-input v-model="filter.bizType" placeholder="全部" clearable style="width: 160px;" />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filter.keyword" placeholder="标题/发起人" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item class="approval-toolbar-actions">
          <el-button class="approval-toolbar-btn" type="primary" icon="el-icon-refresh" @click="loadList">刷新</el-button>
          <el-button class="approval-toolbar-btn" icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="filteredList" style="margin-top: 12px;" @row-click="goDetail" v-loading="loading">
      <el-table-column label="业务类型" width="160">
        <template slot-scope="{ row }">
          <el-tag size="small" type="info">{{ row.businessType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" />
      <el-table-column label="发起人" prop="applyUserName" width="120" />
      <el-table-column label="当前节点" width="140">
        <template slot-scope="{ row }">
          <el-tag size="small" type="warning">{{ row.taskName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" width="160">
        <template slot-scope="{ row }">{{ formatDateTime(row.submitTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="230" align="center">
        <template slot-scope="{ row }">
          <div class="approval-action-group">
            <el-button class="approval-action-btn" type="primary" plain size="mini" icon="el-icon-edit-outline" @click.stop="goDetail(row)">审批</el-button>
            <el-button class="approval-action-btn" type="success" plain size="mini" icon="el-icon-check" :loading="!!approving[row.taskId]" :disabled="!!approving[row.taskId]" @click.stop="quickApprove(row)">一键通过</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { listTodo, approvePass } from '@/api/approvalCenter';

export default {
  name: 'ApprovalTodo',
  data() {
    return {
      list: [],
      loading: false,
      // 按 taskId 记正在提交中的审批，防止重复点击并发提交
      approving: {},
      filter: { bizType: '', keyword: '' },
    };
  },
  computed: {
    userId() {
      const info = this.$store.state.user.userInfo || {};
      return info.id || info.userId;
    },
    userName() {
      const info = this.$store.state.user.userInfo || {};
      return info.realName || info.account || 'me';
    },
    filteredList() {
      return this.list.filter(r => {
        if (this.filter.bizType && !(r.businessType || '').includes(this.filter.bizType)) return false;
        if (this.filter.keyword && !((r.title || '') + (r.applyUserName || '')).includes(this.filter.keyword)) return false;
        return true;
      });
    },
  },
  created() {
    this.loadList();
  },
  methods: {
    async loadList() {
      if (!this.userId) return;
      this.loading = true;
      try {
        const res = await listTodo(this.userId);
        const data = res && (res.data !== undefined ? res.data : res);
        this.list = Array.isArray(data) ? data : [];
      } catch (e) {
        this.$message.error('加载待办失败: ' + (e.message || e));
        this.list = [];
      } finally {
        this.loading = false;
      }
    },
    resetFilter() {
      this.filter = { bizType: '', keyword: '' };
    },
    formatDateTime(value) {
      if (!value) return '-';
      return String(value).replace('T', ' ').substring(0, 19);
    },
    goDetail(row) {
      this.$router.push({ path: `/approvalCenter/detail/${row.instanceId}`, query: { taskId: row.taskId } });
    },
    async quickApprove(row) {
      // 之前这里没有任何防重：点两下就发两个 pass，两个事务同时改同一条
      // HistoricTaskInstanceEntity，后提交的抛 Flowable 乐观锁异常，
      // 页面上直接弹出一整段 "was updated by another transaction concurrently"
      if (this.approving[row.taskId]) return;
      this.$confirm(`确定一键通过 [${row.title}]?`, '提示', { type: 'warning' })
        .then(async () => {
          if (this.approving[row.taskId]) return;
          this.$set(this.approving, row.taskId, true);
          try {
            await approvePass({
              taskId: row.taskId,
              comment: '同意',
              userId: this.userId,
              userName: this.userName,
            });
            this.$message.success('已通过');
            this.loadList();
          } catch (e) {
            this.$message.error('操作失败: ' + (e.message || e));
          } finally {
            this.$set(this.approving, row.taskId, false);
          }
        }).catch(() => {});
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
