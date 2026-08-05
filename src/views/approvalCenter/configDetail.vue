<template>
  <div class="app-container config-page">
    <div class="page-header">
      <div class="page-title">审批流配置</div>
      <div class="page-sub">用户看到简单表单,后台自动生成 BPMN XML 部署到 Flowable 引擎</div>
    </div>

    <el-page-header @back="goBack" :content="currentBiz ? currentBiz.flowName : '流程详情'" style="margin-bottom: 16px;" />

    <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
      <template slot="title">
        <b>提示</b>: 修改节点配置后请点"保存草稿",部署后才会生效到 Flowable 引擎。
      </template>
    </el-alert>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card shadow="never">
          <div slot="header" class="card-head">
            <span>流程节点 <span class="muted">(点击节点编辑)</span></span>
            <el-link type="primary" @click="toggleShowXml">查看生成的 BPMN XML ↓</el-link>
          </div>

          <div class="flow-canvas">
            <div class="flow-node"><div class="flow-box start">● 开始 (发起人提交)</div></div>
            <div class="flow-conn">↓</div>

            <template v-for="(n, i) in currentNodes">
              <div class="flow-node" :key="'n' + n.id">
                <div :class="['flow-box', n.type, { selected: selectedNodeId === n.id }]" @click="selectNode(n.id)">
                  <template v-if="n.type === 'approval'">
                    <div class="name">{{ n.name }}
                      <el-tag size="mini" :type="n.rule === 'AND' ? 'success' : 'info'">{{ ruleLabel(n.rule) }}</el-tag>
                    </div>
                    <div class="meta">审批人: {{ n.users.map(u => u.name).join(' / ') || '(未设置)' }} · 超时 {{ n.timeout }}h 催办</div>
                  </template>
                  <template v-else-if="n.type === 'condition'">
                    <div class="name">◇ 条件分支 <el-tag size="mini" type="warning">网关</el-tag></div>
                    <div class="meta">当 {{ n.field }} {{ n.op }} {{ n.val }} → {{ n.then }}</div>
                  </template>
                  <template v-else-if="n.type === 'cc'">
                    <div class="name">✉ 抄送节点</div>
                    <div class="meta">抄送: {{ n.users.map(u => u.name).join(' / ') || '(未设置)' }}</div>
                  </template>
                </div>
                <div class="node-actions">
                  <el-button size="mini" icon="el-icon-top" :disabled="i === 0" @click.stop="moveNode(n.id, -1)" />
                  <el-button size="mini" icon="el-icon-bottom" :disabled="i === currentNodes.length - 1" @click.stop="moveNode(n.id, 1)" />
                  <el-button size="mini" icon="el-icon-close" type="danger" plain @click.stop="deleteNode(n.id)" />
                </div>
              </div>
              <div class="flow-conn" :key="'c' + n.id">↓</div>
            </template>

            <div class="flow-add">
              <el-button size="small" plain type="primary" icon="el-icon-plus" @click="addNode('approval')">审批节点</el-button>
              <el-button size="small" plain type="warning" icon="el-icon-plus" @click="addNode('condition')">条件分支</el-button>
              <el-button size="small" plain style="color:#722ed1; border-color:#722ed1;" icon="el-icon-plus" @click="addNode('cc')">抄送节点</el-button>
            </div>

            <div class="flow-node"><div class="flow-box end">■ 结束</div></div>
          </div>

          <pre v-if="showXml" class="xml-preview">{{ previewXmlContent }}</pre>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never">
          <div slot="header">节点属性</div>
          <el-empty v-if="!selectedNode" description="请点击左侧节点进行编辑" :image-size="80" />

          <div v-else>
            <!-- 审批节点 -->
            <template v-if="selectedNode.type === 'approval'">
              <el-form label-position="top" size="small">
                <el-form-item label="节点名称" required>
                  <el-input v-model="selectedNode.name" />
                </el-form-item>
                <el-form-item label="审批人类型" required>
                  <el-select v-model="selectedNode.assigneeType" style="width:100%;" @change="onAssigneeTypeChange">
                    <el-option label="指定人员" value="USER" />
                    <el-option label="发起人上级 (逐级)" value="LEADER" />
                    <el-option label="按角色" value="ROLE" />
                  </el-select>
                </el-form-item>

                <el-form-item label="审批人" required>
                  <div v-if="selectedNode.assigneeType === 'USER'" class="user-picker">
                    <el-tag v-for="u in selectedNode.users" :key="u.id" closable size="small" @close="removeUser(u.id)" style="margin: 2px;">{{ u.name }}</el-tag>
                    <el-button size="mini" type="text" @click="openUserPicker">+ 添加</el-button>
                  </div>
                  <div v-else-if="selectedNode.assigneeType === 'LEADER'">
                    <el-select v-model="selectedNode.leaderLevel" style="width:100%;">
                      <el-option v-for="l in [1,2,3,4,5]" :key="l" :value="l" :label="'第 ' + l + ' 级上级'" />
                    </el-select>
                    <div class="tip">💡 系统根据发起人自动查找,如: 张三提交 → 找第1级上级(李四)</div>
                  </div>
                  <el-select v-else-if="selectedNode.assigneeType === 'ROLE'" v-model="selectedNode.role" placeholder="选择角色" style="width:100%;">
                    <el-option v-for="r in allRoles" :key="r.id || r.code || r.name" :label="r.name" :value="r.code || r.name" />
                  </el-select>
                </el-form-item>

                <el-form-item label="多人审批规则">
                  <el-radio-group v-model="selectedNode.rule" size="small">
                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        <b>或签</b> — 任一人通过即可<br>
                        3 人同时收到任务,任意 1 人点通过 → 节点通过<br>
                        <span style="color:#a3e635;">适合互相备份 (如值班运营)</span>
                      </div>
                      <el-radio-button label="OR">或签</el-radio-button>
                    </el-tooltip>

                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        <b>会签</b> — 全部人必须通过<br>
                        3 人同时收到任务,3 人都点通过 → 节点通过<br>
                        (任一人驳回则整体驳回)<br>
                        <span style="color:#a3e635;">适合重要决策 (资金/合规)</span>
                      </div>
                      <el-radio-button label="AND">会签</el-radio-button>
                    </el-tooltip>

                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        <b>依次</b> — 按顺序一个个审<br>
                        张三通过 → 李四才收到 → 李四通过 → 王五才收到<br>
                        <span style="color:#a3e635;">适合层级复核 (下级审完上级审)</span>
                      </div>
                      <el-radio-button label="SEQ">依次</el-radio-button>
                    </el-tooltip>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="超时催办 (小时)">
                  <el-input-number v-model="selectedNode.timeout" :min="0" size="small" style="width:100%;" />
                </el-form-item>
                <el-form-item label="驳回策略">
                  <el-select v-model="selectedNode.reject" style="width:100%;">
                    <el-option label="驳回到发起人" value="submitter" />
                    <el-option label="驳回到上一节点" value="prev" />
                  </el-select>
                </el-form-item>
              </el-form>
            </template>

            <!-- 条件分支 -->
            <template v-else-if="selectedNode.type === 'condition'">
              <el-form label-position="top" size="small">
                <el-form-item label="条件字段">
                  <el-select v-model="selectedNode.field" placeholder="选择条件字段" style="width:100%;">
                    <el-option v-for="f in conditionFields" :key="f.code" :label="f.name" :value="f.code">
                      <span>{{ f.name }}</span>
                      <span style="float:right; color:#909399; font-size:12px;">{{ f.type }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="比较">
                  <el-row :gutter="8">
                    <el-col :span="10"><el-select v-model="selectedNode.op"><el-option v-for="o in ['>','>=','<','=']" :key="o" :value="o" /></el-select></el-col>
                    <el-col :span="14"><el-input-number v-model="selectedNode.val" style="width:100%;" /></el-col>
                  </el-row>
                </el-form-item>
                <el-form-item label="满足时">
                  <el-select v-model="selectedNode.then" style="width:100%;">
                    <el-option v-for="t in ['继续下一节点','跳到终审','直接结束']" :key="t" :value="t" />
                  </el-select>
                </el-form-item>
              </el-form>
            </template>

            <!-- 抄送 -->
            <template v-else-if="selectedNode.type === 'cc'">
              <div class="user-picker">
                <el-tag v-for="u in selectedNode.users" :key="u.id" closable size="small" @close="removeUser(u.id)" style="margin: 2px;">{{ u.name }}</el-tag>
                <el-button size="mini" type="text" @click="openUserPicker">+ 添加</el-button>
              </div>
              <div class="tip">💡 抄送人员仅收到通知,无需审批</div>
            </template>

            <div style="margin-top: 20px; text-align: right;">
              <el-button size="small" @click="selectedNodeId = null">关闭</el-button>
              <el-button size="small" type="primary" @click="save">保存</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div style="margin-top: 16px; text-align: right;">
      <el-button @click="save" :disabled="!currentBiz">保存草稿</el-button>
      <el-button type="primary" @click="deploy" :disabled="!currentBiz">部署到 Flowable</el-button>
    </div>

    <!-- 用户选择弹窗 -->
    <el-dialog title="选择审批人" :visible.sync="userPickerVisible" width="460px">
      <el-input v-model="userFilter" placeholder="搜索姓名/部门" clearable size="small" style="margin-bottom: 10px;" />
      <div class="user-list">
        <div v-for="u in filteredUsers" :key="u.id"
             :class="['user-item', { selected: tempPicked.includes(u.id) }]"
             @click="toggleUserPick(u.id)">
          <span class="col-name">{{ u.name }}</span>
          <span class="col-account">{{ u.account }}</span>
          <span class="col-dept muted">{{ u.dept }}</span>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="userPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUsers">确定</el-button>
      </div>
    </el-dialog>

    <!-- 新增业务 -->
    <el-dialog title="新增业务类型" :visible.sync="bizDialogVisible" width="420px">
      <el-form label-width="100px" size="small">
        <el-form-item label="业务名称" required><el-input v-model="newBiz.flowName" placeholder="如: 合同审批" /></el-form-item>
        <el-form-item label="流程标识" required><el-input v-model="newBiz.flowKey" placeholder="如: contract_approve (英文)" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="bizDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createBiz">创建</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listFlowConfig, getFlowConfig, createBiz, saveFlowConfig,
  deployFlow, previewFlowXml, deleteFlow,
  listUsers, listRoles, listConditionFields,
} from '@/api/approvalFlow';

