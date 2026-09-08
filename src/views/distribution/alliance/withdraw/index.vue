<template>
  <div class="divBox">
    <el-card shadow="never">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="状态"><el-select v-model="status" clearable placeholder="全部" class="selWidthSm"><el-option label="待审核" :value="0" /><el-option label="审核通过" :value="1" /><el-option label="已打款" :value="2" /><el-option label="已驳回" :value="3" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="load">查询</el-button></el-form-item>
      </el-form>
      <el-table :data="list" border size="small" v-loading="loading">
        <el-table-column prop="id" label="申请ID" width="80" />
        <el-table-column prop="uid" label="团长UID" width="100" />
        <el-table-column prop="applyAmount" label="申请金额" width="100" />
        <el-table-column prop="feeAmount" label="手续费" width="90" />
        <el-table-column prop="actualAmount" label="实际到账" width="100"><template slot-scope="{ row }"><span class="actual-amount">{{ row.actualAmount || row.applyAmount }}</span></template></el-table-column>
        <el-table-column prop="accountType" label="收款方式" width="100" />
        <el-table-column prop="accountName" label="收款人" width="110" />
        <el-table-column label="收款账号" min-width="200"><template slot-scope="{ row }"><span>{{ plainCards[row.id] || row.accountNo }}</span><el-button v-if="!plainCards[row.id]" type="text" size="mini" class="reveal-btn" @click="reveal(row)">查看完整卡号</el-button></template></el-table-column>
        <el-table-column label="状态" width="100"><template slot-scope="{ row }"><el-tag size="mini" :type="tagType(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column>
        <el-table-column prop="createTime" label="申请时间" min-width="155" />
        <el-table-column label="操作" width="190" fixed="right"><template slot-scope="{ row }"><el-button v-if="row.status === 0" type="text" size="small" @click="operate(row, 'approve')">审核通过</el-button><el-button v-if="row.status === 0 || row.status === 1" type="text" class="danger-text" size="small" @click="operate(row, 'reject')">驳回</el-button><el-button v-if="row.status === 1" type="text" size="small" @click="operate(row, 'paid')">确认已打款</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="420px"><el-form size="small"><el-form-item label="备注"><el-input v-model.trim="remark" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-form><div slot="footer"><el-button size="small" @click="dialogVisible = false">取消</el-button><el-button size="small" type="primary" :loading="saving" @click="confirm">确定</el-button></div></el-dialog>
  </div>
</template>

<script>
import { getLeaderWithdrawList, approveLeaderWithdraw, rejectLeaderWithdraw, markLeaderWithdrawPaid, getLeaderWithdrawCard } from '@/api/alliance';

export default {
  name: 'AllianceLeaderWithdraw',
  data() { return { status: null, list: [], loading: false, saving: false, dialogVisible: false, dialogTitle: '', remark: '', current: null, action: '', plainCards: {} }; },
  mounted() { this.load(); },
  methods: {
    statusText(status) { return ['待审核', '审核通过', '已打款', '已驳回', '已取消'][status] || '未知'; },
    tagType(status) { return status === 2 ? 'success' : status === 3 ? 'danger' : status === 0 ? 'warning' : ''; },
    load() { this.loading = true; this.plainCards = {}; getLeaderWithdrawList({ status: this.status, page: 1, size: 100 }).then((res) => { this.list = res.data || []; }).finally(() => { this.loading = false; }); },
    // 明文按需取：换页或重查后 plainCards 清空，卡号不会一直挂在页面上
    reveal(row) { getLeaderWithdrawCard(row.id).then((res) => { this.$set(this.plainCards, row.id, (res.data && res.data.cardNo) || row.accountNo); }); },
    operate(row, action) { this.current = row; this.action = action; this.remark = ''; this.dialogTitle = action === 'approve' ? '审核提现' : action === 'reject' ? '驳回提现' : '确认人工打款'; this.dialogVisible = true; },
    confirm() { this.saving = true; const fn = this.action === 'approve' ? approveLeaderWithdraw : this.action === 'reject' ? rejectLeaderWithdraw : markLeaderWithdrawPaid; fn(this.current.id, this.remark).then(() => { this.$message.success('操作成功'); this.dialogVisible = false; this.load(); }).finally(() => { this.saving = false; }); }
  }
};
</script>

<style scoped>
.actual-amount { color: #f56c6c; font-weight: 600; }
.reveal-btn { margin-left: 8px; }
</style>
