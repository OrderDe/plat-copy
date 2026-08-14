<template>
  <div class="app-container approval-detail-page" v-loading="loading">
    <div class="detail-page-header">
      <el-page-header @back="goBack" :content="'审批详情 #' + id" class="detail-page-nav" />
      <div v-if="instance" class="header-status" :class="'status-' + statusType">
        <span class="status-dot"></span>{{ statusText }}
      </div>
    </div>

    <el-row :gutter="18" v-if="instance" class="detail-grid">
      <el-col :span="17" class="detail-main-col">
        <el-card shadow="never" class="detail-main-card">
          <div class="detail-hero">
            <div class="hero-mark"><i class="el-icon-s-order"></i></div>
            <div class="hero-content">
              <div class="detail-title-row">
                <h1 class="detail-title">{{ instance.title }}</h1>
                <el-tag size="small" :type="statusType" effect="light">{{ statusText }}</el-tag>
              </div>
              <div class="detail-meta">
                <span class="meta-item"><i class="el-icon-collection-tag"></i>{{ instance.businessType }}</span>
                <span class="meta-item"><i class="el-icon-document"></i>编号 #{{ instance.id }}</span>
                <span class="meta-item"><i class="el-icon-user"></i>{{ instance.applyUserName }}</span>
                <span class="meta-item"><i class="el-icon-time"></i>{{ formatDateTime(instance.startTime) }}</span>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="section-heading">
            <div class="section-title-wrap">
              <span class="section-icon"><i class="el-icon-tickets"></i></span>
              <div>
                <div class="section-title">申请内容</div>
                <div class="section-caption">发起时提交的业务信息快照</div>
              </div>
            </div>
            <el-tag v-if="formFields.length" size="mini" type="info" effect="plain">{{ formFields.length }} 项</el-tag>
          </div>
          <!-- 商品类业务：实时回查商品，老审批(没有快照)也能看到内容 -->
          <div v-if="bizProduct" class="biz-card">
            <el-image
              v-if="bizProduct.image"
              :src="bizProduct.image"
              fit="cover"
              class="biz-cover"
              :preview-src-list="[bizProduct.image]" />
            <div class="biz-body">
              <div class="biz-name">
                {{ bizProduct.name }}
                <el-tag size="mini" effect="plain" style="margin-left:6px;">{{ auditStatusText(bizProduct.auditStatus) }}</el-tag>
                <el-tag size="mini" :type="bizProduct.isShow === 1 ? 'success' : 'info'" effect="plain" style="margin-left:4px;">
                  {{ bizProduct.isShow === 1 ? '已上架' : '未上架' }}
                </el-tag>
              </div>
              <div v-if="bizProduct.intro" class="biz-intro">{{ bizProduct.intro }}</div>
              <div class="biz-kv">
                <span class="biz-price">￥{{ bizProduct.price }}</span>
                <span class="biz-tag">库存 {{ bizProduct.stock }}</span>
                <span class="biz-tag">销量 {{ bizProduct.sales || 0 }}</span>
                <span v-if="bizProduct.cateName" class="biz-tag">分类 {{ bizProduct.cateName }}</span>
                <span v-if="bizProduct.brandName" class="biz-tag">品牌 {{ bizProduct.brandName }}</span>
                <span class="biz-tag">{{ bizProduct.specType ? '多规格' : '单规格' }}</span>
                <span class="biz-tag">单位 {{ bizProduct.unitName || '—' }}</span>
              </div>
              <div v-if="skuRows.length" class="biz-sku">
                <el-table :data="skuRows" size="mini" max-height="200">
                  <el-table-column label="规格" prop="sku" min-width="140" show-overflow-tooltip />
                  <el-table-column label="售价" width="100">
                    <template slot-scope="{ row }"><span class="biz-price-sm">￥{{ row.price }}</span></template>
                  </el-table-column>
                  <el-table-column label="原价" prop="otPrice" width="90" />
                  <el-table-column label="库存" prop="stock" width="80" />
                </el-table>
              </div>
              <div class="biz-actions">
                <el-button type="primary" plain size="mini" icon="el-icon-view" @click="openProductDrawer">查看商品完整信息</el-button>
              </div>
            </div>
          </div>

          <!-- 有实时商品卡片时，发起快照与之重复，收起来供需要对比的人展开 -->
          <el-collapse v-if="formFields.length && bizProduct" class="snapshot-collapse">
            <el-collapse-item name="snapshot">
              <template slot="title">
                <span class="snapshot-title">发起时提交的内容快照（{{ formFields.length }} 项，可与上方现状对比）</span>
              </template>
              <div class="form-grid form-grid-inner">
                <div v-for="(f, i) in formFields" :key="i" class="form-item" :class="{ 'form-item-wide': isWide(f) }">
                  <div class="form-label">{{ f.label }}</div>
                  <div class="form-value">
                    <template v-if="f.type === 'image'">
                      <el-image :src="f.value" fit="cover" class="form-image" :preview-src-list="[f.value]" />
                    </template>
                    <template v-else-if="f.type === 'images'">
                      <el-image
                        v-for="(img, k) in splitImages(f.value)"
                        :key="k"
                        :src="img"
                        fit="cover"
                        class="form-image"
                        :preview-src-list="splitImages(f.value)" />
                    </template>
                    <span v-else-if="f.type === 'money'" class="form-money">￥{{ f.value }}</span>
                    <span v-else>{{ f.value }}</span>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>

          <div v-else-if="formFields.length" class="form-grid">
            <div v-for="(f, i) in formFields" :key="i" class="form-item" :class="{ 'form-item-wide': isWide(f) }">
              <div class="form-label">{{ f.label }}</div>
              <div class="form-value">
                <template v-if="f.type === 'image'">
                  <el-image :src="f.value" fit="cover" class="form-image" :preview-src-list="[f.value]" />
                </template>
                <template v-else-if="f.type === 'images'">
                  <el-image
                    v-for="(img, k) in splitImages(f.value)"
                    :key="k"
                    :src="img"
                    fit="cover"
                    class="form-image"
                    :preview-src-list="splitImages(f.value)" />
                </template>
                <span v-else-if="f.type === 'money'" class="form-money">￥{{ f.value }}</span>
                <span v-else>{{ f.value }}</span>
              </div>
            </div>
          </div>
          <el-alert
            v-if="!formFields.length && !bizProduct && !bizLoading"
            type="info"
            :closable="false"
            class="form-empty"
            title="这类业务还没有接入内容展示"
            description="可按右侧「业务编号」到对应业务页面查阅原单。" />
          <div v-if="bizLoading" v-loading="true" class="biz-loading" element-loading-text="正在读取业务内容..."></div>

          <el-collapse v-if="Object.keys(variables).length" class="var-collapse">
            <el-collapse-item name="vars">
              <template slot="title"><span class="var-title">技术信息（流程变量）</span></template>
              <el-tag v-for="(v, k) in variables" :key="k" size="mini" type="info" effect="plain" class="var-tag">
                {{ k }} = {{ v }}
              </el-tag>
            </el-collapse-item>
          </el-collapse>

          <el-divider />

          <div class="section-heading">
            <div class="section-title-wrap">
              <span class="section-icon"><i class="el-icon-s-operation"></i></span>
              <div>
                <div class="section-title">审批流程</div>
                <div class="section-caption">查看每个节点的处理记录与审批意见</div>
              </div>
            </div>
            <el-tag size="mini" type="info" effect="plain">{{ records.length }} 条记录</el-tag>
          </div>
          <el-timeline class="approval-timeline">
            <el-timeline-item
              v-for="(rec, i) in records"
              :key="i"
              :type="recType(rec.result)"
              :timestamp="formatDateTime(rec.createTime)"
              placement="top">
              <div class="timeline-card" :class="'timeline-' + recType(rec.result)">
                <div class="timeline-card-head">
                  <span class="timeline-task">{{ rec.taskName || '审批节点' }}</span>
                  <el-tag size="mini" :type="recType(rec.result)" effect="light">{{ recActionLabel(rec.action) }}</el-tag>
                </div>
                <div class="timeline-meta">
                  <span><i class="el-icon-user"></i>{{ rec.assigneeName || '(系统)' }}</span>
                </div>
                <div v-if="rec.comment" class="tl-comment"><i class="el-icon-chat-line-round"></i>{{ rec.comment }}</div>
              </div>
            </el-timeline-item>
            <el-timeline-item v-if="instance.status === 0" type="primary" placement="top" timestamp="处理中">
              <div class="timeline-card timeline-primary">
                <div class="timeline-card-head">
                  <span class="timeline-task">{{ instance.currentTaskName || '待处理节点' }}</span>
                  <el-tag size="mini" type="primary" effect="light">处理中</el-tag>
                </div>
                <div class="timeline-meta"><span><i class="el-icon-user"></i>{{ instance.currentAssigneeName || '待分配' }}</span></div>
              </div>
            </el-timeline-item>
          </el-timeline>

          <el-card v-if="canApprove" shadow="never" class="op-panel">
            <div class="op-title"><span class="op-icon"><i class="el-icon-warning-outline"></i></span><span>该审批需要你处理</span></div>
            <div class="op-hint">请填写审批意见后选择对应操作，审批结果将立即同步。</div>
            <el-input v-model="comment" type="textarea" :rows="3" placeholder="请输入审批意见..." />
            <div class="op-actions">
              <el-button size="small" @click="openTransfer">转办</el-button>
              <el-button size="small" type="danger" @click="handleReject">驳回</el-button>
              <el-button size="small" type="primary" @click="handleApprove">同意</el-button>
            </div>
          </el-card>
        </el-card>
      </el-col>

      <el-col :span="7" class="detail-side-col">
        <el-card shadow="never" class="summary-card">
          <div class="summary-head">
            <div class="section-title-wrap">
              <span class="section-icon"><i class="el-icon-info"></i></span>
              <div>
                <div class="section-title">基本信息</div>
                <div class="section-caption">审批实例摘要</div>
              </div>
            </div>
            <el-tag size="mini" :type="statusType" effect="light">{{ statusText }}</el-tag>
          </div>

          <div class="summary-list">
            <div class="side-item"><span class="k">业务类型</span><span class="v">{{ instance.businessType }}</span></div>
            <div class="side-item"><span class="k">业务标题</span><span class="v">{{ instance.title }}</span></div>
            <div class="side-item"><span class="k">发起人</span><span class="v">{{ instance.applyUserName }}</span></div>
            <div class="side-item"><span class="k">提交时间</span><span class="v">{{ formatDateTime(instance.startTime) }}</span></div>
            <div class="side-item"><span class="k">当前节点</span>
              <el-tag size="mini" type="warning" effect="light">{{ instance.currentTaskName || '—' }}</el-tag>
            </div>
            <div class="side-item"><span class="k">业务编号</span><span class="v">{{ instance.businessId || '—' }}</span></div>
            <div class="side-item"><span class="k">业务 Key</span><span class="v">{{ instance.businessKey || '—' }}</span></div>
            <div class="side-item side-instance"><span class="k">流程实例</span>
              <el-tooltip effect="dark" placement="top" :content="instance.processInstanceId || '—'">
                <span class="instance-id">{{ instance.processInstanceId || '—' }}</span>
              </el-tooltip>
            </div>
          </div>

        </el-card>
      </el-col>
    </el-row>

    <el-empty v-else-if="!loading" description="未找到审批详情" />

    <el-dialog title="转办" :visible.sync="transferVisible" width="420px">
      <el-form label-width="80px" size="small">
        <el-form-item label="转办给">
          <div class="transfer-picked">
            <el-tag v-if="transferUser" size="small" closable @close="transferUser = null">{{ transferUser.name }}</el-tag>
            <span v-else class="transfer-empty">未选择</span>
            <el-button type="text" size="mini" @click="openUserPicker">{{ transferUser ? '重新选择' : '+ 选择' }}</el-button>
          </div>
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

    <!-- 选择转办人 (与审批流配置的选人弹窗一致) -->
    <el-dialog title="选择转办人" :visible.sync="userPickerVisible" width="460px" append-to-body>
      <el-input v-model="userFilter" placeholder="搜索姓名/部门" clearable size="small" style="margin-bottom: 10px;" />
      <div class="user-list" v-loading="userLoading">
        <div v-for="u in filteredUsers" :key="u.id"
             :class="['user-item', { selected: tempPicked && tempPicked.id === u.id }]"
             @click="tempPicked = u">
          <span class="col-name">{{ u.name }}</span>
          <span class="col-account">{{ u.account }}</span>
          <span class="col-dept muted">{{ u.dept }}</span>
        </div>
        <div v-if="!userLoading && !filteredUsers.length" class="user-empty">暂无可选人员</div>
      </div>
      <div slot="footer">
        <el-button @click="userPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUserPick">确定</el-button>
      </div>
    </el-dialog>
    <!-- 商品完整详情（复用商品列表的详情抽屉，只读） -->
    <info-from
      :component-key="productComponentKey"
      :is-atud="false"
      :is-show="true"
      :product-id="productDrawerId"
      from-type="product"
      :dialog-visible-info-data="productDrawerVisible"
      @onCloseInfo="productDrawerVisible = false" />
  </div>
