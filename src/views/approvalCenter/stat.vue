<template>
  <div class="app-container" v-loading="loading">
    <div class="page-header">
      <div class="page-title">审批统计</div>
      <div class="page-sub">
        近
        <el-select v-model="days" size="mini" style="width: 90px; margin: 0 6px;" @change="load">
          <el-option :value="7" label="7 天" />
          <el-option :value="30" label="30 天" />
          <el-option :value="90" label="90 天" />
        </el-select>
        数据
      </div>
    </div>

    <el-row :gutter="12">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">总审批数</div>
          <div class="stat-val">{{ formatNum(stat.total) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">通过率</div>
          <div class="stat-val" style="color:#67c23a;">{{ stat.approvedRate || 0 }}%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">平均耗时</div>
          <div class="stat-val">{{ stat.avgHours || '0h' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">超时数</div>
          <div class="stat-val" style="color:#f56c6c;">{{ stat.overdueCount || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top: 12px;">
      <el-col :span="8">
        <el-card shadow="never" class="mini-card">
          <div class="mini-label">通过</div>
          <div class="mini-val" style="color:#67c23a;">{{ stat.approved || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="mini-card">
          <div class="mini-label">驳回</div>
          <div class="mini-val" style="color:#f56c6c;">{{ stat.rejected || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="mini-card">
          <div class="mini-label">撤回</div>
          <div class="mini-val" style="color:#909399;">{{ stat.withdrawn || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 16px;">
      <div slot="header">Top 5 高频业务</div>
      <el-table :data="stat.topBiz || []" size="small">
        <el-table-column label="业务类型" prop="name" />
        <el-table-column label="审批总数" prop="total" width="120" align="center" />
        <el-table-column label="通过率" width="180">
          <template slot-scope="{ row }">
            <el-progress :percentage="row.rate" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column label="平均耗时" prop="avgHours" width="120" align="center" />
      </el-table>
      <el-empty v-if="!(stat.topBiz && stat.topBiz.length)" description="暂无数据" :image-size="80" />
    </el-card>
  </div>
</template>

<script>
import { approvalStat } from '@/api/approvalCenter';

export default {
  name: 'ApprovalStat',
  data() {
    return {
      days: 30,
      stat: {},
      loading: false,
    };
  },
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await approvalStat(this.days);
        this.stat = (res && (res.data !== undefined ? res.data : res)) || {};
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
        this.stat = {};
      } finally {
        this.loading = false;
      }
    },
    formatNum(n) {
      if (n == null) return '0';
      return Number(n).toLocaleString();
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; display: flex; align-items: center; }
.stat-card >>> .el-card__body { padding: 16px; }
.stat-label { font-size: 12px; color: #909399; margin-bottom: 8px; }
.stat-val { font-size: 28px; font-weight: 500; }
.mini-card >>> .el-card__body { padding: 12px 16px; }
.mini-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
.mini-val { font-size: 20px; font-weight: 500; }
</style>
