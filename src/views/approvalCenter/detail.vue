<template>
  <div class="app-container" v-loading="loading">
    <el-page-header @back="goBack" :content="'审批详情 #' + id" style="margin-bottom: 16px;" />

    <el-row :gutter="16" v-if="instance">
      <el-col :span="17">
        <el-card shadow="never">
          <div class="detail-title">{{ instance.title }}</div>
          <div class="detail-meta">
            <el-tag size="small" type="info">{{ instance.businessType }}</el-tag>
            <el-tag size="small" :type="statusType" style="margin-left:6px;">{{ statusText }}</el-tag>
            <span style="margin-left:12px;">编号 #{{ instance.id }}</span>
            <span style="margin-left:12px;">发起人: <b>{{ instance.applyUserName }}</b></span>
            <span style="margin-left:12px;">提交时间: {{ instance.startTime }}</span>
          </div>

          <el-divider />

          <div class="section-title">审批流程</div>
          <el-timeline>
            <el-timeline-item
              v-for="(rec, i) in records"
              :key="i"
              :type="recType(rec.result)"
              :timestamp="rec.createTime"
              placement="top">
              <div style="font-weight: 500;">{{ recActionText(rec) }} · {{ rec.assigneeName || '(系统)' }}</div>
              <div v-if="rec.comment" class="tl-comment">{{ rec.comment }}</div>
            </el-timeline-item>
            <el-timeline-item v-if="instance.status === 0" type="primary" placement="top" timestamp="处理中">
              <div style="font-weight: 500;">{{ instance.currentTaskName }} · {{ instance.currentAssigneeName || '待分配' }}</div>
            </el-timeline-item>
          </el-timeline>

          <el-card v-if="canApprove" shadow="never" class="op-panel">
            <div class="op-title"><i class="el-icon-warning-outline"></i> 该审批需要你处理</div>
            <el-input v-model="comment" type="textarea" :rows="3" placeholder="请输入审批意见..." />
            <div style="text-align: right; margin-top: 12px;">
              <el-button size="small" @click="openTransfer">转办</el-button>
              <el-button size="small" type="danger" @click="handleReject">驳回</el-button>
              <el-button size="small" type="primary" @click="handleApprove">同意</el-button>
            </div>
          </el-card>
        </el-card>
      </el-col>

      <el-col :span="7">
        <el-card shadow="never">
          <div class="section-title">基本信息</div>
          <div class="side-item"><span class="k">业务类型</span><span>{{ instance.businessType }}</span></div>
          <div class="side-item"><span class="k">业务标题</span><span>{{ instance.title }}</span></div>
          <div class="side-item"><span class="k">发起人</span><span>{{ instance.applyUserName }}</span></div>
          <div class="side-item"><span class="k">提交时间</span><span>{{ instance.startTime }}</span></div>
          <div class="side-item"><span class="k">当前节点</span>
            <el-tag size="mini" type="warning">{{ instance.currentTaskName || '—' }}</el-tag>
          </div>
          <div class="side-item"><span class="k">流程实例</span><span style="font-size:11px; color:#909399;">{{ instance.processInstanceId }}</span></div>

          <el-divider />
          <el-button v-if="bizJumpPath" type="primary" plain size="small" style="width:100%;" @click="jumpToBusiness">
            <i class="el-icon-view"></i> 查看原始业务
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-else-if="!loading" description="未找到审批详情" />

    <el-dialog title="转办" :visible.sync="transferVisible" width="420px">
      <el-form label-width="80px" size="small">
        <el-form-item label="转办给">
          <el-input v-model="transferTo" placeholder="接收人账号 / userId" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="transferReason" type="textarea" :rows="3" placeholder="转办原因" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="transferVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTransfer">确认转办</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getApprovalDetail, approvePass, approveReject, approveTransfer } from '@/api/approvalCenter';

