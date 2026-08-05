<template>
  <div class="app-container">
    <div class="page-header">
      <div class="page-title">我收到的抄送</div>
      <div class="page-sub">仅知会,无需审批操作 · 未读 {{ unreadCount }} 条</div>
    </div>

    <el-table :data="list" style="margin-top: 12px;" v-loading="loading" @row-click="goDetail">
      <el-table-column label="标题" prop="title">
        <template slot-scope="{ row }">
          <el-tag v-if="!row.isRead" size="mini" type="primary" style="margin-right: 6px;">未读</el-tag>
          {{ row.title || '(标题缺失)' }}
        </template>
      </el-table-column>
      <el-table-column label="抄送人" prop="ccUserName" width="140" />
      <el-table-column label="抄送时间" prop="ccTime" width="180" />
      <el-table-column label="阅读时间" prop="readTime" width="180">
        <template slot-scope="{ row }">{{ row.readTime || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template slot-scope="{ row }">
          <el-button type="text" @click.stop="viewInstance(row)">查看</el-button>
          <el-button v-if="!row.isRead" type="text" @click.stop="markRead(row)">标为已读</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { listCc, markCcRead } from '@/api/approvalCenter';

export default {
  name: 'ApprovalCc',
  data() { return { list: [], loading: false }; },
  computed: {
    userId() { return (this.$store.state.user.userInfo || {}).id; },
    unreadCount() { return this.list.filter(x => !x.isRead).length; },
  },
  created() { this.load(); },
  methods: {
    async load() {
      if (!this.userId) return;
      this.loading = true;
      try {
        const res = await listCc(this.userId);
        const data = res && (res.data !== undefined ? res.data : res);
        this.list = Array.isArray(data) ? data : [];
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    async markRead(row) {
      try {
        await markCcRead(row.id, this.userId);
        row.isRead = true;
        row.readTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
        this.$message.success('已标为已读');
      } catch (e) {
        this.$message.error('操作失败: ' + (e.message || e));
      }
    },
    viewInstance(row) {
      this.$router.push(`/approvalCenter/detail/${row.instanceId}`);
    },
    goDetail(row) { this.viewInstance(row); },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.el-table >>> .el-table__row { cursor: pointer; }
</style>
