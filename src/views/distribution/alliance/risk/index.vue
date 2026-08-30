<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        待处理风险事件按等级倒序。处理只改事件状态，不会自动回滚已产生的积分或分成 ——
        需要冲正的走对应业务单据。
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="条数上限">
          <el-input-number v-model="limit" :min="10" :max="200" :step="10" class="selWidthSm" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadList">刷新</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" size="small" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="等级" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="levelTagType(row.level)">{{ levelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险类型" min-width="140">
          <template slot-scope="{ row }">{{ riskTypeText(row.riskType) }}</template>
        </el-table-column>
        <el-table-column label="主体" min-width="140">
          <template slot-scope="{ row }">{{ subjectTypeText(row.subjectType) }} #{{ row.subjectId }}</template>
        </el-table-column>
        <el-table-column prop="bizNo" label="业务单号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="action" label="系统动作" width="100" />
        <el-table-column prop="evidence" label="证据" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="发生时间" min-width="150" />
        <el-table-column label="操作" width="90" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openDialog(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="处理风险事件" :visible.sync="dialogVisible" width="560px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="事件">
          #{{ current.id }}　{{ riskTypeText(current.riskType) }}　{{ levelText(current.level) }}
        </el-form-item>
        <el-form-item label="证据">
          <div class="evidence">{{ current.evidence || '-' }}</div>
        </el-form-item>
        <el-form-item label="处理结论" prop="status">
          <el-select v-model="form.status" class="selWidth">
            <el-option label="已拦截" :value="1" />
            <el-option label="审核中" :value="2" />
            <el-option label="确认风险" :value="3" />
            <el-option label="误报" :value="4" />
            <el-option label="已关闭" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getPendingRisks, handleRisk } from '@/api/alliance';

const RISK_TYPE = {
  SELF_INVITE: '自邀请',
  CODE_BRUTE: '核销码爆破',
  HIGH_FREQ_VERIFY: '高频核销',
  TEAM_FARMING: '刷团刷单',
  REGION_CONCENTRATION: '区域集中度异常',
  AD_FRAUD: '广告作弊',
  COST_CAP: '成本触顶',
};
const SUBJECT_TYPE = {
  USER: '用户',
  MERCHANT: '商户',
  STAFF: '店员',
  TEAM: '团队',
  REGION: '区域',
  AD_ACCOUNT: '广告账户',
};

export default {
  name: 'AllianceRisk',
  data() {
    return {
      loading: false,
      saving: false,
      limit: 50,
      list: [],
      dialogVisible: false,
      current: {},
      form: { status: 3, remark: '' },
      rules: {
        status: [{ required: true, message: '请选择处理结论', trigger: 'change' }],
        remark: [{ required: true, message: '请填写处理备注', trigger: 'blur' }],
      },
    };
  },
  created() {
    this.loadList();
  },
  methods: {
    riskTypeText(t) {
      return RISK_TYPE[t] || t || '-';
    },
    subjectTypeText(t) {
      return SUBJECT_TYPE[t] || t || '-';
    },
    levelText(l) {
      return { 1: '提示', 2: '告警', 3: '拦截' }[l] || '-';
    },
    levelTagType(l) {
      return { 1: 'info', 2: 'warning', 3: 'danger' }[l] || 'info';
    },
    async loadList() {
      this.loading = true;
      try {
        const res = await getPendingRisks(this.limit);
        this.list = Array.isArray(res) ? res : [];
      } catch (e) {
        /* 拦截器已弹过错误 */
      } finally {
        this.loading = false;
      }
    },
    openDialog(row) {
      this.current = row;
      this.form = { status: 3, remark: '' };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await handleRisk(this.current.id, this.form.status, this.form.remark);
          this.$message.success('已处理');
          this.dialogVisible = false;
          this.loadList();
        } catch (e) {
          /* 拦截器已弹过错误 */
        } finally {
          this.saving = false;
        }
      });
    },
  },
};
</script>

<style scoped lang="scss">
.selWidth {
  width: 260px;
}
.selWidthSm {
  width: 140px;
}
.tips {
  color: #999;
  font-size: 13px;
  line-height: 20px;
  margin-bottom: 12px;
}
.evidence {
  color: #666;
  font-size: 12px;
  line-height: 18px;
  word-break: break-all;
  max-height: 120px;
  overflow: auto;
}
</style>
