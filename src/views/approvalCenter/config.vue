<template>
  <div class="app-container approval-center-page">
    <div class="page-header">
      <div class="page-title">审批配置</div>
      <div class="page-sub">
        一处配好业务场景与它的审批流程 · 共 {{ scenes.length }} 个场景 / {{ flowList.length }} 条流程
      </div>
    </div>

    <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
      <template slot="title">
        💡 一行 = 一个业务场景。给场景选一条审批流 → 点【配置节点】设好审批人并【部署到 Flowable】 → 回来打开【启用】。
        <el-tag size="mini" type="success" style="margin: 0 4px;">已接入</el-tag> = 业务代码已 hook,配置生效;
        <el-tag size="mini" type="info" style="margin: 0 4px;">未接入</el-tag> = 业务代码未读取,配置不生效。
      </template>
    </el-alert>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" size="small" @submit.native.prevent>
        <el-form-item label="关键字">
          <el-input v-model="keyword" placeholder="场景名称/编码/流程名称" clearable style="width: 240px;" />
        </el-form-item>
        <el-form-item label="启用">
          <el-select v-model="enabledFilter" placeholder="全部" clearable style="width: 120px;">
            <el-option label="已启用" :value="1" />
            <el-option label="未启用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item class="approval-toolbar-actions">
          <el-button class="approval-toolbar-btn" type="primary" plain icon="el-icon-refresh" @click="loadAll">刷新</el-button>
          <el-button class="approval-toolbar-btn" type="primary" icon="el-icon-plus" @click="openSceneAdd">新增场景</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card
      v-for="group in groupedScenes"
      :key="group.name"
      shadow="never"
      style="margin-top: 12px;">
      <div slot="header" class="card-head">
        <span><i class="el-icon-menu"></i> {{ group.name }}</span>
        <el-tag size="mini">{{ group.list.length }} 个场景</el-tag>
      </div>

      <el-table :data="group.list" size="small">
        <el-table-column label="场景" min-width="200">
          <template slot-scope="{ row }">
            <div class="scene-name">{{ row.sceneName }}</div>
            <div class="scene-meta">
              <code class="mono">{{ row.sceneCode }}</code>
              <i class="el-icon-document-copy copy-btn" title="复制编码" @click="copyCode(row.sceneCode)"></i>
            </div>
            <div v-if="row.description" class="scene-desc">{{ row.description }}</div>
          </template>
        </el-table-column>
        <el-table-column label="接入状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tooltip v-if="row.implemented" effect="dark" placement="top">
              <div slot="content">代码接入位置:<br><code>{{ row.hookLocation || '(未填)' }}</code></div>
              <el-tag size="mini" type="success"><i class="el-icon-check"></i> 已接入</el-tag>
            </el-tooltip>
            <el-tooltip v-else effect="dark" content="业务代码没读取此场景, 配置不会生效, 请开发同学添加 hook 后勾选" placement="top">
              <el-tag size="mini" type="info"><i class="el-icon-warning-outline"></i> 未接入</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="绑定审批流" width="210">
          <template slot-scope="{ row }">
            <el-select v-model="row.flowKey" placeholder="请选择流程" size="mini" clearable style="width:100%;" @change="saveScene(row)">
              <el-option v-for="f in flowList" :key="f.flowKey" :label="f.flowName" :value="f.flowKey">
                <span>{{ f.flowName }}</span>
                <span style="float:right; color:#909399; font-size:12px;">{{ f.flowKey }}</span>
              </el-option>
              <el-option value="__new__" label="+ 新建审批流">
                <span style="color:#409EFF;">+ 新建审批流…</span>
              </el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="流程状态" width="170">
          <template slot-scope="{ row }">
            <template v-if="flowOf(row)">
              <el-tag size="mini">{{ nodeCount(flowOf(row)) }} 个节点</el-tag>
              <el-tag size="mini" :type="flowOf(row).status === 1 ? 'success' : 'warning'" style="margin-left:4px;">
                {{ flowOf(row).status === 1 ? '已部署' : '未部署' }}
              </el-tag>
            </template>
            <span v-else class="muted">未绑定流程</span>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="70" align="center">
          <template slot-scope="{ row }">
            <el-switch v-model="row.enabled" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center">
          <template slot-scope="{ row }">
            <div class="approval-action-group">
              <el-button
                class="approval-action-btn"
                type="primary"
                plain
                size="mini"
                icon="el-icon-set-up"
                :disabled="!row.flowKey"
                @click="goFlowDetail(row.flowKey)">配置节点</el-button>
              <el-button class="approval-action-btn" type="primary" plain size="mini" icon="el-icon-edit-outline" @click="openSceneEdit(row)">编辑</el-button>
              <el-button class="approval-action-btn" type="danger" plain size="mini" icon="el-icon-delete" @click="deleteSceneRow(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-if="!filteredScenes.length && !loading" description="暂无场景, 点上方 [新增场景] 添加" />

    <!-- 流程库（含未被任何场景绑定的流程） -->
    <el-card shadow="never" class="flow-pool" style="margin-top: 16px;">
      <div slot="header" class="card-head">
        <span>
          <i class="el-icon-share"></i> 审批流程库
          <span class="muted" style="margin-left:8px; font-size:12px;">
            共 {{ flowList.length }} 条,其中 {{ unboundFlows.length }} 条未被场景使用
          </span>
        </span>
        <div>
          <el-button class="approval-toolbar-btn" type="primary" plain size="mini" icon="el-icon-plus" @click="openFlowAdd">新增流程</el-button>
          <el-button type="text" size="mini" @click="flowPoolOpen = !flowPoolOpen">
            {{ flowPoolOpen ? '收起' : '展开' }}<i :class="flowPoolOpen ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
          </el-button>
        </div>
      </div>
      <el-table v-show="flowPoolOpen" :data="flowList" size="small">
        <el-table-column label="流程名称" prop="flowName" min-width="160" />
        <el-table-column label="流程标识" width="180">
          <template slot-scope="{ row }"><code class="mono">{{ row.flowKey }}</code></template>
        </el-table-column>
        <el-table-column label="节点数" width="80" align="center">
          <template slot-scope="{ row }"><el-tag size="mini">{{ nodeCount(row) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '已部署' : '草稿' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="被使用" width="180" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="scenesOfFlow(row.flowKey).length" style="font-size:12px;">
              {{ scenesOfFlow(row.flowKey).map(s => s.sceneName).join('、') }}
            </span>
            <el-tag v-else size="mini" type="warning">未被使用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部署ID" width="150" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span style="font-size: 12px; color: #909399;">{{ row.deploymentId || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="{ row }">
            <div class="approval-action-group">
              <el-button class="approval-action-btn" type="primary" plain size="mini" icon="el-icon-set-up" @click="goFlowDetail(row.flowKey)">配置节点</el-button>
              <el-button class="approval-action-btn" type="danger" plain size="mini" icon="el-icon-delete" @click="deleteFlowRow(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增流程弹窗 -->
    <el-dialog title="新增审批流" :visible.sync="flowDialogVisible" width="460px" append-to-body>
      <el-form :model="newBiz" label-width="100px" size="small">
        <el-form-item label="流程名称" required>
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
      <div slot="footer" class="approval-dialog-actions">
        <el-button @click="flowDialogVisible = false">取消</el-button>
        <el-button type="primary" icon="el-icon-check" @click="submitFlowAdd">创建并配置节点</el-button>
      </div>
    </el-dialog>

    <!-- 接入位置选择弹窗 -->
    <el-dialog title="选择接入位置" :visible.sync="endpointDialogVisible" width="780px" append-to-body>
      <div style="display:flex; gap:8px; margin-bottom: 10px;">
        <el-input
          v-model="endpointFilter"
          placeholder="🔍 搜索控制器名 / 方法名 / 描述 / URL 路径 / HTTP方法"
          clearable
          size="small"
          style="flex:1;" />
        <el-select v-model="endpointModuleFilter" size="small" clearable placeholder="模块" style="width: 140px;">
          <el-option v-for="g in endpointGroups" :key="g.module" :label="g.module" :value="g.module" />
        </el-select>
        <el-button class="approval-toolbar-btn" size="small" type="primary" plain icon="el-icon-refresh" @click="loadEndpoints">刷新</el-button>
      </div>
      <div style="font-size: 12px; color: #909399; margin-bottom: 6px;">共 {{ flatFilteredEndpoints.length }} 条</div>
      <el-table :data="flatFilteredEndpoints" size="mini" height="420" highlight-current-row @row-click="pickEndpoint">
        <el-table-column label="模块" prop="module" width="90">
          <template slot-scope="{ row }"><el-tag size="mini" type="info">{{ row.module }}</el-tag></template>
        </el-table-column>
        <el-table-column label="Controller#方法" width="280">
          <template slot-scope="{ row }">
            <b>{{ row.controller }}</b><span style="color:#909399;">#{{ row.method }}</span>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" width="180" show-overflow-tooltip />
        <el-table-column label="URL" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="httpTagType(row.httpMethod)" style="margin-right:4px;">{{ row.httpMethod }}</el-tag>
            <span style="font-size:12px;">{{ row.path }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="approval-dialog-actions">
        <el-button @click="endpointDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 新增/编辑场景弹窗 -->
    <el-dialog :title="editMode === 'add' ? '新增场景' : '编辑场景'" :visible.sync="sceneDialogVisible" width="560px">
      <el-form ref="form" :model="form" label-width="100px" size="small">
        <el-form-item v-if="editMode === 'edit'" label="场景编码">
          <el-input v-model="form.sceneCode" disabled />
          <div class="tip">系统自动生成,创建后不可修改</div>
        </el-form-item>
        <el-form-item label="场景名称" required>
          <el-input v-model="form.sceneName" placeholder="如: 订单退款审批" />
        </el-form-item>
        <el-form-item label="分组" required>
          <el-select v-model="form.sceneGroup" placeholder="请选择或输入" allow-create filterable style="width:100%;">
            <el-option label="商户端" value="商户端" />
            <el-option label="平台" value="平台" />
            <el-option label="OA" value="OA" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="这个场景什么时候触发,给管理员参考" />
        </el-form-item>
        <el-form-item label="绑定审批流">
          <el-select v-model="form.flowKey" placeholder="可稍后绑定" clearable style="width:100%;">
            <el-option v-for="f in flowList" :key="f.flowKey" :label="f.flowName" :value="f.flowKey">
              <span>{{ f.flowName }}</span>
              <span style="float:right; color:#909399; font-size:12px;">{{ f.flowKey }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
          <span class="tip" style="margin-left: 8px;">开启后业务侧才会走审批</span>
        </el-form-item>

        <el-divider content-position="left" style="margin: 20px 0 12px; font-size: 12px; color: #909399;">
          开发接入信息
        </el-divider>

        <el-form-item label="已接入">
          <el-switch v-model="form.implemented" />
          <span class="tip" style="margin-left: 8px;">开发同学添加代码 hook 后勾选</span>
        </el-form-item>
        <el-form-item v-if="form.implemented" label="接入位置">
          <div style="display: flex; gap: 8px;">
            <el-input v-model="form.hookLocation" placeholder="点击右边按钮选择,或直接输入" style="flex:1;" />
            <el-button class="approval-toolbar-btn" type="primary" plain icon="el-icon-search" @click="openEndpointPicker">选择</el-button>
          </div>
          <div class="tip">给其他开发/管理员看的说明,方便定位代码</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="approval-dialog-actions">
        <el-button @click="sceneDialogVisible = false">取消</el-button>
        <el-button type="primary" icon="el-icon-check" @click="submitScene">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listScenes, updateScene, toggleScene, deleteScene, listHookEndpoints } from '@/api/approvalScene';
import { listFlowConfig, createBiz, deleteFlow } from '@/api/approvalFlow';

const emptyForm = () => ({
  id: null, sceneCode: '', sceneName: '', sceneGroup: '商户端',
  description: '', flowKey: '', enabled: false,
  implemented: false, hookLocation: '',
});

export default {
  name: 'ApprovalConfig',
  data() {
    return {
      scenes: [],
      flowList: [],
      loading: false,
      keyword: '',
      enabledFilter: '',
      flowPoolOpen: false,
      // 场景弹窗
      sceneDialogVisible: false,
      editMode: 'add', // add | edit
      form: emptyForm(),
      // 流程弹窗
      flowDialogVisible: false,
      newBiz: { flowName: '', flowKey: '', description: '' },
      // 接入位置选择
      endpointGroups: [],
      endpointFilter: '',
      endpointModuleFilter: '',
      endpointDialogVisible: false,
    };
  },
  computed: {
    flowMap() {
      const m = {};
      this.flowList.forEach(f => { m[f.flowKey] = f; });
      return m;
    },
    filteredScenes() {
      const kw = (this.keyword || '').toLowerCase().trim();
      return this.scenes.filter(s => {
        if (this.enabledFilter !== '' && this.enabledFilter !== null) {
          if (!!s.enabled !== (this.enabledFilter === 1)) return false;
        }
        if (!kw) return true;
        const flowName = (this.flowMap[s.flowKey] && this.flowMap[s.flowKey].flowName) || '';
        return `${s.sceneName || ''}${s.sceneCode || ''}${flowName}`.toLowerCase().includes(kw);
      });
    },
    groupedScenes() {
      const groups = {};
      this.filteredScenes.forEach(s => {
        const g = s.sceneGroup || '其他';
        if (!groups[g]) groups[g] = { name: g, list: [] };
        groups[g].list.push(s);
      });
      return Object.values(groups);
    },
    unboundFlows() {
      const used = new Set(this.scenes.map(s => s.flowKey).filter(Boolean));
      return this.flowList.filter(f => !used.has(f.flowKey));
    },
    flatFilteredEndpoints() {
      const kw = (this.endpointFilter || '').toLowerCase().trim();
      const mod = this.endpointModuleFilter || '';
      const rows = [];
      this.endpointGroups.forEach(g => {
        if (mod && g.module !== mod) return;
        (g.items || []).forEach(it => {
          if (!kw
            || (it.controller && it.controller.toLowerCase().includes(kw))
            || (it.method && it.method.toLowerCase().includes(kw))
            || (it.description && it.description.toLowerCase().includes(kw))
            || (it.path && it.path.toLowerCase().includes(kw))
            || (it.httpMethod && it.httpMethod.toLowerCase().includes(kw))
          ) {
            rows.push({ ...it, module: g.module });
          }
        });
      });
      return rows;
    },
  },
  created() {
    this.loadAll();
    this.loadEndpoints();
  },
  methods: {
    // ===== 数据 =====
    async loadAll() {
      this.loading = true;
      try {
        const [scenesRes, flowsRes] = await Promise.all([
          listScenes().catch(() => null),
          listFlowConfig().catch(() => null),
        ]);
        const scenes = scenesRes && (scenesRes.data !== undefined ? scenesRes.data : scenesRes);
        const flows = flowsRes && (flowsRes.data !== undefined ? flowsRes.data : flowsRes);
        this.scenes = Array.isArray(scenes) ? scenes : [];
        this.flowList = Array.isArray(flows) ? flows : [];
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    async loadEndpoints() {
      try {
        const res = await listHookEndpoints();
        const data = res && (res.data !== undefined ? res.data : res);
        this.endpointGroups = Array.isArray(data) ? data : [];
      } catch (e) {
        this.endpointGroups = [];
      }
    },
    flowOf(scene) {
      return scene.flowKey ? this.flowMap[scene.flowKey] : null;
    },
    nodeCount(flow) {
      return (flow && flow.nodes && flow.nodes.length) || 0;
    },
    scenesOfFlow(flowKey) {
      return this.scenes.filter(s => s.flowKey === flowKey);
    },
    goFlowDetail(flowKey) {
      this.$router.push(`/approvalCenter/config/detail/${flowKey}`);
    },

    // ===== 场景 =====
    async onToggle(row) {
      if (row.enabled && !row.flowKey) {
        row.enabled = false;
        return this.$message.warning('请先绑定审批流再启用');
      }
      try {
        await toggleScene(row.id, row.enabled);
        this.$message.success(row.enabled ? '已启用' : '已停用');
      } catch (e) {
        row.enabled = !row.enabled;
        this.$message.error('切换失败: ' + (e.message || e));
      }
    },
    async saveScene(row) {
      // 行内下拉里选了"+ 新建审批流"：不落库，直接开新增流程弹窗
      if (row.flowKey === '__new__') {
        row.flowKey = '';
        return this.openFlowAdd();
      }
      try {
        await updateScene(row);
        this.$message.success('已更新');
      } catch (e) {
        this.$message.error('保存失败: ' + (e.message || e));
      }
    },
    openSceneAdd() {
      this.editMode = 'add';
      this.form = emptyForm();
      this.sceneDialogVisible = true;
    },
    openSceneEdit(row) {
      this.editMode = 'edit';
      this.form = { ...row };
      this.sceneDialogVisible = true;
    },
    genSceneCode(group) {
      // 分组前缀 + 时间戳后 6 位, 保证唯一且可读
      const prefix = ({ '商户端': 'MER', '平台': 'PLAT', 'OA': 'OA', '其他': 'MISC' })[group] || 'SCENE';
      const tail = Date.now().toString().slice(-6);
      return `${prefix}_${tail}`;
    },
    async submitScene() {
      if (!this.form.sceneName) return this.$message.warning('请填写场景名称');
      if (!this.form.sceneGroup) return this.$message.warning('请选择分组');
      if (this.form.enabled && !this.form.flowKey) {
        return this.$message.warning('启用状态下必须绑定审批流');
      }
      if (this.editMode === 'add') {
        if (!this.form.sceneCode) {
          this.form.sceneCode = this.genSceneCode(this.form.sceneGroup);
        }
        if (this.scenes.find(s => s.sceneCode === this.form.sceneCode)) {
          this.form.sceneCode = this.genSceneCode(this.form.sceneGroup) + '_' + Math.floor(Math.random() * 100);
        }
      }
      try {
        await updateScene(this.form);
        this.sceneDialogVisible = false;
        const isAdd = this.editMode === 'add';
        this.$message.success(isAdd ? `已新增, 场景编码: ${this.form.sceneCode}` : '已更新');
        this.loadAll();
      } catch (e) {
        this.$message.error('保存失败: ' + (e.message || e));
      }
    },
    async deleteSceneRow(row) {
      this.$confirm(`确定删除场景 [${row.sceneName}] (${row.sceneCode})?`, '提示', { type: 'warning' })
        .then(async () => {
          await deleteScene(row.id);
          this.$message.success('已删除');
          this.loadAll();
        }).catch(() => {});
    },

    // ===== 流程 =====
    openFlowAdd() {
      this.newBiz = { flowName: '', flowKey: '', description: '' };
      this.flowDialogVisible = true;
    },
    async submitFlowAdd() {
      const { flowName, flowKey } = this.newBiz;
      if (!flowName || !flowKey) return this.$message.warning('请填写完整');
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(flowKey)) {
        return this.$message.warning('流程标识必须字母开头,只允许字母/数字/下划线');
      }
      if (this.flowList.find(b => b.flowKey === flowKey)) return this.$message.warning('流程标识已存在');
      try {
        await createBiz(this.newBiz);
        this.flowDialogVisible = false;
        this.$message.success('已创建');
        this.goFlowDetail(flowKey);
      } catch (e) {
        this.$message.error('创建失败: ' + (e.message || e));
      }
    },
    async deleteFlowRow(row) {
      const used = this.scenesOfFlow(row.flowKey);
      const extra = used.length ? `\n该流程正被 ${used.length} 个场景使用(${used.map(s => s.sceneName).join('、')}),删除后这些场景将失去审批流。` : '';
      this.$confirm(`确定删除审批流 [${row.flowName}]?${extra}`, '提示', { type: 'warning' })
        .then(async () => {
          await deleteFlow(row.flowKey);
          this.$message.success('已删除');
          this.loadAll();
        }).catch(() => {});
    },

    // ===== 接入位置 =====
    openEndpointPicker() {
      this.endpointFilter = '';
      this.endpointModuleFilter = '';
      this.endpointDialogVisible = true;
      if (!this.endpointGroups.length) this.loadEndpoints();
    },
    pickEndpoint(row) {
      this.form.hookLocation = row.value;
      this.endpointDialogVisible = false;
    },
    httpTagType(m) {
      return ({ GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' })[m] || 'info';
    },
    copyCode(code) {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        this.$message.success(`已复制: ${code}`);
      } catch {
        this.$message.warning('复制失败,请手动选择');
      } finally {
        document.body.removeChild(ta);
      }
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 12px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.filter-card >>> .el-card__body { padding: 12px 16px; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.scene-name { font-weight: 500; }
.scene-meta { margin-top: 2px; }
.scene-desc { font-size: 12px; color: #909399; margin-top: 2px; }
.mono { background: #f2f3f5; color: #606266; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
.copy-btn { margin-left: 6px; cursor: pointer; color: #909399; }
.copy-btn:hover { color: #409EFF; }
.muted { color: #909399; }
.tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.6; }
.flow-pool >>> .el-card__body { padding: 0 16px 16px; }
</style>
