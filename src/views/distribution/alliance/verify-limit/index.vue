<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        按团长统一限制每日积分核销。该团长对所有用户共用每日扫码次数和积分额度，填 0 表示不限；只有状态为“启用”的配置会拦截核销。
      </div>

      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="团长uid">
          <el-input v-model.number="query.leaderUid" clearable class="selWidthSm" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable class="selWidthSm">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button type="success" @click="openCreate">新增配置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" size="small" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="团长" min-width="180">
          <template slot-scope="{ row }">
            <div>{{ userName(row.leaderUid) }}</div>
            <div class="sub-line">uid {{ row.leaderUid }}{{ userPhone(row.leaderUid) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="每日次数上限" width="130">
          <template slot-scope="{ row }">{{ row.dailyScanLimit > 0 ? row.dailyScanLimit : '不限' }}</template>
        </el-table-column>
        <el-table-column label="每日积分上限" width="130">
          <template slot-scope="{ row }">{{ row.dailyPointsLimit > 0 ? row.dailyPointsLimit : '不限' }}</template>
        </el-table-column>
        <el-table-column label="今日已用" min-width="150">
          <template slot-scope="{ row }">{{ today(row) ? (row.usedScanCount || 0) : 0 }} 次 / {{ today(row) ? (row.usedPoints || 0) : 0 }} 分</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openEdit(row)">修改</el-button>
            <el-button v-if="row.status === 1" type="text" size="small" class="danger-text" @click="disable(row)">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="query.size"
          :current-page="query.page"
          :total="total"
          @size-change="onSize"
          @current-change="load"
        />
      </div>
    </el-card>

    <el-dialog :title="form.id ? '修改核销限额' : '新增核销限额'" :visible.sync="dialogVisible" width="560px">
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
        <el-form-item label="团长uid" prop="leaderUid">
          <el-input v-model.number="form.leaderUid" :disabled="!!form.id" class="selWidth" />
        </el-form-item>
        <el-form-item label="每日扫码次数" prop="dailyScanLimit">
          <el-input-number v-model="form.dailyScanLimit" :min="0" :max="999999" controls-position="right" />
          <span class="hint">0 表示不限</span>
        </el-form-item>
        <el-form-item label="每日积分额度" prop="dailyPointsLimit">
          <el-input-number v-model="form.dailyPointsLimit" :min="0" :max="999999999" controls-position="right" />
          <span class="hint">0 表示不限</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getLeaderUserVerifyLimitList,
  saveLeaderUserVerifyLimit,
  disableLeaderUserVerifyLimit,
} from '@/api/alliance';

export default {
  name: 'AllianceVerifyLimit',
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      users: {},
      total: 0,
      query: { leaderUid: null, status: null, page: 1, size: 20 },
      dialogVisible: false,
      form: this.emptyForm(),
      rules: {
        leaderUid: [{ required: true, message: '请输入团长 uid', trigger: 'blur' }],
        dailyScanLimit: [{ required: true, message: '请输入每日次数上限', trigger: 'blur' }],
        dailyPointsLimit: [{ required: true, message: '请输入每日积分上限', trigger: 'blur' }],
      },
    };
  },
  created() {
    this.load(1);
  },
  methods: {
    emptyForm() {
      return { id: null, leaderUid: null, dailyScanLimit: 0, dailyPointsLimit: 0, status: 1 };
    },
    clean(query) {
      const params = {};
      Object.keys(query).forEach((key) => {
        const value = query[key];
        if (value !== '' && value !== null && value !== undefined && !Number.isNaN(value)) params[key] = value;
      });
      return params;
    },
    load(page) {
      if (page) this.query.page = page;
      this.loading = true;
      getLeaderUserVerifyLimitList(this.clean(this.query))
        .then((res) => {
          this.list = (res && res.list) || [];
          this.users = (res && res.users) || {};
          this.total = (res && res.total) || 0;
        })
        .finally(() => { this.loading = false; });
    },
    onSize(size) {
      this.query.size = size;
      this.load(1);
    },
    reset() {
      this.query = { leaderUid: null, status: null, page: 1, size: 20 };
      this.load(1);
    },
    userName(uid) {
      const user = this.users[uid];
      return user ? (user.nickname || '（未设置昵称）') : '查无此人';
    },
    userPhone(uid) {
      const user = this.users[uid];
      return user && user.phone ? ` · ${user.phone}` : '';
    },
    today(row) {
      if (!row.usageDate) return false;
      const value = String(row.usageDate).replace(/-/g, '/').slice(0, 10);
      const now = new Date();
      const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
      return value === today;
    },
    openCreate() {
      this.form = this.emptyForm();
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    openEdit(row) {
      this.form = {
        id: row.id,
        leaderUid: row.leaderUid,
        dailyScanLimit: Number(row.dailyScanLimit) || 0,
        dailyPointsLimit: Number(row.dailyPointsLimit) || 0,
        status: row.status === 1 ? 1 : 0,
      };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await saveLeaderUserVerifyLimit({
            id: this.form.id,
            leaderUid: Number(this.form.leaderUid),
            dailyScanLimit: Number(this.form.dailyScanLimit) || 0,
            dailyPointsLimit: Number(this.form.dailyPointsLimit) || 0,
            status: this.form.status,
          });
          this.$message.success('已保存');
          this.dialogVisible = false;
          this.load(1);
        } catch (e) {
          /* 拦截器已弹出错误 */
        } finally {
          this.saving = false;
        }
      });
    },
    disable(row) {
      this.$confirm('停用后该团长对所有用户不再受此限额限制，确定继续吗？', '提示', { type: 'warning' })
        .then(() => disableLeaderUserVerifyLimit(row.id))
        .then(() => { this.$message.success('已停用'); this.load(); })
        .catch(() => {});
    },
  },
};
</script>

<style scoped lang="scss">
.tips { color: #909399; font-size: 12px; line-height: 20px; margin-bottom: 12px; }
.sub-line { color: #909399; font-size: 12px; }
.pager { margin-top: 12px; text-align: right; }
.selWidthSm { width: 130px; }
.selWidth { width: 260px; }
.hint { color: #909399; margin-left: 10px; font-size: 12px; }
.danger-text { color: #f56c6c; }
</style>
