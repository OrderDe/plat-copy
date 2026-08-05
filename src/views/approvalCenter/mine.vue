<template>
  <div class="app-container">
    <div class="page-header">
      <div class="page-title">我发起的</div>
      <div class="page-sub">我提交的所有审批申请</div>
    </div>

    <el-table :data="list" style="margin-top: 12px;" v-loading="loading">
      <el-table-column label="业务类型" width="160">
        <template slot-scope="{ row }">
          <el-tag size="small" type="info">{{ row.businessType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" />
      <el-table-column label="状态" width="100">
        <template slot-scope="{ row }">
          <el-tag size="small" :type="statusType(row)">{{ statusText(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="当前节点/结果">
        <template slot-scope="{ row }">
          <span v-if="row.status === 0">{{ row.currentTaskName }} · {{ row.currentAssigneeName || '待分配' }}</span>
          <span v-else-if="row.result === 1" style="color: #f56c6c;">已驳回: {{ row.comment || '' }}</span>
          <span v-else-if="row.result === 0" style="color: #67c23a;">完成于 {{ row.endTime }}</span>
          <span v-else style="color: #909399;">已撤回</span>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" prop="startTime" width="160" />
      <el-table-column label="操作" width="180">
        <template slot-scope="{ row }">
          <template v-if="row.status === 0">
            <el-button type="text" @click="goDetail(row)">查看</el-button>
            <el-button type="text" @click="withdraw(row)">撤回</el-button>
          </template>
          <el-button v-else type="text" @click="goDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { listMine, withdrawApproval } from '@/api/approvalCenter';

export default {
  name: 'ApprovalMine',
  data() { return { list: [], loading: false }; },
  computed: {
    userId() {
      const info = this.$store.state.user.userInfo || {};
      return info.id || info.userId;
    },
  },
  created() { this.loadList(); },
  methods: {
    async loadList() {
      if (!this.userId) return;
      this.loading = true;
      try {
        const res = await listMine(this.userId);
        const data = res && (res.data !== undefined ? res.data : res);
        this.list = Array.isArray(data) ? data : [];
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
        this.list = [];
      } finally {
        this.loading = false;
      }
    },
    statusType(row) {
      if (row.status === 0) return 'primary';
      if (row.result === 0) return 'success';
      if (row.result === 1) return 'danger';
      return 'info';
    },
    statusText(row) {
      if (row.status === 0) return '审批中';
      if (row.result === 0) return '已通过';
      if (row.result === 1) return '已驳回';
      return '已撤回';
    },
    goDetail(row) {
      this.$router.push(`/approvalCenter/detail/${row.id}`);
    },
    async withdraw(row) {
      this.$confirm('确定撤回该申请?', '提示', { type: 'warning' })
        .then(async () => {
          try {
            await withdrawApproval(row.id, this.userId);
            this.$message.success('已撤回');
            this.loadList();
          } catch (e) {
            this.$message.error('撤回失败: ' + (e.message || e));
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
</style>
