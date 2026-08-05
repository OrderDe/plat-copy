<template>
  <div class="app-container">
    <div class="page-header">
      <div class="page-title">审批场景配置</div>
      <div class="page-sub">
        为业务系统的关键操作开启审批流。开启后,商户/员工执行对应操作时会自动出现"发起审批"入口。
      </div>
    </div>

    <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
      <template slot="title">
        💡 <b>接入状态</b> 由开发者在编辑弹窗里维护:接入代码后勾选"已接入"并填写位置,便于其他人查阅。
        <el-tag size="mini" type="success" style="margin: 0 4px;">已接入</el-tag> = 业务代码已 hook,配置生效;
        <el-tag size="mini" type="info" style="margin: 0 4px;">未接入</el-tag> = 仅数据库有记录,业务代码未读取,配置不生效。
      </template>
    </el-alert>

    <div style="margin-bottom: 12px; text-align: right;">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openAdd">新增场景</el-button>
    </div>

    <el-card
      v-for="group in groupedScenes"
      :key="group.name"
      shadow="never"
      style="margin-bottom: 12px;">
      <div slot="header" class="card-head">
        <span><i class="el-icon-menu"></i> {{ group.name }}</span>
        <el-tag size="mini">{{ group.list.length }} 个场景</el-tag>
      </div>

      <el-table :data="group.list" size="small">
        <el-table-column label="场景名称" prop="sceneName" width="160" />
        <el-table-column label="接入状态" width="180">
          <template slot-scope="{ row }">
            <el-tooltip v-if="row.implemented" effect="dark" placement="top">
              <div slot="content">
                代码接入位置:<br>
                <code>{{ row.hookLocation || '(未填)' }}</code>
              </div>
              <el-tag size="mini" type="success"><i class="el-icon-check"></i> 已接入</el-tag>
            </el-tooltip>
            <el-tooltip v-else effect="dark" content="业务代码没读取此场景, 配置不会生效, 请开发同学添加 hook 后勾选" placement="top">
              <el-tag size="mini" type="info"><i class="el-icon-warning-outline"></i> 未接入</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="场景编码" width="220">
          <template slot-scope="{ row }">
            <code class="scene-code">{{ row.sceneCode }}</code>
            <i class="el-icon-document-copy copy-btn" title="复制编码" @click="copyCode(row.sceneCode)"></i>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" show-overflow-tooltip />
        <el-table-column label="绑定审批流" width="220">
          <template slot-scope="{ row }">
            <el-select v-model="row.flowKey" placeholder="请选择流程" size="mini" clearable style="width:100%;" @change="saveScene(row)">
              <el-option v-for="f in flowList" :key="f.flowKey" :label="f.flowName" :value="f.flowKey">
                <span>{{ f.flowName }}</span>
                <span style="float:right; color:#909399; font-size:12px;">{{ f.flowKey }}</span>
              </el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template slot-scope="{ row }">
            <el-switch v-model="row.enabled" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template slot-scope="{ row }">
            <el-button type="text" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" style="color:#f56c6c;" @click="deleteRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-if="!scenes.length && !loading" description="暂无场景, 点右上角 [新增场景] 添加" />

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
        <el-button size="small" icon="el-icon-refresh" @click="loadEndpoints">刷新</el-button>
      </div>
      <div style="font-size: 12px; color: #909399; margin-bottom: 6px;">共 {{ flatFilteredEndpoints.length }} 条</div>
      <el-table :data="flatFilteredEndpoints" size="mini" height="420" @row-click="pickEndpoint" highlight-current-row>
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
      <div slot="footer">
        <el-button @click="endpointDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 新增/编辑场景弹窗 -->
    <el-dialog :title="editMode === 'add' ? '新增场景' : '编辑场景'" :visible.sync="dialogVisible" width="560px">
      <el-form :model="form" label-width="100px" size="small" ref="form">
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
        <el-form-item label="接入位置" v-if="form.implemented">
          <div style="display: flex; gap: 8px;">
            <el-input v-model="form.hookLocation" placeholder="点击右边按钮选择,或直接输入" style="flex:1;" />
            <el-button icon="el-icon-search" @click="openEndpointPicker">选择</el-button>
          </div>
          <div class="tip">给其他开发/管理员看的说明,方便定位代码</div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listScenes, updateScene, toggleScene, deleteScene, listHookEndpoints } from '@/api/approvalScene';
