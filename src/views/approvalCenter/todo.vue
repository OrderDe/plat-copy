<template>
  <div class="app-container">
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
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="loadList">刷新</el-button>
          <el-button @click="resetFilter">重置</el-button>
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
      <el-table-column label="提交时间" prop="submitTime" width="160" />
      <el-table-column label="操作" width="200">
        <template slot-scope="{ row }">
          <el-button type="text" @click.stop="goDetail(row)">审批</el-button>
          <el-button type="text" @click.stop="quickApprove(row)">一键通过</el-button>
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
    goDetail(row) {
      this.$router.push({ path: `/approvalCenter/detail/${row.instanceId}`, query: { taskId: row.taskId } });
    },
    async quickApprove(row) {
      this.$confirm(`确定一键通过 [${row.title}]?`, '提示', { type: 'warning' })
        .then(async () => {
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
