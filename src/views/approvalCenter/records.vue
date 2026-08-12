<template>
  <div class="app-container approval-center-page">
    <div class="page-header">
      <div class="page-title">审批记录</div>
      <div class="page-sub">平台全量审批留档 · 不限发起人与审批人 · 共 {{ total }} 条</div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" size="small">
        <el-form-item label="业务类型">
          <el-select v-model="filter.businessType" placeholder="全部" clearable filterable allow-create style="width: 160px;">
            <el-option v-for="t in businessTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务ID">
          <el-input v-model="filter.businessId" placeholder="如商品ID" clearable style="width: 120px;" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="filter.title" placeholder="标题关键字" clearable style="width: 160px;" />
        </el-form-item>
        <el-form-item label="发起人">
          <el-input v-model="filter.applyUserName" placeholder="发起人姓名" clearable style="width: 120px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable style="width: 110px;">
            <el-option label="审批中" :value="0" />
            <el-option label="已办结" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="filter.result" placeholder="全部" clearable style="width: 110px;">
            <el-option label="通过" :value="0" />
            <el-option label="驳回" :value="1" />
            <el-option label="撤回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="发起时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item class="approval-toolbar-actions">
          <el-button class="approval-toolbar-btn" type="primary" icon="el-icon-search" @click="search">查询</el-button>
          <el-button class="approval-toolbar-btn" icon="el-icon-refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="list" style="margin-top: 12px;" v-loading="loading" @row-click="goDetail">
      <el-table-column label="编号" prop="id" width="80" />
      <el-table-column label="业务类型" width="150">
        <template slot-scope="{ row }">
          <el-tag size="small" type="info">{{ row.businessType || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="业务ID" prop="businessId" width="90" />
      <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column label="发起人" prop="applyUserName" width="110" />
      <el-table-column label="当前节点" width="130">
        <template slot-scope="{ row }">{{ row.currentTaskName || '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template slot-scope="{ row }">
          <el-tag size="small" :type="row.status === 1 ? 'info' : 'warning'">
            {{ row.status === 1 ? '已办结' : '审批中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结果" width="90">
        <template slot-scope="{ row }">
          <el-tag v-if="row.status === 1" size="small" :type="resultType(row.result)">{{ resultText(row.result) }}</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="发起时间" width="160">
        <template slot-scope="{ row }">{{ formatDateTime(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="办结时间" width="160">
        <template slot-scope="{ row }">{{ formatDateTime(row.endTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="130" align="center" fixed="right">
        <template slot-scope="{ row }">
          <div class="approval-action-group">
            <el-button class="approval-action-btn" type="primary" plain size="mini" icon="el-icon-view" @click.stop="goDetail(row)">查看详情</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 14px; text-align: right;"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :current-page="query.page"
      :page-size="query.limit"
      :page-sizes="[20, 50, 100]"
      :total="total"
      @size-change="onSizeChange"
      @current-change="onPageChange"
    />
  </div>
</template>

<script>
import { pageApprovalRecords } from '@/api/approvalCenter';

export default {
  name: 'ApprovalRecords',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      dateRange: [],
      filter: {
        businessType: '',
        businessId: '',
        title: '',
        applyUserName: '',
        status: '',
        result: '',
      },
      query: { page: 1, limit: 20 },
      // 常见业务类型，允许手输其他值(allow-create)
      businessTypes: ['商户新增商品', '商户修改商品', '商户入驻', '商户店铺变更', '商户提现', '优惠券发布'],
    };
  },
  created() {
    // 支持从商品等业务页面带参跳进来，直接定位到某条业务的审批轨迹
    const { businessType, businessId } = this.$route.query || {};
    if (businessType) this.filter.businessType = businessType;
    if (businessId) this.filter.businessId = businessId;
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const payload = {
          ...this.query,
          businessType: this.filter.businessType || undefined,
          businessId: this.filter.businessId ? Number(this.filter.businessId) : undefined,
          title: this.filter.title || undefined,
          applyUserName: this.filter.applyUserName || undefined,
          status: this.filter.status === '' ? undefined : this.filter.status,
          result: this.filter.result === '' ? undefined : this.filter.result,
          startTimeBegin: (this.dateRange && this.dateRange[0]) || undefined,
          startTimeEnd: (this.dateRange && this.dateRange[1]) || undefined,
        };
        const res = await pageApprovalRecords(payload);
        const data = res && (res.data !== undefined ? res.data : res);
        // 后端分页对象在不同版本中可能使用 list 或 records 字段。
        this.list = (data && (data.list || data.records)) || [];
        this.total = (data && data.total) || 0;
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    search() {
      this.query.page = 1;
      this.load();
    },
    reset() {
      this.filter = { businessType: '', businessId: '', title: '', applyUserName: '', status: '', result: '' };
      this.dateRange = [];
      this.query.page = 1;
      this.load();
    },
    onPageChange(page) {
      this.query.page = page;
      this.load();
    },
    onSizeChange(limit) {
      this.query.limit = limit;
      this.query.page = 1;
      this.load();
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