import { listFlowConfig } from '@/api/approvalFlow';

const emptyForm = () => ({
  id: null, sceneCode: '', sceneName: '', sceneGroup: '商户端',
  description: '', flowKey: '', enabled: false,
  implemented: false, hookLocation: '',
});

export default {
  name: 'ApprovalScene',
  data() {
    return {
      scenes: [],
      flowList: [],
      loading: false,
      dialogVisible: false,
      editMode: 'add',       // add | edit
      form: emptyForm(),
      endpointGroups: [],    // Controller 方法数据
      endpointFilter: '',    // 搜索关键字
      endpointModuleFilter: '',
      endpointDialogVisible: false,
    };
  },
  computed: {
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
    groupedScenes() {
      const groups = {};
      this.scenes.forEach(s => {
        const g = s.sceneGroup || '其他';
        if (!groups[g]) groups[g] = { name: g, list: [] };
        groups[g].list.push(s);
      });
      return Object.values(groups);
    },
  },
  created() { this.loadAll(); this.loadEndpoints(); },
  methods: {
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
    async loadEndpoints() {
      try {
        const res = await listHookEndpoints();
        const data = res && (res.data !== undefined ? res.data : res);
        this.endpointGroups = Array.isArray(data) ? data : [];
      } catch (e) {
        this.endpointGroups = [];
      }
    },
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
    async onToggle(row) {
      try {
        await toggleScene(row.id, row.enabled);
        this.$message.success(row.enabled ? '已启用' : '已停用');
      } catch (e) {
        row.enabled = !row.enabled;
        this.$message.error('切换失败: ' + (e.message || e));
      }
    },
    async saveScene(row) {
      try {
        await updateScene(row);
        this.$message.success('已更新');
      } catch (e) {
        this.$message.error('保存失败: ' + (e.message || e));
      }
    },
    openAdd() {
      this.editMode = 'add';
      this.form = emptyForm();
      this.dialogVisible = true;
    },
    openEdit(row) {
      this.editMode = 'edit';
      this.form = { ...row };
      this.dialogVisible = true;
    },
    genSceneCode(group) {
      // 分组前缀 + 时间戳后 6 位, 保证唯一且可读
      const prefix = ({ '商户端': 'MER', '平台': 'PLAT', 'OA': 'OA', '其他': 'MISC' })[group] || 'SCENE';
      const tail = Date.now().toString().slice(-6);
      return `${prefix}_${tail}`;
    },
    async submit() {
      if (!this.form.sceneName) return this.$message.warning('请填写场景名称');
      if (!this.form.sceneGroup) return this.$message.warning('请选择分组');
      if (this.form.enabled && !this.form.flowKey) {
        return this.$message.warning('启用状态下必须绑定审批流');
      }
      // 新增时自动生成 sceneCode
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
        this.dialogVisible = false;
        const isAdd = this.editMode === 'add';
        this.$message.success(isAdd ? `已新增, 场景编码: ${this.form.sceneCode}` : '已更新');
        this.loadAll();
      } catch (e) {
        this.$message.error('保存失败: ' + (e.message || e));
      }
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
    async deleteRow(row) {
      this.$confirm(`确定删除场景 [${row.sceneName}] (${row.sceneCode})?`, '提示', { type: 'warning' })
        .then(async () => {
          await deleteScene(row.id);
          this.$message.success('已删除');
          this.loadAll();
        }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 12px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.scene-code { background: #f2f3f5; color: #606266; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
.copy-btn { margin-left: 6px; cursor: pointer; color: #909399; }
.copy-btn:hover { color: #409EFF; }
.tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.6; }
</style>
