<template>
  <div class="divBox product-share-makers">
    <el-card shadow="never" :bordered="false" class="filter-card">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="关键词">
          <el-input v-model.trim="query.keywords" clearable class="keyword-input" placeholder="创客昵称或手机号" @keyup.enter.native="load(1)" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" class="status-input">
            <el-option label="正常" :value="0" />
            <el-option label="欠款锁定" :value="1" />
            <el-option label="已禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="load(1)">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="page-tip">创客即分销团队长，佣金和提现余额来自分销结算记录。</div>
    </el-card>

    <el-card shadow="never" :bordered="false" class="table-card">
      <el-table v-loading="loading" :data="list" border size="small">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="创客" min-width="170">
          <template slot-scope="{ row }">
            <div>{{ row.nickname || `用户${row.uid || ''}` }}</div>
            <div class="sub-line">UID：{{ row.uid || '-' }}<span v-if="row.phone"> · {{ row.phone }}</span></div>
          </template>
        </el-table-column>
        <el-table-column prop="levelName" label="等级" width="110" />
        <el-table-column prop="memberCount" label="有效成员" width="95" />
        <el-table-column prop="totalCommission" label="累计佣金（元）" width="125">
          <template slot-scope="{ row }">¥{{ money(row.totalCommission) }}</template>
        </el-table-column>
        <el-table-column prop="balance" label="可提现余额（元）" width="140">
          <template slot-scope="{ row }">¥{{ money(row.balance || row.withdrawableBalance) }}</template>
        </el-table-column>
        <el-table-column prop="totalWithdraw" label="累计提现（元）" width="125">
          <template slot-scope="{ row }">¥{{ money(row.totalWithdraw || row.withdrawnAmount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template slot-scope="{ row }"><el-tag size="mini" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="成为创客时间" min-width="155" />
        <el-table-column label="操作" width="90" fixed="right">
          <template slot-scope="{ row }">
            <el-button v-if="Number(row.status) === 0" type="text" size="small" class="danger-text" @click="toggleStatus(row, 2)">禁用</el-button>
            <el-button v-else-if="Number(row.status) === 2" type="text" size="small" @click="toggleStatus(row, 0)">启用</el-button>
            <span v-else class="sub-line">锁定</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="query.limit"
        :current-page="query.page"
        :total="total"
        @size-change="onSizeChange"
        @current-change="load"
      />
    </el-card>
  </div>
</template>

<script>
import { shareMakerListApi, shareMakerStatusApi } from '@/api/productShare';

export default {
  name: 'DistributionProductShareMakers',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      query: { page: 1, limit: 20, merId: 0, status: null, keywords: '' },
    };
  },
  created() {
    this.load(1);
  },
  methods: {
    cleanQuery() {
      return Object.keys(this.query).reduce((result, key) => {
        const value = this.query[key];
        if (value !== '' && value !== null && value !== undefined) result[key] = value;
        return result;
      }, {});
    },
    normalizePage(response) {
      const data = response && response.data !== undefined ? response.data : response;
      return data || {};
    },
    load(page) {
      if (page) this.query.page = Number(page);
      this.loading = true;
      shareMakerListApi(this.cleanQuery())
        .then((response) => {
          const data = this.normalizePage(response);
          this.list = (data.list || data.records || []).map((row) => ({
            ...row,
            levelName: row.levelName !== undefined ? row.levelName : row.level_name,
            memberCount: row.memberCount !== undefined ? row.memberCount : row.member_count,
            totalCommission: row.totalCommission !== undefined ? row.totalCommission : row.total_commission,
            totalWithdraw: row.totalWithdraw !== undefined ? row.totalWithdraw : row.total_withdraw,
            withdrawableBalance: row.withdrawableBalance !== undefined ? row.withdrawableBalance : row.withdrawable_balance,
            withdrawnAmount: row.withdrawnAmount !== undefined ? row.withdrawnAmount : row.withdrawn_amount,
            createTime: row.createTime !== undefined ? row.createTime : row.create_time,
          }));
          this.total = Number(data.total) || 0;
        })
        .catch(() => {
          this.list = [];
          this.total = 0;
        })
        .finally(() => { this.loading = false; });
    },
    reset() {
      this.query = { page: 1, limit: 20, merId: 0, status: null, keywords: '' };
      this.load(1);
    },
    onSizeChange(limit) {
      this.query.limit = limit;
      this.load(1);
    },
    money(value) {
      return Number(value || 0).toFixed(2);
    },
    statusText(status) {
      return ['正常', '欠款锁定', '已禁用'][Number(status)] || '未知';
    },
    statusType(status) {
      return Number(status) === 2 ? 'danger' : Number(status) === 1 ? 'warning' : 'success';
    },
    toggleStatus(row, status) {
      const action = status === 0 ? '启用' : '禁用';
      this.$confirm(`确定${action}创客“${row.nickname || row.uid}”吗？`, '提示', { type: 'warning' })
        .then(() => shareMakerStatusApi(row.uid, status))
        .then(() => {
          this.$message.success(`${action}成功`);
          this.load();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.filter-card { margin-bottom: 14px; }
.table-card { min-height: 460px; }
.keyword-input { width: 230px; }
.status-input { width: 120px; }
.page-tip { color: #909399; font-size: 12px; line-height: 20px; }
.sub-line { margin-top: 3px; color: #909399; font-size: 12px; }
.danger-text { color: #f56c6c; }
.el-pagination { margin-top: 14px; text-align: right; }
</style>
