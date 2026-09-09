<template>
  <div class="divBox">
    <el-card shadow="never" :bordered="false">
      <div class="tips">
        消费者要成为团长必须先满足这里配置的<b>全部</b>条件（不是满足一条即可）。
        一条都不启用时等于谁都能申请。<br />
        条件不达标时，小程序的申请页会逐条列出「要求 / 当前值」并标出卡在哪一项 ——
        所以文案请写成消费者看得懂的话。
      </div>

      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新增条件</el-button>

      <el-table v-loading="loading" :data="list" border size="small" class="mt14">
        <el-table-column prop="sort" label="顺序" width="70" />
        <el-table-column label="指标" min-width="130">
          <template slot-scope="{ row }">{{ metricTitle(row.metric) }}</template>
        </el-table-column>
        <el-table-column label="条件" min-width="150">
          <template slot-scope="{ row }">
            {{ operatorText(row.operator) }} {{ thresholdText(row) }}
          </template>
        </el-table-column>
        <el-table-column label="展示文案" min-width="200">
          <template slot-scope="{ row }">
            <span v-if="row.label">{{ row.label }}</span>
            <span v-else class="hint">（用默认文案）</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.enabled === 1 ? 'success' : 'info'">
              {{ row.enabled === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openDialog(row)">修改</el-button>
            <el-button type="text" size="small" @click="toggle(row)">
              {{ row.enabled === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button type="text" size="small" class="danger-text" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="form.id ? '修改条件' : '新增条件'" :visible.sync="dialogVisible" width="560px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="指标" prop="metric">
          <el-select v-model="form.metric" class="selWidth" @change="onMetricChange">
            <el-option v-for="m in metrics" :key="m.value" :label="m.title" :value="m.value" />
          </el-select>
          <div class="hint">
            指标决定「这个数从哪来」。要加新指标需要后端支持取数，配置页只能选已支持的。
          </div>
        </el-form-item>
        <el-form-item label="比较" prop="operator">
          <el-radio-group v-model="form.operator">
            <el-radio label="GTE">不少于</el-radio>
            <el-radio label="LTE">不超过</el-radio>
            <el-radio label="EQ">等于</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold" v-if="currentUnit !== 'BOOLEAN'">
          <el-input-number v-model="form.threshold" :min="0" :precision="0" class="selWidth" />
          <div class="hint" v-if="currentUnit === 'MONEY'">
            以<b>分</b>为单位的整数，例如 100000 表示 1000 元
            <span v-if="form.threshold > 0" class="ratio-preview">
              当前填的是 {{ (form.threshold / 100).toFixed(2) }} 元
            </span>
          </div>
          <div class="hint" v-else-if="currentUnit === 'DAY'">天数</div>
          <div class="hint" v-else>整数</div>
        </el-form-item>
        <el-form-item label="展示文案">
          <el-input v-model.trim="form.label" maxlength="128" class="selWidth"
                    placeholder="留空则用默认文案" />
          <div class="hint">
            消费者在申请页看到的话。「累计消费满 1000 元」比「累计实付金额 ≥ 100000」好懂得多。
          </div>
        </el-form-item>
        <el-form-item label="顺序">
          <el-input-number v-model="form.sort" :min="0" :precision="0" class="selWidth" />
          <div class="hint">越小越靠前</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model.trim="form.remark" maxlength="255" class="selWidth"
                    placeholder="只给运营看，不展示给消费者" />
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
import {
  getLeaderApplyRules,
  getLeaderApplyMetrics,
  saveLeaderApplyRule,
  deleteLeaderApplyRule,
} from '@/api/alliance';

export default {
  name: 'AllianceLeaderApplyRule',
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      metrics: [],
      dialogVisible: false,
      form: this.emptyForm(),
      rules: {
        metric: [{ required: true, message: '请选择指标', trigger: 'change' }],
        operator: [{ required: true, message: '请选择比较方式', trigger: 'change' }],
      },
    };
  },
  computed: {
    /** 当前指标的单位，决定阈值那一栏怎么提示、要不要显示 */
    currentUnit() {
      const hit = this.metrics.find((m) => m.value === this.form.metric);
      return hit ? hit.unit : 'COUNT';
    },
  },
  created() {
    this.loadMetrics();
    this.load();
  },
  methods: {
    emptyForm() {
      return { id: null, metric: '', operator: 'GTE', threshold: 0, label: '', enabled: 1, sort: 0, remark: '' };
    },
    loadMetrics() {
      getLeaderApplyMetrics()
        .then((res) => { this.metrics = (Array.isArray(res) ? res : res && res.list) || []; })
        .catch(() => { this.metrics = []; });
    },
    load() {
      this.loading = true;
      getLeaderApplyRules()
        .then((res) => { this.list = Array.isArray(res) ? res : []; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    },
    metricTitle(value) {
      const hit = this.metrics.find((m) => m.value === value);
      // 指标被后端下掉时列表里还留着这条规则，显示原始编码而不是空白，
      // 否则运营看到一行没有指标的规则完全不知道那是什么
      return hit ? hit.title : value;
    },
    operatorText(op) {
      return { GTE: '不少于', LTE: '不超过', EQ: '等于' }[op] || op;
    },
    thresholdText(row) {
      const hit = this.metrics.find((m) => m.value === row.metric);
      const unit = hit ? hit.unit : 'COUNT';
      if (unit === 'BOOLEAN') return '（是）';
      if (unit === 'MONEY') return ((row.threshold || 0) / 100).toFixed(2) + ' 元';
      if (unit === 'DAY') return (row.threshold || 0) + ' 天';
      return String(row.threshold || 0);
    },
    onMetricChange() {
      // 布尔指标没有阈值可填，固定成 1（「是」）
      if (this.currentUnit === 'BOOLEAN') {
        this.form.threshold = 1;
        this.form.operator = 'GTE';
      }
    },
    openDialog(row) {
      this.form = row ? { ...row } : this.emptyForm();
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await saveLeaderApplyRule(this.form);
          this.$message.success('保存成功');
          this.dialogVisible = false;
          this.load();
        } catch (e) {
          /* 拦截器已弹过错误 */
        } finally {
          this.saving = false;
        }
      });
    },
    async toggle(row) {
      try {
        await saveLeaderApplyRule({ ...row, enabled: row.enabled === 1 ? 0 : 1 });
        this.load();
      } catch (e) {
        /* 拦截器已弹过错误 */
      }
    },
    async remove(row) {
      try {
        await this.$confirm('删除后该条件立即不再校验，确定删除？', '提示', { type: 'warning' });
        await deleteLeaderApplyRule(row.id);
        this.$message.success('已删除');
        this.load();
      } catch (e) {
        /* 取消或拦截器已弹过错误 */
      }
    },
  },
};
</script>

<style scoped lang="scss">
.tips {
  margin-bottom: 12px;
  padding: 8px 12px;
  color: #666;
  font-size: 12px;
  line-height: 1.8;
  background: #f8f8f9;
  border-radius: 4px;
}
.mt14 {
  margin-top: 14px;
}
.hint {
  color: #999;
  font-size: 12px;
  line-height: 18px;
}
.ratio-preview {
  margin-left: 8px;
  color: #409eff;
}
.danger-text {
  color: #f56c6c;
}
</style>
