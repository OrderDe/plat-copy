<template>
  <div class="app-container">
    <div class="page-header">
      <div class="page-title">审批流配置</div>
      <div class="page-sub">
        管理所有业务的审批流程 · 共 {{ list.length }} 条
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" size="small">
        <el-form-item label="关键字">
          <el-input v-model="keyword" placeholder="业务名称/流程标识" clearable style="width: 240px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px;">
            <el-option label="草稿" :value="0" />
            <el-option label="已部署" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-refresh" @click="load">刷新</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="openAdd">新增业务</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="filtered" style="margin-top: 12px;" v-loading="loading" @row-click="goDetail">
      <el-table-column label="业务名称" prop="flowName" min-width="180" />
      <el-table-column label="流程标识" width="200">
        <template slot-scope="{ row }">
          <code class="code">{{ row.flowKey }}</code>
        </template>
      </el-table-column>
      <el-table-column label="节点数" width="90" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini">{{ (row.nodes && row.nodes.length) || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{ row }">
          <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '已部署' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="部署ID" width="180" show-overflow-tooltip>
        <template slot-scope="{ row }">
          <span style="font-size: 12px; color: #909399;">{{ row.deploymentId || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template slot-scope="{ row }">
          <el-button type="text" @click.stop="goDetail(row)">查看/编辑</el-button>
          <el-button type="text" @click.stop="quickDeploy(row)" v-if="(row.nodes && row.nodes.length)">部署</el-button>
          <el-button type="text" style="color:#f56c6c;" @click.stop="deleteRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增业务弹窗 -->
    <el-dialog title="新增业务类型" :visible.sync="dialogVisible" width="460px">
      <el-form :model="newBiz" label-width="100px" size="small">
        <el-form-item label="业务名称" required>
          <el-input v-model="newBiz.flowName" placeholder="如: 合同审批" />
        </el-form-item>
        <el-form-item label="流程标识" required>
          <el-input v-model="newBiz.flowKey" placeholder="英文, 如: contract_approve" />
          <div class="tip">必须字母开头,只允许字母/数字/下划线</div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newBiz.description" type="textarea" :rows="2" placeholder="说明该流程用途" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">创建并编辑</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listFlowConfig, createBiz, deleteFlow, deployFlow } from '@/api/approvalFlow';

export default {
  name: 'ApprovalConfig',
  data() {
    return {
      list: [],
      loading: false,
      keyword: '',
      statusFilter: '',
      dialogVisible: false,
      newBiz: { flowName: '', flowKey: '', description: '' },
    };
  },
  computed: {
    filtered() {
      return this.list.filter(r => {
        if (this.keyword && !((r.flowName || '') + (r.flowKey || '')).includes(this.keyword)) return false;
        if (this.statusFilter !== '' && this.statusFilter !== null && r.status !== this.statusFilter) return false;
        return true;
      });
    },
  },
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await listFlowConfig();
        const data = res && (res.data !== undefined ? res.data : res);
        this.list = Array.isArray(data) ? data : [];
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
        this.list = [];
      } finally {
        this.loading = false;
      }
    },
    goDetail(row) {
      this.$router.push(`/approvalCenter/config/detail/${row.flowKey}`);
    },
    openAdd() {
      this.newBiz = { flowName: '', flowKey: '', description: '' };
      this.dialogVisible = true;
    },
    async submitAdd() {
      const { flowName, flowKey } = this.newBiz;
      if (!flowName || !flowKey) return this.$message.warning('请填写完整');
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(flowKey)) {
        return this.$message.warning('流程标识必须字母开头,只允许字母/数字/下划线');
      }
      if (this.list.find(b => b.flowKey === flowKey)) return this.$message.warning('流程标识已存在');
      try {
        await createBiz(this.newBiz);
        this.dialogVisible = false;
        this.$message.success('已创建');
        // 直接跳到编辑页
        this.$router.push(`/approvalCenter/config/detail/${flowKey}`);
      } catch (e) {
        this.$message.error('创建失败: ' + (e.message || e));
      }
    },
    async quickDeploy(row) {
      try {
        const res = await deployFlow(row.flowKey);
        const deploymentId = res && (res.data !== undefined ? res.data : res);
        this.$message.success('已部署, deploymentId=' + deploymentId);
        this.load();
      } catch (e) {
        this.$message.error('部署失败: ' + (e.message || e));
      }
    },
    async deleteRow(row) {
      this.$confirm(`确定删除业务 [${row.flowName}]?`, '提示', { type: 'warning' })
        .then(async () => {
          await deleteFlow(row.flowKey);
          this.$message.success('已删除');
          this.load();
        }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.filter-card >>> .el-card__body { padding: 12px 16px; }
.code { background: #f2f3f5; color: #606266; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
.tip { font-size: 12px; color: #909399; margin-top: 4px; }
.el-table >>> .el-table__row { cursor: pointer; }
</style>