</template>

<script>
import { getApprovalDetail, approvePass, approveReject, approveTransfer } from '@/api/approvalCenter';
import { listUsers } from '@/api/approvalFlow';
import { productDetailApi } from '@/api/product';
import infoFrom from '@/components/productInfo';

export default {
  name: 'ApprovalDetail',
  components: { infoFrom },
  data() {
    return {
      id: null,
      taskId: '',
      instance: null,
      records: [],
      formFields: [],
      variables: {},
      bizProduct: null,
      bizLoading: false,
      productDrawerVisible: false,
      productDrawerId: 0,
      productComponentKey: 0,
      loading: false,
      comment: '',
      transferVisible: false,
      transferUser: null,
      transferReason: '',
      // 选人弹窗
      userPickerVisible: false,
      userLoading: false,
      userFilter: '',
      tempPicked: null,
      allUsers: [],
    };
  },
  computed: {
    skuRows() {
      const list = (this.bizProduct && this.bizProduct.attrValueList) || [];
      return list.map(x => ({
        sku: x.sku || '默认',
        price: x.price,
        otPrice: x.otPrice,
        stock: x.stock,
      }));
    },
    filteredUsers() {
      const arr = Array.isArray(this.allUsers) ? this.allUsers : [];
      const f = this.userFilter;
      return arr.filter(u => !f
        || (u.name && u.name.includes(f))
        || (u.account && u.account.includes(f))
        || (u.dept && u.dept.includes(f)));
    },
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
        this.formFields = (data && data.formFields) || [];
        this.variables = (data && data.variables) || {};
        this.loadBusiness();
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    /**
     * 按业务类型实时回查业务内容。
     * 快照(formFields)只有改造后新发起的审批才有，老审批全靠这里回查，
     * 否则审批人看到的还是一堆流程节点。
     */
    async loadBusiness() {
      this.bizProduct = null;
      const inst = this.instance;
      if (!inst || !inst.businessId) return;
      if (!String(inst.businessType || '').includes('商品')) return;
      this.bizLoading = true;
      try {
        const res = await productDetailApi(inst.businessId);
        this.bizProduct = (res && (res.data !== undefined ? res.data : res)) || null;
      } catch (e) {
        // 商品被删除或无权限时不弹错，走"未接入"提示即可
        this.bizProduct = null;
      } finally {
        this.bizLoading = false;
      }
    },
    auditStatusText(status) {
      return { 0: '无需审核', 1: '待审核', 2: '审核通过', 3: '审核拒绝' }[status] || '—';
    },
    /** 在当前页拉起商品详情抽屉，不再跳到商品列表让审批人自己搜 */
    openProductDrawer() {
      if (!this.bizProduct) return;
      this.productDrawerId = this.bizProduct.id;
      this.productComponentKey += 1;
      this.productDrawerVisible = true;
    },
    splitImages(value) {
      return String(value || '').split(',').map(x => x.trim()).filter(Boolean);
    },
    isWide(field) {
      // 图片和长文本占满整行，短字段两列排布
      if (field.type === 'image' || field.type === 'images') return true;
      // 多行文本（明细清单）必须独占整行，两列排布会把每条挤断
      if (String(field.value || '').includes('\n')) return true;
      return String(field.value || '').length > 30;
    },
    recType(result) {
      return { 0: 'success', 1: 'danger', 2: 'warning', 3: 'info' }[result] || 'info';
    },
    formatDateTime(value) {
      if (!value) return '-';
      // 后端返回的时间已经是本地时间，只替换分隔符，不重新构造 Date，避免时区偏移。
      return String(value).replace('T', ' ').substring(0, 19);
    },
    recActionLabel(action) {
      return { SUBMIT: '已提交', PASS: '已通过', REJECT: '已驳回', TRANSFER: '已转办', WITHDRAW: '已撤回', URGE: '已催办' }[action] || action || '已处理';
    },
    recActionText(rec) {
      const map = { SUBMIT: '提交申请', PASS: '通过', REJECT: '驳回', TRANSFER: '转办', WITHDRAW: '撤回', URGE: '催办' };
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
      this.transferUser = null;
      this.transferReason = '';
      this.transferVisible = true;
      this.loadUsers();
    },
    async loadUsers() {
      if (this.allUsers.length || this.userLoading) return;
      // 平台管理员接口返回 CommonPage {records:[...]}，需要展平
      const pickList = (res) => {
        if (!res) return [];
        const data = res.data !== undefined ? res.data : res;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.records)) return data.records;
        if (data && Array.isArray(data.list)) return data.list;
        return [];
      };
      this.userLoading = true;
      try {
        const res = await listUsers('');
        this.allUsers = pickList(res).map(x => ({
          id: x.id,
          name: x.realName || x.account,
          account: x.account || '',
          dept: x.roleNames || '',
        }));
      } catch (e) {
        this.$message.error('人员加载失败: ' + (e.message || e));
      } finally {
        this.userLoading = false;
      }
    },
    openUserPicker() {
      this.userFilter = '';
      this.tempPicked = this.transferUser;
      this.userPickerVisible = true;
      this.loadUsers();
    },
    confirmUserPick() {
      if (!this.tempPicked) return this.$message.warning('请选择转办人');
      this.transferUser = this.tempPicked;
      this.userPickerVisible = false;
    },
    async confirmTransfer() {
      if (!this.transferUser) return this.$message.warning('请选择转办人');
      try {
        await approveTransfer({
          taskId: this.taskId,
          targetAssignee: String(this.transferUser.id),
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
  },
};
</script>

<style scoped>
.approval-detail-page { min-height: calc(100vh - 140px); }
.detail-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.detail-page-nav { margin-bottom: 0; }
.header-status { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 18px; background: #f2f4f7; color: #667085; font-size: 13px; }
.header-status.status-primary { color: #2563eb; background: #eff6ff; }
.header-status.status-success { color: #16a34a; background: #f0fdf4; }
.header-status.status-danger { color: #dc2626; background: #fef2f2; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #98a2b3; }
.status-primary .status-dot { background: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, .12); }
.status-success .status-dot { background: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, .12); }
.status-danger .status-dot { background: #ef4444; box-shadow: 0 0 0 4px rgba(239, 68, 68, .12); }
.detail-main-card, .summary-card { border: 1px solid #e8edf3; border-radius: 10px; overflow: hidden; transition: box-shadow .2s ease, transform .2s ease; }
.detail-main-card:hover, .summary-card:hover { box-shadow: 0 8px 24px rgba(31, 35, 41, .06); }
.detail-main-card >>> .el-card__body { padding: 24px 26px 26px; }
.summary-card >>> .el-card__body { padding: 21px 22px 22px; }
.detail-hero { display: flex; align-items: flex-start; gap: 14px; }
.hero-mark { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; color: #fff; font-size: 18px; background: linear-gradient(135deg, #3b82f6, #6366f1); box-shadow: 0 5px 12px rgba(59, 130, 246, .22); }
.hero-content { min-width: 0; flex: 1; }
.detail-title-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.detail-title { margin: 0; color: #1d2939; font-size: 20px; line-height: 1.4; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.detail-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; margin-top: 9px; color: #667085; font-size: 13px; }
.meta-item { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.meta-item i { color: #98a2b3; font-size: 14px; }
.detail-main-card >>> .el-divider--horizontal { margin: 22px 0 20px; }
.section-heading, .summary-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.section-title-wrap { display: flex; align-items: center; gap: 9px; }
.section-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; color: #2563eb; background: #eff6ff; font-size: 15px; }
.section-title { margin: 0; color: #1d2939; font-size: 15px; font-weight: 600; }
.section-caption { margin-top: 2px; color: #98a2b3; font-size: 12px; }
.approval-timeline { margin: 18px 4px 0 0; padding-left: 3px; }
.approval-timeline >>> .el-timeline-item { padding-bottom: 20px; }
.approval-timeline >>> .el-timeline-item:last-child { padding-bottom: 4px; }
.approval-timeline >>> .el-timeline-item__timestamp { padding-top: 1px; color: #98a2b3; font-size: 12px; line-height: 1.4; }
.approval-timeline >>> .el-timeline-item__wrapper { top: -4px; padding-left: 25px; }
.approval-timeline >>> .el-timeline-item__tail { border-left-color: #e4e7ec; }
.timeline-card { padding: 13px 15px; border: 1px solid #e4e7ec; border-left: 3px solid #98a2b3; border-radius: 8px; background: #fff; box-shadow: 0 2px 7px rgba(31, 35, 41, .03); transition: box-shadow .2s ease, transform .2s ease; }
.timeline-card:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(31, 35, 41, .07); }
.timeline-success { border-left-color: #22c55e; background: linear-gradient(90deg, #f6fffa 0%, #fff 48%); }
.timeline-danger { border-left-color: #ef4444; background: linear-gradient(90deg, #fff7f7 0%, #fff 48%); }
.timeline-warning { border-left-color: #f59e0b; background: linear-gradient(90deg, #fffbeb 0%, #fff 48%); }
.timeline-primary { border-left-color: #3b82f6; background: linear-gradient(90deg, #f5f9ff 0%, #fff 48%); }
.timeline-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.timeline-task { color: #344054; font-size: 14px; font-weight: 600; }
.timeline-meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 7px; color: #667085; font-size: 12px; }
.timeline-meta span { display: inline-flex; align-items: center; gap: 4px; }
.timeline-meta i { color: #98a2b3; }
.tl-comment { display: flex; align-items: flex-start; gap: 6px; margin-top: 11px; padding: 9px 11px; border: 1px solid #eef0f3; border-radius: 6px; color: #475467; background: rgba(247, 248, 250, .86); font-size: 13px; line-height: 1.55; }
.tl-comment i { margin-top: 2px; color: #98a2b3; }
.biz-card { display: flex; gap: 14px; margin: 16px 0 4px; padding: 14px; border: 1px solid #eef0f3; border-radius: 10px; background: #fcfcfd; }
.biz-cover { width: 96px; height: 96px; flex-shrink: 0; border: 1px solid #eef0f3; border-radius: 8px; }
.biz-body { min-width: 0; flex: 1; }
.biz-name { color: #1d2939; font-size: 15px; font-weight: 600; line-height: 1.5; }
.biz-intro { margin-top: 4px; color: #667085; font-size: 12px; line-height: 1.6; }
.biz-kv { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin-top: 9px; }
.biz-price { color: #d92d20; font-size: 17px; font-weight: 600; }
.biz-price-sm { color: #d92d20; font-weight: 600; }
.biz-tag { color: #475467; font-size: 12px; }
.biz-sku { margin-top: 11px; }
.biz-actions { margin-top: 11px; }
.biz-loading { min-height: 90px; margin: 16px 0 4px; }
.snapshot-collapse { margin-top: 10px; }
.snapshot-collapse >>> .el-collapse-item__header { height: 36px; line-height: 36px; border-bottom: 0; }
.snapshot-collapse >>> .el-collapse-item__wrap { border-bottom: 0; }
.snapshot-title { color: #667085; font-size: 13px; }
.form-grid-inner { margin-top: 4px; }
.var-collapse { margin-top: 12px; }
.var-collapse >>> .el-collapse-item__header { height: 34px; line-height: 34px; border-bottom: 0; }
.var-collapse >>> .el-collapse-item__wrap { border-bottom: 0; }
.var-collapse >>> .el-collapse-item__content { padding-bottom: 8px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; margin: 16px 0 4px; }
.form-item { min-width: 0; padding: 10px 12px; border: 1px solid #eef0f3; border-radius: 8px; background: #fcfcfd; }
.form-item-wide { grid-column: 1 / -1; }
.form-label { color: #98a2b3; font-size: 12px; }
/* 明细类字段是多行文本（一行一条商品），pre-line 保留换行，否则会挤成一坨 */
.form-value { margin-top: 4px; color: #344054; font-size: 13px; line-height: 1.6; word-break: break-all; white-space: pre-line; }
.form-money { color: #d92d20; font-size: 15px; font-weight: 600; }
.form-image { width: 68px; height: 68px; margin: 2px 8px 2px 0; border: 1px solid #eef0f3; border-radius: 6px; }
.form-empty { margin: 16px 0 4px; }
.var-title { color: #98a2b3; font-size: 12px; }
.var-tag { margin: 0 6px 6px 0; }
.op-panel { margin-top: 22px; border: 1px solid #fbd38d !important; border-radius: 9px; background: linear-gradient(135deg, #fffaf0, #fffdf8); }
.op-panel >>> .el-card__body { padding: 17px 18px 16px; }
.op-title { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; color: #b45309; font-size: 14px; font-weight: 600; }
.op-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 7px; color: #fff; background: #f59e0b; }
.op-hint { margin-bottom: 11px; color: #a16207; font-size: 12px; }
.op-panel >>> .el-textarea__inner { border-color: #f6d494; background: rgba(255, 255, 255, .8); }
.op-actions { margin-top: 12px; text-align: right; }
.summary-head { align-items: flex-start; }
.summary-list { margin-top: 17px; }
.side-item { display: flex; align-items: flex-start; justify-content: space-between; min-height: 37px; padding: 9px 0; border-bottom: 1px solid #f2f4f7; gap: 12px; color: #344054; font-size: 13px; }
.side-item:last-child { border-bottom: 0; }
.side-item .k { color: #98a2b3; flex-shrink: 0; }
.side-item .v { max-width: 68%; color: #344054; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.side-instance { align-items: center; }
.instance-id { display: block; max-width: 168px; overflow: hidden; color: #667085; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; cursor: help; }

@media (max-width: 992px) {
  .detail-page-header { align-items: flex-start; gap: 10px; }
  .detail-main-col, .detail-side-col { width: 100% !important; }
  .detail-side-col { margin-top: 18px; }
}

@media (max-width: 640px) {
  .detail-page-header { display: block; }
  .header-status { margin-top: 10px; }
  .detail-main-card >>> .el-card__body { padding: 18px 16px; }
  .detail-title { font-size: 18px; }
  .detail-meta { gap: 7px 12px; }
  .form-grid { grid-template-columns: minmax(0, 1fr); }
  .biz-card { flex-direction: column; }
  .timeline-card-head { align-items: flex-start; }
  .timeline-task { line-height: 1.45; }
}

/* 转办选人 */
.transfer-picked { display: flex; align-items: center; gap: 8px; }
.transfer-empty { color: #a8abb2; font-size: 13px; }
.user-list { max-height: 300px; overflow-y: auto; border: 1px solid #e5e6eb; border-radius: 4px; }
.user-item { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; border-bottom: 1px solid #f2f3f5; font-size: 13px; }
.user-item .col-name { flex: 0 0 90px; }
.user-item .col-account { flex: 1; color: #606266; }
.user-item .col-dept { flex: 0 0 130px; text-align: right; }
.user-item:hover { background: #f5f7fa; }
.user-item.selected { background: #ecf5ff; color: #409EFF; }
.user-item .muted { color: #909399; }
.user-empty { padding: 20px; text-align: center; color: #a8abb2; font-size: 13px; }
</style>
