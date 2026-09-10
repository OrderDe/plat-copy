<template>
  <div class="divBox lottery-page">
    <el-card shadow="never" :bordered="false" class="filter-card">
      <el-form :inline="true" size="small" @submit.native.prevent>
        <el-form-item label="活动名称">
          <el-input v-model.trim="filters.name" clearable placeholder="请输入活动名称" @keyup.enter.native="query" />
        </el-form-item>
        <el-form-item label="活动状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 150px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="filters.date"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="query">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :bordered="false" class="table-card">
      <div class="toolbar">
        <el-button type="primary" icon="el-icon-plus" @click="createActivity">新增活动</el-button>
        <el-button icon="el-icon-download" @click="exportData">导出</el-button>
        <span class="toolbar-tip">大转盘活动支持积分、优惠券和商品等奖励</span>
      </div>
      <el-table v-loading="loading" :data="pagedActivities" size="small" border stripe>
        <el-table-column type="index" label="序号" width="65" align="center" />
        <el-table-column prop="id" label="活动 ID" width="90" align="center" />
        <el-table-column prop="name" label="活动名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="extraChance" label="额外抽奖机会" min-width="110" align="center" />
        <el-table-column label="活动时间" min-width="190">
          <template slot-scope="scope">
            <div>{{ scope.row.startTime }}</div>
            <div>{{ scope.row.endTime }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="participants" label="参与人数" width="90" align="center" />
        <el-table-column prop="visits" label="访问次数" width="90" align="center" />
        <el-table-column prop="winners" label="中奖人数" width="90" align="center" />
        <el-table-column label="显示" width="80" align="center">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.visible" active-color="#13ce66" @change="toggleVisible(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusType(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="270" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="copyActivity(scope.row)">复制活动</el-button>
            <el-button type="text" size="small" @click="editActivity(scope.row)">编辑</el-button>
            <el-button type="text" size="small" class="danger-text" @click="removeActivity(scope.row)">删除</el-button>
            <el-dropdown trigger="click" @command="handleCommand($event, scope.row)">
              <el-button type="text" size="small">更多<i class="el-icon-arrow-down el-icon--right" /></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="preset">预设中奖信息</el-dropdown-item>
                <el-dropdown-item command="code">推广码</el-dropdown-item>
                <el-dropdown-item command="chance">修改抽奖次数</el-dropdown-item>
                <el-dropdown-item command="log">抽奖次数变更明细</el-dropdown-item>
                <el-dropdown-item command="users">参与用户</el-dropdown-item>
                <el-dropdown-item command="winners">中奖数据</el-dropdown-item>
                <el-dropdown-item command="prizes">奖品数据</el-dropdown-item>
                <el-dropdown-item command="detail">转盘详情</el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'running'" command="end">提前结束</el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'ended'" command="restart">重新启动</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          background
          :current-page="page"
          :page-size="limit"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredActivities.length"
          @size-change="changeLimit"
          @current-change="changePage"
        />
      </div>
    </el-card>

    <el-dialog title="预设中奖信息" :visible.sync="presetVisible" width="440px" @closed="resetPreset">
      <el-form ref="presetForm" :model="presetForm" label-width="100px" size="small">
        <el-form-item label="中奖等级" required>
          <el-select v-model="presetForm.level" placeholder="请选择" style="width: 240px">
            <el-option v-for="item in prizeLevels" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户 ID" required>
          <el-input v-model.trim="presetForm.userId" placeholder="请输入用户 ID" style="width: 240px" />
        </el-form-item>
        <el-form-item label="预设详情">
          <el-input v-model="presetForm.detail" type="textarea" :rows="3" placeholder="可填写中奖说明" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="presetVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="savePreset">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="修改抽奖次数" :visible.sync="chanceVisible" width="500px" @closed="resetChance">
      <el-form :model="chanceForm" label-width="125px" size="small">
        <el-form-item label="授权手机号查询">
          <el-input v-model.trim="chanceForm.mobile" placeholder="请输入用户手机号" style="width: 220px">
            <el-button slot="append" icon="el-icon-search" @click="findUser" />
          </el-input>
        </el-form-item>
        <el-form-item label="当前额外抽奖次数">
          <el-input v-model="chanceForm.current" disabled style="width: 220px" />
        </el-form-item>
        <el-form-item label="修改次数">
          <el-input v-model.number="chanceForm.change" type="number" placeholder="增加填正数，减少填负数" style="width: 220px" />
        </el-form-item>
        <p class="form-tip">减少次数时请输入负数，例如：-2</p>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="chanceVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="saveChance">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="抽奖次数变更明细" :visible.sync="logVisible" width="900px">
      <el-table :data="changeLogs" border stripe size="small">
        <el-table-column prop="id" label="编号" width="70" />
        <el-table-column prop="user" label="用户信息" min-width="150" />
        <el-table-column prop="amount" label="变更数量" width="90" />
        <el-table-column prop="type" label="变更类型" width="120" />
        <el-table-column prop="description" label="变更描述" min-width="170" />
        <el-table-column prop="time" label="变更时间" min-width="160" />
        <el-table-column prop="operator" label="操作人" width="100" />
      </el-table>
      <span slot="footer"><el-button size="small" @click="logVisible = false">关闭</el-button></span>
    </el-dialog>

    <el-dialog title="推广码" :visible.sync="codeVisible" width="420px">
      <div class="code-dialog">
        <div class="code-placeholder">
          <div class="code-grid">
            <i v-for="n in 36" :key="n" :class="{ dark: (n * 7 + n % 5) % 3 !== 0 }" />
          </div>
        </div>
        <div class="code-caption">{{ activeActivity ? activeActivity.name : '大转盘活动' }}</div>
        <p>扫码进入活动页面</p>
      </div>
      <span slot="footer">
        <el-button size="small" @click="codeVisible = false">关闭</el-button>
        <el-button type="primary" size="small" @click="downloadCode">下载图片</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
const STORAGE_KEY = 'platform-lottery-activities';

export default {
  name: 'LotteryList',
  data() {
    return {
      loading: false,
      page: 1,
      limit: 10,
      filters: { name: '', status: '', date: [] },
      statusOptions: [
        { label: '未开始', value: 'pending' },
        { label: '进行中', value: 'running' },
        { label: '已结束', value: 'ended' },
      ],
      activities: [],
      presetVisible: false,
      chanceVisible: false,
      logVisible: false,
      codeVisible: false,
      activeActivity: null,
      presetForm: { level: '', userId: '', detail: '' },
      chanceForm: { mobile: '', current: 0, change: '' },
      prizeLevels: ['一等奖', '二等奖', '三等奖', '四等奖'],
      changeLogs: [],
    };
  },
  computed: {
    filteredActivities() {
      const name = this.filters.name.toLowerCase();
      return this.activities.filter((item) => {
        const matchName = !name || item.name.toLowerCase().indexOf(name) > -1;
        const matchStatus = !this.filters.status || item.status === this.filters.status;
        const matchDate = !this.filters.date || this.filters.date.length !== 2 || this.overlapDate(item);
        return matchName && matchStatus && matchDate;
      });
    },
    pagedActivities() {
      const start = (this.page - 1) * this.limit;
      return this.filteredActivities.slice(start, start + this.limit);
    },
  },
  created() {
    this.loadActivities();
  },
  methods: {
    loadActivities() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.activities = JSON.parse(saved);
        } catch (e) {
          this.activities = [];
        }
      }
      if (!this.activities.length) {
        this.activities = [
          { id: 10001, name: '幸运大转盘', extraChance: '活动开始后', startTime: '2026-09-03 00:00:00', endTime: '2026-10-31 23:59:59', participants: 0, visits: 1, winners: 0, visible: true, status: 'running' },
          { id: 10002, name: '新客有礼', extraChance: '购买指定商品', startTime: '2026-08-01 00:00:00', endTime: '2026-08-31 23:59:59', participants: 12, visits: 142, winners: 12, visible: true, status: 'ended' },
        ];
        this.persist();
      }
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activities));
    },
    overlapDate(item) {
      const start = new Date(this.filters.date[0]).getTime();
      const end = new Date(`${this.filters.date[1]} 23:59:59`).getTime();
      return new Date(item.endTime.replace(/-/g, '/')).getTime() >= start && new Date(item.startTime.replace(/-/g, '/')).getTime() <= end;
    },
    query() {
      this.page = 1;
    },
    reset() {
      this.filters = { name: '', status: '', date: [] };
      this.page = 1;
    },
    changePage(page) {
      this.page = page;
    },
    changeLimit(limit) {
      this.limit = limit;
      this.page = 1;
    },
    statusLabel(status) {
      const item = this.statusOptions.find((option) => option.value === status);
      return item ? item.label : '未开始';
    },
    statusType(status) {
      return status === 'running' ? 'success' : status === 'ended' ? 'info' : 'warning';
    },
    createActivity() {
      this.$router.push('/marketing/lottery/create');
    },
    editActivity(row) {
      this.$router.push(`/marketing/lottery/create/${row.id}`);
    },
    copyActivity(row) {
      const copy = JSON.parse(JSON.stringify(row));
      copy.id = Math.max.apply(null, this.activities.map((item) => Number(item.id))) + 1;
      copy.name = `${row.name}（副本）`;
      copy.status = 'pending';
      copy.visible = false;
      this.activities.unshift(copy);
      this.persist();
      this.$message.success('活动已复制');
    },
    removeActivity(row) {
      this.$confirm(`确定删除“${row.name}”吗？删除后不可恢复。`, '提示', { type: 'warning' }).then(() => {
        this.activities = this.activities.filter((item) => item.id !== row.id);
        this.persist();
        this.$message.success('删除成功');
      }).catch(() => {});
    },
    toggleVisible(row) {
      this.persist();
      this.$message.success(row.visible ? '活动已显示' : '活动已隐藏');
    },
    changeStatus(row, status) {
      row.status = status;
      this.persist();
      this.$message.success(status === 'ended' ? '活动已提前结束' : '活动已重新启动');
    },
    handleCommand(command, row) {
      this.activeActivity = row;
      if (command === 'preset') this.presetVisible = true;
      else if (command === 'chance') this.chanceVisible = true;
      else if (command === 'log') this.openLogs();
      else if (command === 'code') this.codeVisible = true;
      else if (command === 'detail') this.editActivity(row);
      else if (command === 'end') this.changeStatus(row, 'ended');
      else if (command === 'restart') this.changeStatus(row, 'running');
      else this.$message.info(`${this.commandLabel(command)}功能已预留，待接口接入`);
    },
    commandLabel(command) {
      const labels = { users: '参与用户', winners: '中奖数据', prizes: '奖品数据' };
      return labels[command] || '该';
    },
    savePreset() {
      if (!this.presetForm.level || !this.presetForm.userId) {
        this.$message.warning('请填写中奖等级和用户 ID');
        return;
      }
      this.presetVisible = false;
      this.$message.success('预设中奖信息已保存');
    },
    resetPreset() {
      this.presetForm = { level: '', userId: '', detail: '' };
    },
    findUser() {
      if (!this.chanceForm.mobile) {
        this.$message.warning('请输入手机号');
        return;
      }
      this.chanceForm.current = 0;
      this.$message.success('已查询到用户');
    },
    saveChance() {
      const amount = Number(this.chanceForm.change);
      if (!this.chanceForm.mobile || !amount) {
        this.$message.warning('请输入手机号和修改次数');
        return;
      }
      if (this.chanceForm.current + amount < 0) {
        this.$message.warning('抽奖次数不能小于 0');
        return;
      }
      this.changeLogs.unshift({ id: Date.now(), user: this.chanceForm.mobile, amount, type: amount > 0 ? '增加' : '减少', description: '后台手动调整抽奖次数', time: this.formatTime(new Date()), operator: '当前管理员' });
      this.chanceVisible = false;
      this.$message.success('抽奖次数修改成功');
    },
    resetChance() {
      this.chanceForm = { mobile: '', current: 0, change: '' };
    },
    openLogs() {
      this.logVisible = true;
    },
    downloadCode() {
      this.$message.success('推广码图片已生成（接入小程序码服务后可下载）');
    },
    formatTime(date) {
      const pad = (value) => (`0${value}`).slice(-2);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    exportData() {
      const header = '活动ID,活动名称,额外抽奖机会,活动时间,参与人数,访问次数,中奖人数,状态';
      const rows = this.filteredActivities.map((item) => [item.id, item.name, item.extraChance, `${item.startTime} 至 ${item.endTime}`, item.participants, item.visits, item.winners, this.statusLabel(item.status)].join(','));
      const blob = new Blob([`\ufeff${[header].concat(rows).join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = '大转盘活动.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    },
  },
};
</script>

<style scoped lang="scss">
.lottery-page {
  .filter-card,
  .table-card {
    border-radius: 4px;
  }
  .table-card {
    margin-top: 14px;
  }
  .toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 18px;
  }
  .toolbar-tip {
    margin-left: 14px;
    color: #909399;
    font-size: 12px;
  }
  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
  .danger-text {
    color: #f56c6c;
  }
  .form-tip {
    margin: -8px 0 0 125px;
    color: #909399;
    font-size: 12px;
  }
  .code-dialog {
    text-align: center;
  }
  .code-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 220px;
    height: 220px;
    padding: 12px;
    border: 1px solid #ebeef5;
    background: #fff;
  }
  .code-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(6, 1fr);
    width: 188px;
    height: 188px;
    gap: 3px;
  }
  .code-grid i {
    display: block;
    border-radius: 1px;
    background: #f3f5f7;
  }
  .code-grid i.dark {
    background: #1f2d3d;
  }
  .code-caption {
    margin-top: 12px;
    color: #303133;
    font-size: 14px;
  }
  .code-dialog p {
    margin: 6px 0 0;
    color: #909399;
    font-size: 12px;
  }
}
</style>
