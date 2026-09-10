<template>
  <div class="divBox product-share-withdraw">
    <el-card shadow="never" :bordered="false" class="filter-card">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="关键词">
          <el-input v-model.trim="query.keywords" clearable class="keyword-input" placeholder="昵称、手机号或姓名" @keyup.enter.native="load(1)" />
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select v-model="query.status" clearable placeholder="全部" class="status-input">
            <el-option label="待审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="已打款" :value="2" />
            <el-option label="已驳回" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="load(1)">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :bordered="false" class="table-card">
      <el-table v-loading="loading" :data="list" border size="small">
        <el-table-column prop="id" label="申请 ID" width="80" />
        <el-table-column label="申请人" min-width="150">
          <template slot-scope="{ row }">
            <div>{{ row.nickname || row.realName || `用户${row.uid || ''}` }}</div>
            <div class="sub-line">UID：{{ row.uid || '-' }}<span v-if="row.phone"> · {{ row.phone }}</span></div>
          </template>
        </el-table-column>
        <el-table-column prop="applyAmount" label="申请金额（元）" width="125">
          <template slot-scope="{ row }">¥{{ money(row.applyAmount) }}</template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实发金额（元）" width="125">
          <template slot-scope="{ row }">¥{{ money(row.actualAmount || row.applyAmount) }}</template>
        </el-table-column>
        <el-table-column prop="withdrawType" label="提现方式" width="100">
          <template slot-scope="{ row }">{{ withdrawTypeText(row.withdrawType) }}</template>
        </el-table-column>
        <el-table-column prop="bankCard" label="收款账号" min-width="170" show-overflow-tooltip />
        <el-table-column prop="complianceFlag" label="合规标记" width="100">
          <template slot-scope="{ row }"><el-tag size="mini" :type="Number(row.complianceFlag) === 1 ? 'warning' : 'success'">{{ Number(row.complianceFlag) === 1 ? '需人工发票' : '正常' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="95">
          <template slot-scope="{ row }"><el-tag size="mini" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" min-width="155" />
        <el-table-column label="操作" width="190" fixed="right">
          <template slot-scope="{ row }">
            <el-button v-if="Number(row.status) === 0" type="text" size="small" @click="openAction(row, 'approve')">审核通过</el-button>
            <el-button v-if="Number(row.status) === 0" type="text" size="small" class="danger-text" @click="openAction(row, 'reject')">驳回</el-button>
            <el-button v-if="Number(row.status) === 1" type="text" size="small" @click="openAction(row, 'transfer')">确认已打款</el-button>
            <span v-if="Number(row.status) !== 0 && Number(row.status) !== 1" class="sub-line">无可用操作</span>
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

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="430px">
      <el-form size="small">
        <el-form-item label="备注">
          <el-input v-model.trim="remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="可填写审核或打款备注" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="confirmAction">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { shareWithdrawListApi, shareWithdrawAuditApi, shareWithdrawTransferApi } from '@/api/productShare';

export default {
  name: 'DistributionProductShareWithdraw',
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      total: 0,
      query: { page: 1, limit: 20, merId: 0, status: null, keywords: '' },
      dialogVisible: false,
      dialogTitle: '',
      remark: '',
      current: null,
      action: '',
    };
  },
  computed: {
    adminId() {
      const info = (this.$store && this.$store.state.user.userInfo) || {};
      return Number(info.id || info.adminId || 0);
    },
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
      shareWithdrawListApi(this.cleanQuery())
        .then((response) => {
          const data = this.normalizePage(response);
          this.list = (data.list || data.records || []).map((row) => ({
            ...row,
            applyAmount: row.applyAmount !== undefined ? row.applyAmount : row.apply_amount,
            actualAmount: row.actualAmount !== undefined ? row.actualAmount : row.actual_amount,
            withdrawType: row.withdrawType !== undefined ? row.withdrawType : row.withdraw_type,
            bankCard: row.bankCard !== undefined ? row.bankCard : row.bank_card,
            complianceFlag: row.complianceFlag !== undefined ? row.complianceFlag : row.compliance_flag,
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
      return ['待审核', '审核通过', '已打款', '已驳回'][Number(status)] || '未知';
    },
    statusType(status) {
      return Number(status) === 2 ? 'success' : Number(status) === 3 ? 'danger' : Number(status) === 0 ? 'warning' : '';
    },
    withdrawTypeText(type) {
      return { 1: '银行卡', 2: '微信', 3: '支付宝' }[Number(type)] || '-';
    },
    openAction(row, action) {
      this.current = row;
      this.action = action;
      this.remark = '';
      this.dialogTitle = action === 'approve' ? '审核提现' : action === 'reject' ? '驳回提现' : '确认人工打款';
      this.dialogVisible = true;
    },
    confirmAction() {
      if (!this.current || !this.adminId) {
        this.$message.warning('未获取到当前管理员信息，请重新登录后重试');
        return;
      }
      this.saving = true;
      const request = this.action === 'transfer'
        ? shareWithdrawTransferApi(this.current.id, { adminId: this.adminId })
        : shareWithdrawAuditApi(this.current.id, {
          pass: this.action === 'approve',
          auditRemark: this.remark,
          adminId: this.adminId,
        });
      request
        .then(() => {
          this.$message.success('操作成功');
          this.dialogVisible = false;
          this.load();
        })
        .finally(() => { this.saving = false; });
    },
  },
};
</script>

<style scoped>
.filter-card { margin-bottom: 14px; }
.table-card { min-height: 460px; }
.keyword-input { width: 230px; }
.status-input { width: 120px; }
.sub-line { margin-top: 3px; color: #909399; font-size: 12px; }
.danger-text { color: #f56c6c; }
.el-pagination { margin-top: 14px; text-align: right; }
</style>