export default {
  name: 'ApprovalDetail',
  data() {
    return {
      id: null,
      taskId: '',
      instance: null,
      records: [],
      loading: false,
      comment: '',
      transferVisible: false,
      transferTo: '',
      transferReason: '',
    };
  },
  computed: {
    userId() { return (this.$store.state.user.userInfo || {}).id; },
    userName() {
      const info = this.$store.state.user.userInfo || {};
      return info.realName || info.account || 'me';
    },
    canApprove() {
      // 有 taskId (从待办进来) 且流程仍在进行中
      return !!this.taskId && this.instance && this.instance.status === 0;
    },
    statusType() {
      if (!this.instance) return 'info';
      if (this.instance.status === 0) return 'primary';
      if (this.instance.result === 0) return 'success';
      if (this.instance.result === 1) return 'danger';
      return 'info';
    },
    statusText() {
      if (!this.instance) return '';
      if (this.instance.status === 0) return '审批中';
      if (this.instance.result === 0) return '已通过';
      if (this.instance.result === 1) return '已驳回';
      return '已撤回';
    },
    /** businessType → 原始业务页 URL */
    bizJumpPath() {
      if (!this.instance || !this.instance.businessType || !this.instance.businessId) return '';
      const map = {
        '商户新增商品': `/product/list?id=${this.instance.businessId}`,
        '商户修改商品': `/product/list?id=${this.instance.businessId}`,
        '商户店铺变更': `/merchant/list?id=${this.instance.businessId}`,
        '商户提现': `/finance/journalAccount?id=${this.instance.businessId}`,
      };
      return map[this.instance.businessType] || '';
    },
  },
  created() {
    this.id = +this.$route.params.id;
    this.taskId = this.$route.query.taskId || '';
    this.loadDetail();
  },
  methods: {
    async loadDetail() {
      this.loading = true;
      try {
        const res = await getApprovalDetail(this.id);
        const data = res && (res.data !== undefined ? res.data : res);
        this.instance = data && data.instance;
        this.records = (data && data.records) || [];
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    recType(result) {
      return { 0: 'success', 1: 'danger', 2: 'warning', 3: 'info' }[result] || 'info';
    },
    recActionText(rec) {
      const map = { SUBMIT: '提交申请', PASS: '通过', REJECT: '驳回', TRANSFER: '转办', WITHDRAW: '撤回' };
      const label = map[rec.action] || rec.action;
      return `${rec.taskName || ''} · ${label}`;
    },
    goBack() {
      this.$router.back();
    },
    async handleApprove() {
      try {
        await approvePass({
          taskId: this.taskId,
          comment: this.comment || '同意',
          userId: this.userId,
          userName: this.userName,
        });
        this.$message.success('已同意');
        setTimeout(() => this.$router.push('/approvalCenter/todo'), 500);
      } catch (e) {
        this.$message.error('操作失败: ' + (e.message || e));
      }
    },
    async handleReject() {
      if (!this.comment) return this.$message.warning('请填写驳回原因');
      try {
        await approveReject({
          taskId: this.taskId,
          comment: this.comment,
          userId: this.userId,
          userName: this.userName,
        });
        this.$message.success('已驳回');
        setTimeout(() => this.$router.push('/approvalCenter/todo'), 500);
      } catch (e) {
        this.$message.error('操作失败: ' + (e.message || e));
      }
    },
    openTransfer() {
      this.transferTo = '';
      this.transferReason = '';
      this.transferVisible = true;
    },
    async confirmTransfer() {
      if (!this.transferTo) return this.$message.warning('请填写接收人');
      try {
        await approveTransfer({
          taskId: this.taskId,
          targetAssignee: this.transferTo,
          comment: this.transferReason,
          userId: this.userId,
          userName: this.userName,
        });
        this.transferVisible = false;
        this.$message.success('已转办');
        setTimeout(() => this.$router.push('/approvalCenter/todo'), 500);
      } catch (e) {
        this.$message.error('转办失败: ' + (e.message || e));
      }
    },
    jumpToBusiness() {
      if (this.bizJumpPath) this.$router.push(this.bizJumpPath);
    },
  },
};
</script>

<style scoped>
.detail-title { font-size: 18px; font-weight: 500; margin-bottom: 8px; }
.detail-meta { font-size: 13px; color: #86909c; }
.section-title { font-size: 14px; font-weight: 500; margin: 10px 0; padding-left: 8px; border-left: 3px solid #409EFF; }
.tl-comment { margin-top: 6px; padding: 8px 12px; background: #f7f8fa; border-radius: 4px; font-size: 13px; color: #4e5969; }
.op-panel { margin-top: 20px; border: 1px solid #ffe58f !important; background: #fffbe6; }
.op-panel >>> .el-card__body { padding: 16px; }
.op-title { font-size: 14px; font-weight: 500; color: #d46b08; margin-bottom: 10px; }
.side-item { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; gap: 8px; }
.side-item .k { color: #86909c; flex-shrink: 0; }
</style>