export default {
  name: 'ApprovalConfig',
  data() {
    return {
      bizList: [],          // 业务列表 - 后端拉
      currentBizKey: '',
      loading: false,
      selectedNodeId: null,
      showXml: false,
      userPickerVisible: false,
      userFilter: '',
      tempPicked: [],
      bizDialogVisible: false,
      newBiz: { flowKey: '', flowName: '' },
      previewXmlContent: '',
      // ===== 组织架构 (后端拉) =====
      allUsers: [],
      allRoles: [],
      conditionFields: [],   // 当前业务下可选的条件字段
    };
  },
  computed: {
    currentBiz() { return this.bizList.find(b => b.flowKey === this.currentBizKey); },
    currentNodes() { return this.currentBiz && this.currentBiz.nodes ? this.currentBiz.nodes : []; },
    selectedNode() { return this.currentNodes.find(n => n.id === this.selectedNodeId); },
    filteredUsers() {
      const arr = Array.isArray(this.allUsers) ? this.allUsers : [];
      const f = this.userFilter;
      return arr.filter(u => !f
        || (u.name && u.name.includes(f))
        || (u.account && u.account.includes(f))
        || (u.dept && u.dept.includes(f)));
    },
    generatedXml() {
      const biz = this.currentBiz;
      let body = `  <process id="${biz.key}" name="${biz.name}">\n    <startEvent id="start"/>\n`;
      biz.nodes.forEach(n => {
        if (n.type === 'approval') {
          if (n.assigneeType === 'LEADER') body += `    <userTask id="n${n.id}" name="${n.name}" flowable:assignee="\${getLeader(starter, ${n.leaderLevel || 1})}"/>\n`;
          else if (n.assigneeType === 'TOP_LEADER') body += `    <userTask id="n${n.id}" name="${n.name}" flowable:assignee="\${getTopLeader(starter)}"/>\n`;
          else if (n.users && n.users.length > 1) {
            const cond = n.rule === 'AND' ? 'nrOfCompletedInstances == nrOfInstances' : 'nrOfCompletedInstances >= 1';
            body += `    <userTask id="n${n.id}" name="${n.name}">\n      <multiInstanceLoopCharacteristics flowable:collection="\${${n.name}Users}">\n        <completionCondition>\${${cond}}</completionCondition>\n      </multiInstanceLoopCharacteristics>\n    </userTask>\n`;
          } else body += `    <userTask id="n${n.id}" name="${n.name}" flowable:assignee="\${${(n.users && n.users[0] && n.users[0].name) || 'assignee'}}"/>\n`;
        } else if (n.type === 'condition') {
          body += `    <exclusiveGateway id="n${n.id}"/>\n    <sequenceFlow sourceRef="n${n.id}"><conditionExpression>\${${n.field} ${n.op} ${n.val}}</conditionExpression></sequenceFlow>\n`;
        } else if (n.type === 'cc') {
          body += `    <serviceTask id="n${n.id}" flowable:class="CcNotifyTask"/>\n`;
        }
      });
      body += `    <endEvent id="end"/>\n  </process>`;
      return `<?xml version="1.0" encoding="UTF-8"?>\n<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="http://flowable.org/bpmn">\n${body}\n</definitions>`;
    },
  },
  created() {
    this.currentBizKey = this.$route.params.flowKey || '';
    this.loadBizList();
    this.loadOrgData();
  },
  watch: {
    '$route.params.flowKey'(newKey) {
      if (newKey && newKey !== this.currentBizKey) {
        this.currentBizKey = newKey;
        this.switchBiz(newKey);
      }
    },
  },
  methods: {
    goBack() { this.$router.push('/approvalCenter/config'); },
    ruleLabel(rule) { return { OR: '或签', AND: '会签', SEQ: '依次' }[rule]; },

    // 一次性加载组织架构 (人员/角色/部门)
    async loadOrgData() {
      // 平台管理员/角色接口返回 { records: [...] } (CommonPage), 需要展平
      const pickList = (res) => {
        if (!res) return [];
        const data = res.data !== undefined ? res.data : res;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.records)) return data.records;
        if (data && Array.isArray(data.list)) return data.list;
        return [];
      };
      try {
        const [u, r] = await Promise.all([
          listUsers('').catch(() => null),
          listRoles().catch(() => null),
        ]);
        // 平台管理员字段: id, account, realName, roleNames → 映射到 {id, name, account, dept}
        this.allUsers = pickList(u).map(x => ({
          id: x.id,
          name: x.realName || x.account,
          account: x.account || '',
          dept: x.roleNames || '',
        }));
        // 平台角色字段: id, roleName → 映射到 {id, code, name}
        this.allRoles = pickList(r).map(x => ({
          id: x.id,
          code: 'ROLE_' + x.id,
          name: x.roleName,
        }));
      } catch (e) {
        console.warn('组织架构加载失败:', e && e.message);
        this.allUsers = []; this.allRoles = [];
      }
    },

    // ===== 后端交互 =====
    async loadBizList() {
      this.loading = true;
      try {
        const res = await listFlowConfig();
        const list = (res && (res.data || res)) || [];
        this.bizList = Array.isArray(list) ? list : [];
        // 若 URL 指定了 flowKey, 加载对应业务详情
        if (this.currentBizKey) {
          this.switchBiz(this.currentBizKey);
        }
      } catch (e) {
        this.$message.error('加载业务列表失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    async switchBiz(key) {
      this.currentBizKey = key;
      this.selectedNodeId = null;
      // 并发加载: 业务详情 + 条件字段
      try {
        const [detailRes, fieldsRes] = await Promise.all([
          getFlowConfig(key).catch(() => null),
          listConditionFields(key).catch(() => null),
        ]);
        const detail = detailRes && (detailRes.data !== undefined ? detailRes.data : detailRes);
        if (detail) {
          const idx = this.bizList.findIndex(b => b.flowKey === key);
          if (idx >= 0) this.$set(this.bizList, idx, detail);
        }
        const fields = fieldsRes && (fieldsRes.data !== undefined ? fieldsRes.data : fieldsRes);
        this.conditionFields = Array.isArray(fields) ? fields : [];
      } catch (e) {
        this.conditionFields = [];
      }
    },
    async save() {
      if (!this.currentBiz) return;
      try {
        await saveFlowConfig(this.currentBiz);
        this.$message.success('已保存');
      } catch (e) {
        this.$message.error('保存失败: ' + (e.message || e));
      }
    },
    async deploy() {
      if (!this.currentBiz) return;
      try {
        // 部署前先保存最新配置
        await saveFlowConfig(this.currentBiz);
        const res = await deployFlow(this.currentBizKey);
        const deploymentId = (res && (res.data || res)) || '';
        this.$message.success('✓ 已部署到 Flowable, deploymentId=' + deploymentId);
        // 更新本地状态
        if (this.currentBiz) {
          this.currentBiz.status = 1;
          this.currentBiz.deploymentId = deploymentId;
        }
      } catch (e) {
        this.$message.error('部署失败: ' + (e.message || e));
      }
    },
    async loadPreviewXml() {
      try {
        const res = await previewFlowXml(this.currentBizKey);
        this.previewXmlContent = (res && (res.data || res)) || '';
      } catch (e) {
        this.previewXmlContent = '预览失败: ' + (e.message || e);
      }
    },
    toggleShowXml() {
      this.showXml = !this.showXml;
      if (this.showXml) this.loadPreviewXml();
    },

    // ===== 本地编辑 (点保存才落库) =====
    selectNode(id) { this.selectedNodeId = id; },
    onAssigneeTypeChange(val) {
      const n = this.selectedNode;
      if (val === 'LEADER' && !n.leaderLevel) this.$set(n, 'leaderLevel', 1);
      if (val !== 'USER') n.users = [];
    },
    moveNode(id, dir) {
      const nodes = this.currentBiz.nodes;
      const i = nodes.findIndex(n => n.id === id);
      const j = i + dir;
      if (j < 0 || j >= nodes.length) return;
      [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
      this.currentBiz.nodes = [...nodes];
    },
    deleteNode(id) {
      this.$confirm('确定删除该节点?', '提示', { type: 'warning' })
        .then(() => {
          this.currentBiz.nodes = this.currentBiz.nodes.filter(n => n.id !== id);
          if (this.selectedNodeId === id) this.selectedNodeId = null;
        }).catch(() => {});
    },
    addNode(type) {
      if (!this.currentBiz) return this.$message.warning('请先选择或新建业务类型');
      const newId = Date.now();
      let node;
      if (type === 'approval') node = { type, id: newId, name: '新节点', assigneeType: 'USER', users: [], rule: 'OR', timeout: 24, reject: 'submitter' };
      else if (type === 'condition') node = { type, id: newId, field: '商品金额', op: '>', val: 1000, then: '继续下一节点' };
      else node = { type, id: newId, users: [] };
      if (!this.currentBiz.nodes) this.$set(this.currentBiz, 'nodes', []);
      this.currentBiz.nodes.push(node);
      this.selectedNodeId = newId;
    },
    removeUser(uid) {
      this.selectedNode.users = this.selectedNode.users.filter(u => u.id !== uid);
    },
    openUserPicker() {
      this.tempPicked = this.selectedNode.users.map(u => u.id);
      this.userPickerVisible = true;
    },
    toggleUserPick(id) {
      const i = this.tempPicked.indexOf(id);
      if (i >= 0) this.tempPicked.splice(i, 1);
      else this.tempPicked.push(id);
    },
    confirmUsers() {
      this.selectedNode.users = this.tempPicked.map(id => this.allUsers.find(u => u.id === id)).filter(Boolean);
      this.userPickerVisible = false;
    },
    openBizDialog() { this.newBiz = { flowName: '', flowKey: '' }; this.bizDialogVisible = true; },
    async createBiz() {
      const { flowName, flowKey } = this.newBiz;
      if (!flowName || !flowKey) return this.$message.warning('请填写完整');
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(flowKey)) {
        return this.$message.warning('流程标识必须以字母开头,只能包含字母/数字/下划线 (如 goods_approve)');
      }
      if (this.bizList.find(b => b.flowKey === flowKey)) return this.$message.warning('流程标识已存在');
      try {
        await createBiz({ flowKey, flowName });
        this.bizDialogVisible = false;
        await this.loadBizList();
        this.switchBiz(flowKey);
        this.$message.success('已创建');
      } catch (e) {
        this.$message.error('创建失败: ' + (e.message || e));
      }
    },
    async deleteBiz(flowKey) {
      this.$confirm(`确定删除业务 ${flowKey}?`, '提示', { type: 'warning' })
        .then(async () => {
          await deleteFlow(flowKey);
          await this.loadBizList();
          this.$message.success('已删除');
        }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.muted { color: #86909c; font-size: 12px; font-weight: normal; }
.tip { font-size: 12px; color: #86909c; margin-top: 6px; }
code { background: #fff; padding: 1px 6px; border-radius: 3px; }
.biz-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.biz-tab { cursor: pointer; padding: 6px 14px; font-size: 13px; }
.biz-tab.dashed { border-style: dashed; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.flow-canvas { background: #fafbfc; border: 1px dashed #e5e6eb; border-radius: 8px; padding: 20px; }
.flow-node { display: flex; align-items: center; gap: 10px; max-width: 480px; margin: 0 auto 4px; }
.flow-conn { text-align: center; color: #c9cdd4; margin: 2px 0; }
.flow-box { flex: 1; background: #fff; border: 1.5px solid #e5e6eb; border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: all 0.15s; }
.flow-box:hover { border-color: #409EFF; box-shadow: 0 2px 8px rgba(64,158,255,0.15); }
.flow-box.selected { border-color: #409EFF; box-shadow: 0 2px 12px rgba(64,158,255,0.25); }
.flow-box.start { border-color: #67c23a; background: #f0fdf4; text-align: center; color: #67c23a; font-weight: 500; padding: 8px; cursor: default; }
.flow-box.end { border-color: #909399; background: #f7f8fa; text-align: center; color: #606266; padding: 8px; cursor: default; }
.flow-box.condition { border-color: #e6a23c; background: #fffbe6; }
.flow-box.cc { border-color: #722ed1; background: #f9f0ff; }
.flow-box .name { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.flow-box .meta { font-size: 12px; color: #86909c; }
.flow-add { text-align: center; margin: 12px 0; }
.node-actions { display: flex; flex-direction: column; gap: 4px; }
.node-actions .el-button { padding: 4px; }
.user-picker { padding: 6px; border: 1px solid #dcdfe6; border-radius: 4px; min-height: 36px; }
.user-list { max-height: 300px; overflow-y: auto; border: 1px solid #e5e6eb; border-radius: 4px; }
.user-item { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; border-bottom: 1px solid #f2f3f5; font-size: 13px; }
.user-item .col-name { flex: 0 0 90px; }
.user-item .col-account { flex: 1; color: #606266; }
.user-item .col-dept { flex: 0 0 130px; text-align: right; }
.user-item:hover { background: #f5f7fa; }
.user-item.selected { background: #ecf5ff; color: #409EFF; }
.xml-preview { margin-top: 12px; padding: 12px; background: #1f2329; color: #a3e635; border-radius: 6px; font-size: 11px; line-height: 1.5; max-height: 280px; overflow: auto; white-space: pre; }
</style>
