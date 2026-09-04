<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        两层取值：单品覆盖 &gt; 本页规则（区域专属 &gt; 平台默认）&gt; 全局默认，命中即停，不叠加。
        发布即版本化，改规则不回溯已按旧版本算过的订单。
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="状态">
          <el-select v-model="status" clearable placeholder="全部" class="selWidthSm" @change="loadList">
            <el-option label="草稿" :value="0" />
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadList">查询</el-button>
          <el-button type="success" @click="openDialog()">新建规则</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" size="small" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="ruleName" label="规则名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="适用区域" min-width="140">
          <template slot-scope="{ row }">{{ row.regionScope || '全平台' }}</template>
        </el-table-column>
        <el-table-column label="计算方式" width="100">
          <template slot-scope="{ row }">{{ row.calcMode === 2 ? '固定金额' : '比例' }}</template>
        </el-table-column>
        <el-table-column label="团长" width="110">
          <template slot-scope="{ row }">
            {{ row.calcMode === 2 ? fenToYuan(row.leaderFixed) + ' 元' : bpToPercent(row.leaderRatio) + '%' }}
          </template>
        </el-table-column>
        <el-table-column label="区域代理" width="110">
          <template slot-scope="{ row }">
            {{ row.calcMode === 2 ? fenToYuan(row.agentFixed) + ' 元' : bpToPercent(row.agentRatio) + '%' }}
          </template>
        </el-table-column>
        <el-table-column label="生效区间" min-width="200">
          <template slot-scope="{ row }">
            {{ row.startTime || '不限' }} ~ {{ row.endTime || '不限' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button v-if="row.status !== 1" type="text" size="small" @click="onPublish(row)">发布</el-button>
            <el-button v-if="row.status === 1" type="text" size="small" @click="onDisable(row)">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="form.id ? '编辑规则' : '新建规则'" :visible.sync="dialogVisible" width="640px">
      <el-form ref="form" :model="form" :rules="rules" label-width="130px" size="small">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model.trim="form.ruleName" maxlength="64" class="selWidth" />
        </el-form-item>
        <el-form-item label="适用区域编码">
          <el-cascader v-model="form.regionIds" :options="cityOptions" :props="cascaderProps" clearable class="selWidth" placeholder="请选择省/市/区（不选表示全平台）" @change="onRegionChange" />
        </el-form-item>
        <el-form-item label="计算方式" prop="calcMode">
          <el-radio-group v-model="form.calcMode" @change="onCalcModeChange">
            <el-radio :label="1">按比例</el-radio>
            <el-radio :label="2">固定金额</el-radio>
          </el-radio-group>
          <div class="hint">同一规则只能选其一，另一种的取值会被后端要求为 0</div>
        </el-form-item>
        <template v-if="form.calcMode === 1">
          <el-form-item label="区域代理比例">
            <el-input-number v-model="form.agentPercent" :min="0" :max="100" :precision="2" class="selWidth" />
            <span class="unit">%</span>
          </el-form-item>
          <el-form-item label="团长比例">
            <el-input-number v-model="form.leaderPercent" :min="0" :max="100" :precision="2" class="selWidth" />
            <span class="unit">%</span>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="团长固定金额">
            <el-input-number v-model="form.leaderFixedYuan" :min="0" :precision="2" class="selWidth" />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="代理固定金额">
            <el-input-number v-model="form.agentFixedYuan" :min="0" :precision="2" class="selWidth" />
            <span class="unit">元</span>
          </el-form-item>
        </template>
        <el-form-item label="生效区间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="yyyy-MM-dd HH:mm:ss"
            range-separator="~"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
          <div class="hint">同分类/活动/区域的规则时间区间不得重叠，发布时会校验</div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submit">保存草稿</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRuleList, saveRule, publishRule, disableRule } from '@/api/alliance';
import request from '@/utils/request';
const cityListTree = () => request({ url: '/admin/merchant/city/region/city/tree', method: 'get' });

export default {
  name: 'AllianceCommissionRule',
  data() {
    return {
      loading: false,
      saving: false,
      status: null,
      list: [],
      dialogVisible: false,
      timeRange: [],
      cityOptions: [],
      cascaderProps: { value: 'id', label: 'name', children: 'child', checkStrictly: true, emitPath: true },
      form: this.emptyForm(),
      rules: {
        ruleName: [{ required: true, message: '请填写规则名称', trigger: 'blur' }],
        calcMode: [{ required: true, message: '请选择计算方式', trigger: 'change' }],
      },
    };
  },
  created() {
    this.loadCityTree();
    this.loadList();
  },
  methods: {
    async loadCityTree() { try { const res = await cityListTree(); const list = Array.isArray(res) ? res : (res && res.list) || []; this.cityOptions = this.normalizeTree(list); } catch (e) { this.cityOptions = []; } },
    normalizeTree(list, depth = 1) { if (!Array.isArray(list)) return []; return list.map(n => { const item = { id: String(n.regionId != null ? n.regionId : n.id), name: n.regionName || n.name }; const children = n.child || n.children; if (depth < 3 && Array.isArray(children) && children.length) item.child = this.normalizeTree(children, depth + 1); return item; }); },
    onRegionChange(value) { this.form.regionScope = value && value.length ? value[value.length - 1] : ''; },
    emptyForm() {
      return {
        id: null,
        ruleName: '',
        regionScope: '',
        calcMode: 1,
        leaderPercent: 0,
        agentPercent: 0,
        leaderFixedYuan: 0,
        agentFixedYuan: 0,
        regionIds: [],
      };
    },
    // 后端存万分比，页面按百分比展示：1000 → 10%
    bpToPercent(bp) {
      return ((bp || 0) / 100).toFixed(2);
    },
    fenToYuan(fen) {
      return ((fen || 0) / 100).toFixed(2);
    },
    statusText(s) {
      return { 0: '草稿', 1: '启用', 2: '停用' }[s] || '-';
    },
    statusTagType(s) {
      return { 0: 'info', 1: 'success', 2: 'danger' }[s] || 'info';
    },
    async loadList() {
      this.loading = true;
      try {
        const res = await getRuleList(this.status === null ? undefined : this.status);
        this.list = Array.isArray(res) ? res : [];
      } catch (e) {
        /* 拦截器已弹过错误 */
      } finally {
        this.loading = false;
      }
    },
    onCalcModeChange() {
      // 切换计算方式时清掉另一种的取值，否则保存会被后端的互斥校验挡下
      if (this.form.calcMode === 1) {
        this.form.leaderFixedYuan = 0;
        this.form.agentFixedYuan = 0;
      } else {
        this.form.leaderPercent = 0;
        this.form.agentPercent = 0;
      }
    },
    openDialog(row) {
      if (row) {
        this.form = {
          id: row.id,
          ruleName: row.ruleName,
          regionScope: row.regionScope || '',
          calcMode: row.calcMode || 1,
          leaderPercent: Number(this.bpToPercent(row.leaderRatio)),
          agentPercent: Number(this.bpToPercent(row.agentRatio)),
          leaderFixedYuan: Number(this.fenToYuan(row.leaderFixed)),
          agentFixedYuan: Number(this.fenToYuan(row.agentFixed)),
          regionIds: row.regionScope ? [String(row.regionScope)] : [],
        };
        this.timeRange = row.startTime && row.endTime ? [row.startTime, row.endTime] : [];
      } else {
        this.form = this.emptyForm();
        this.timeRange = [];
      }
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        const f = this.form;
        const payload = {
          id: f.id,
          ruleName: f.ruleName,
          regionScope: f.regionScope,
          categoryId: 0,
          calcMode: f.calcMode,
          leaderRatio: f.calcMode === 1 ? Math.round(f.leaderPercent * 100) : 0,
          agentRatio: f.calcMode === 1 ? Math.round(f.agentPercent * 100) : 0,
          leaderFixed: f.calcMode === 2 ? Math.round(f.leaderFixedYuan * 100) : 0,
          agentFixed: f.calcMode === 2 ? Math.round(f.agentFixedYuan * 100) : 0,
          startTime: this.timeRange && this.timeRange.length ? this.timeRange[0] : null,
          endTime: this.timeRange && this.timeRange.length ? this.timeRange[1] : null,
        };
        this.saving = true;
        try {
          await saveRule(payload);
          this.$message.success('已保存草稿，发布后才会生效');
          this.dialogVisible = false;
          this.loadList();
        } catch (e) {
          /* 拦截器已弹过错误 */
        } finally {
          this.saving = false;
        }
      });
    },
    async onPublish(row) {
      try {
        await this.$confirm(`发布「${row.ruleName}」后会生成不可变版本号，确认？`, '提示', { type: 'warning' });
      } catch (e) {
        return;
      }
      try {
        await publishRule(row.id);
        this.$message.success('已发布');
        this.loadList();
      } catch (e) {
        /* 拦截器已弹过错误 */
      }
    },
    async onDisable(row) {
      try {
        await this.$confirm(`停用「${row.ruleName}」？已按该规则算过的订单不受影响`, '提示', { type: 'warning' });
      } catch (e) {
        return;
      }
      try {
        await disableRule(row.id);
        this.$message.success('已停用');
        this.loadList();
      } catch (e) {
        /* 拦截器已弹过错误 */
      }
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
.hint {
  color: #999;
  font-size: 12px;
  line-height: 18px;
}
.unit {
  margin-left: 6px;
  color: #666;
}
</style>
