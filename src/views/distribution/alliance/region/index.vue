<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        一区一代理：一个区域同时只允许存在一位生效代理。该区已有代理时「开通」会被后端拒绝，
        新申请人一律进候补队列，等现任停用且待结算收益结清后再启用。
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="选择区域">
          <el-cascader
            v-model="regionIds"
            :options="cityOptions"
            :props="cascaderProps"
            class="selWidth"
            clearable
            filterable
            placeholder="请选择省/市/区"
            @change="onRegionChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!regionCode" :loading="loading" @click="loadAll">查询</el-button>
          <el-button type="success" :disabled="!regionCode" @click="openAgentDialog">开通代理</el-button>
        </el-form-item>
      </el-form>
      <div v-if="regionCode" class="region-meta">
        区域编码：<b>{{ regionCode }}</b>　区域名称：{{ regionName || '-' }}　路径：{{ regionPath || '-' }}
      </div>
    </el-card>

    <el-card class="box-card mt16" shadow="never" :bordered="false" v-loading="listLoading">
      <div slot="header">
        全部区域代理
        <span class="sub">默认只列生效记录。交接产生的历史行要勾「含已失效」才出，否则一个区会看到好几条</span>
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="区域编码前缀">
          <el-input
            v-model.trim="listQuery.regionPrefix"
            placeholder="44=广东 4401=广州，留空查全国"
            clearable
            class="selWidth"
            @keyup.enter.native="loadAgentList(1)"
          />
        </el-form-item>
        <el-form-item label="代理 uid">
          <el-input-number
            v-model="listQuery.agentUid"
            :min="1"
            :controls="false"
            placeholder="不限"
            class="uidWidth"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="listQuery.includeInactive" @change="loadAgentList(1)">含已失效</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAgentList(1)">查询</el-button>
          <el-button @click="resetAgentList">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="agentList" size="small" border>
        <el-table-column prop="regionCode" label="区域编码" width="110" />
        <el-table-column prop="regionName" label="区域名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="代理" min-width="170">
          <template slot-scope="{ row }">
            <div>{{ agentName(row) }}</div>
            <div class="sub-line">uid {{ row.agentUid }}{{ agentPhone(row) ? ' · ' + agentPhone(row) : '' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="contractNo" label="合同号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="leaderCount" label="名下团长" width="90" />
        <el-table-column label="补贴比例" width="90">
          <template slot-scope="{ row }">{{ row.subsidyRatio || 0 }}%</template>
        </el-table-column>
        <el-table-column label="合作期" min-width="200">
          <template slot-scope="{ row }">{{ termText(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="agentTagType(row)">{{ agentStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="开通时间" min-width="150" />
        <el-table-column label="操作" width="170" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="viewRegion(row)">查看</el-button>
            <el-button type="text" size="small" @click="openEditDialog(row)">修改</el-button>
            <el-button
              v-if="row.status === 1 && Number(row.activeKey) === 0"
              type="text"
              size="small"
              class="danger-text"
              @click="onDisable(row)"
            >停用</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="listQuery.size"
          :current-page="listQuery.page"
          :total="agentTotal"
          @size-change="onSizeChange"
          @current-change="loadAgentList"
        />
      </div>
    </el-card>

    <el-card class="box-card mt16" shadow="never" :bordered="false" v-loading="loading">
      <div slot="header">当前生效代理</div>
      <el-form v-if="agent" label-width="110px" class="agent-detail">
        <el-row>
          <el-col :span="8"><el-form-item label="代理 uid：">{{ agent.agentUid || '-' }}</el-form-item></el-col>
          <el-col :span="8"><el-form-item label="合同号：">{{ agent.contractNo || '-' }}</el-form-item></el-col>
          <el-col :span="8"><el-form-item label="补贴比例：">{{ agent.subsidyRatio || 0 }}%</el-form-item></el-col>
          <el-col :span="8"><el-form-item label="名下团长数：">{{ agent.leaderCount || 0 }}</el-form-item></el-col>
          <el-col :span="8"><el-form-item label="状态：">
            <el-tag :type="agent.status === 1 ? 'success' : 'info'" size="mini">
              {{ agent.status === 1 ? '生效' : '已失效' }}
            </el-tag>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="开通时间：">{{ agent.createTime || '-' }}</el-form-item></el-col>
        </el-row>
        <el-form-item>
          <el-button type="warning" size="small" @click="openHandoverDialog">代理交接</el-button>
        </el-form-item>
      </el-form>
      <div v-else class="empty">{{ regionCode ? '该区域暂无生效代理，团长申请将由平台兜底审批' : '请先选择区域' }}</div>
    </el-card>

    <el-card class="box-card mt16" shadow="never" :bordered="false" v-loading="loading">
      <div slot="header">候补队列</div>
      <el-table :data="queue" size="small" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="applicantUid" label="申请人 uid" width="110" />
        <el-table-column prop="realName" label="姓名" min-width="100" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="description" label="说明" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="queueTagType(row.status)">{{ queueStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="queueTime" label="排队时间" min-width="150" />
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="{ row }">
            <el-button v-if="row.status === 0" type="text" size="small" @click="onEnable(row)">启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="box-card mt16" shadow="never" :bordered="false" v-loading="loading">
      <div slot="header">
        历史归属版本
        <span class="sub">交接会让版本号递增，历史订单按当时的版本追溯归属，不回溯改算</span>
      </div>
      <el-table :data="assignments" size="small" border>
        <el-table-column prop="version" label="版本" width="70" />
        <el-table-column prop="agentUid" label="代理 uid" width="110" />
        <el-table-column prop="agentId" label="代理记录 ID" width="120" />
        <el-table-column prop="regionPath" label="区域路径" min-width="140" />
        <el-table-column prop="startTime" label="生效时间" min-width="150" />
        <el-table-column label="失效时间" min-width="150">
          <template slot-scope="{ row }">{{ row.endTime || '当前生效' }}</template>
        </el-table-column>
        <el-table-column prop="handoverReason" label="交接原因" min-width="160" show-overflow-tooltip />
      </el-table>
    </el-card>

    <el-dialog title="开通区域代理" :visible.sync="agentDialog" width="520px">
      <el-form ref="agentForm" :model="agentForm" :rules="agentRules" label-width="110px" size="small">
        <el-form-item label="区域">{{ regionName }}（{{ regionCode }}）</el-form-item>
        <el-form-item label="代理 uid" prop="agentUid">
          <el-input-number
            v-model="agentForm.agentUid"
            :min="1"
            :controls="false"
            class="selWidth"
            @change="lookupAgentUser"
          />
          <!--
            填完当场显示是谁。在此之前这里只是个数字，填错了照样开通成功，
            结果是一条没人能登录使用的空壳记录 —— 列表显示生效、分账照算，
            但团长申请堆在那里永远没人审批。
          -->
          <div v-if="uidChecking" class="uid-hint">查询中…</div>
          <div v-else-if="uidBrief && uidBrief.valid" class="uid-hint ok">
            {{ uidBrief.nickname || '（未设昵称）' }}　{{ uidBrief.phone }}
          </div>
          <div v-else-if="uidBrief" class="uid-hint bad">
            查无此人或账号不可用，请确认填的是商城用户的 uid
          </div>
        </el-form-item>
        <el-form-item label="合同号" prop="contractNo">
          <el-input v-model.trim="agentForm.contractNo" maxlength="64" class="selWidth" />
        </el-form-item>
        <el-form-item label="补贴比例">
          <el-input-number v-model="agentForm.subsidyRatio" :min="0" :max="100" :precision="2" class="selWidth" />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="合作期">
          <el-date-picker
            v-model="agentForm.term"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            class="selWidth"
          />
        </el-form-item>
        <div class="tips">
          留空表示长期有效。<b>到期后该代理的全部功能立即不可用</b> ——
          审批团长申请、名下团长、分成明细、邀请码一律拒绝，该区在分账时视同无代理走平台兜底。
          已产生的分成不受影响。
        </div>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="agentDialog = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitOpen">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="修改代理" :visible.sync="editDialog" width="560px">
      <div class="tips">
        只能改合同信息与合作期。<b>换人请用「代理交接」</b> ——
        那条路会校验待结算收益并开新的归属版本，在这里改人会让历史业绩凭空转到别人名下。
      </div>
      <el-form ref="editForm" :model="editForm" label-width="110px" size="small">
        <el-form-item label="区域">{{ editForm.regionName }}（{{ editForm.regionCode }}）</el-form-item>
        <el-form-item label="代理">{{ editForm.agentName }}（uid {{ editForm.agentUid }}）</el-form-item>
        <el-form-item label="合同号">
          <el-input v-model.trim="editForm.contractNo" maxlength="64" class="selWidth" />
        </el-form-item>
        <el-form-item label="补贴比例">
          <el-input-number v-model="editForm.subsidyRatio" :min="0" :max="100" :precision="2" class="selWidth" />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="合作期">
          <el-date-picker
            v-model="editForm.term"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            class="selWidth"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editDialog = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitEdit">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="代理交接" :visible.sync="handoverDialog" width="520px">
      <div class="tips">现任代理有待结算收益时不允许交接，必须先结清。待结算金额需要从结算侧核对后填入。</div>
      <el-form ref="handoverForm" :model="handoverForm" :rules="handoverRules" label-width="130px" size="small">
        <el-form-item label="新代理 uid" prop="newAgentUid">
          <el-input-number v-model="handoverForm.newAgentUid" :min="1" :controls="false" class="selWidth" />
        </el-form-item>
        <el-form-item label="现任待结算(元)">
          <el-input-number v-model="handoverForm.pendingSettleYuan" :min="0" :precision="2" class="selWidth" />
        </el-form-item>
        <el-form-item label="交接原因" prop="reason">
          <el-input v-model.trim="handoverForm.reason" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="handoverDialog = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitHandover">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request';
import {
  openRegionAgent,
  getRegionAgent,
  getRegionQueue,
  enableFromQueue,
  handoverRegionAgent,
  getRegionAssignments,
  getAgentList,
  updateRegionAgent,
  disableRegionAgent,
  getUserBrief,
} from '@/api/alliance';

const cityListTree = () => request({ url: '/admin/merchant/city/region/city/tree', method: 'get' });

export default {
  name: 'AllianceRegionAgent',
  data() {
    return {
      loading: false,
      listLoading: false,
      saving: false,
      agentList: [],
      agentTotal: 0,
      // agentUid -> {nickname, phone, valid}，由列表接口一次性带回来
      agentUsers: {},
      uidBrief: null,
      uidChecking: false,
      listQuery: { regionPrefix: '', agentUid: undefined, includeInactive: false, page: 1, size: 20 },
      cityOptions: [],
      cascaderProps: { value: 'id', label: 'name', children: 'child', checkStrictly: true, emitPath: true },
      regionIds: [],
      regionCode: '',
      regionName: '',
      regionPath: '',
      agent: null,
      queue: [],
      assignments: [],
      agentDialog: false,
      // term 是 [开始, 结束] 的数组，提交时才拆成两个字段；留空即长期有效
      agentForm: { agentUid: undefined, contractNo: '', subsidyRatio: 0, term: null },
      editDialog: false,
      editForm: {
        id: null, regionCode: '', regionName: '', agentUid: null, agentName: '',
        contractNo: '', subsidyRatio: 0, term: null,
      },
      agentRules: {
        agentUid: [{ required: true, message: '请填写代理 uid', trigger: 'blur' }],
        contractNo: [{ required: true, message: '请填写签约合同号', trigger: 'blur' }],
      },
      handoverDialog: false,
      handoverForm: { newAgentUid: undefined, pendingSettleYuan: 0, reason: '' },
      handoverRules: {
        newAgentUid: [{ required: true, message: '请填写新代理 uid', trigger: 'blur' }],
        reason: [{ required: true, message: '请填写交接原因', trigger: 'blur' }],
      },
    };
  },
  created() {
    this.loadCityTree();
    this.loadAgentList(1);
  },
  methods: {
    async loadCityTree() {
      try {
        const res = await cityListTree();
        const list = Array.isArray(res) ? res : (res && res.list) || [];
        this.cityOptions = this.normalizeTree(list);
      } catch (e) {
        /* 树没拉到不影响其它区块，选择器留空即可 */
      }
    },
    /**
     * 只保留省/市/区三级。城市树带第四级（街道/乡镇），
     * 而联盟的区域粒度到区县为止，多一级只会让人选出后端不认的编码。
     */
    normalizeTree(list, depth = 1) {
      if (!Array.isArray(list)) return [];
      return list.map((n) => {
        const children = n.child || n.children;
        const item = { id: String(n.regionId != null ? n.regionId : n.id), name: n.regionName || n.name };
        if (depth < 3 && Array.isArray(children) && children.length) {
          item.child = this.normalizeTree(children, depth + 1);
        }
        return item;
      });
    },
    async loadAgentList(page) {
      this.listQuery.page = page || this.listQuery.page;
      this.listLoading = true;
      try {
        const res = await getAgentList({
          regionPrefix: this.listQuery.regionPrefix || undefined,
          agentUid: this.listQuery.agentUid || undefined,
          includeInactive: this.listQuery.includeInactive,
          page: this.listQuery.page,
          size: this.listQuery.size,
        });
        this.agentList = (res && res.list) || [];
        this.agentTotal = (res && res.total) || 0;
        this.agentUsers = (res && res.users) || {};
      } catch (e) {
        this.agentList = [];
        this.agentTotal = 0;
        this.agentUsers = {};
      } finally {
        this.listLoading = false;
      }
    },
    onSizeChange(size) {
      this.listQuery.size = size;
      this.loadAgentList(1);
    },
    resetAgentList() {
      this.listQuery = { regionPrefix: '', agentUid: undefined, includeInactive: false, page: 1, size: 20 };
      this.loadAgentList(1);
    },
    /**
     * activeKey 才是「是不是当前占着名额那条」，status 只说这条记录本身停没停用，
     * endTime 决定还能不能用 —— 三者合起来才是完整状态。
     *
     * 「已到期」和后端取生效代理时的时间判定是同一个口径：过期即代理端全部功能不可用，
     * 但记录还占着该区名额，所以它既不是「已停用」也不能算「生效」。
     */
    agentStatusText(row) {
      if (row.status !== 1) return '已停用';
      if (Number(row.activeKey) !== 0) return '历史';
      if (this.isExpired(row)) return '已到期';
      if (this.notStarted(row)) return '未开始';
      return '生效';
    },
    agentTagType(row) {
      if (row.status !== 1) return 'info';
      if (Number(row.activeKey) !== 0) return 'info';
      if (this.isExpired(row)) return 'danger';
      if (this.notStarted(row)) return 'warning';
      return 'success';
    },
    /**
     * uid 在用户表里查不到时明确写出来。
     *
     * 这种记录是空壳：列表显示生效、分账也照算，但没有任何人能登录代理端，
     * 团长申请提交上去永远没人审批。不标出来运营根本发现不了。
     */
    agentName(row) {
      const u = this.agentUsers[row.agentUid];
      if (!u) return '查无此人';
      if (!u.valid) return `${u.nickname || '（未设昵称）'}（账号不可用）`;
      return u.nickname || '（未设昵称）';
    },
    agentPhone(row) {
      const u = this.agentUsers[row.agentUid];
      return u ? u.phone : '';
    },
    async lookupAgentUser(uid) {
      this.uidBrief = null;
      if (!uid) return;
      this.uidChecking = true;
      try {
        this.uidBrief = await getUserBrief(uid);
      } catch (e) {
        this.uidBrief = null;
      } finally {
        this.uidChecking = false;
      }
    },
    isExpired(row) {
      return !!row.endTime && new Date(row.endTime.replace(/-/g, '/')).getTime() < Date.now();
    },
    notStarted(row) {
      return !!row.startTime && new Date(row.startTime.replace(/-/g, '/')).getTime() > Date.now();
    },
    termText(row) {
      if (!row.startTime && !row.endTime) return '长期有效';
      return `${row.startTime || '即时'} ~ ${row.endTime || '长期'}`;
    },
    termStart(term) {
      return Array.isArray(term) && term.length === 2 ? term[0] : undefined;
    },
    termEnd(term) {
      return Array.isArray(term) && term.length === 2 ? term[1] : undefined;
    },
    openEditDialog(row) {
      this.editForm = {
        id: row.id,
        agentName: this.agentName(row),
        regionCode: row.regionCode,
        regionName: row.regionName,
        agentUid: row.agentUid,
        contractNo: row.contractNo || '',
        subsidyRatio: Number(row.subsidyRatio) || 0,
        term: row.startTime && row.endTime ? [row.startTime, row.endTime] : null,
      };
      this.editDialog = true;
    },
    async submitEdit() {
      this.saving = true;
      try {
        await updateRegionAgent(this.editForm.id, {
          contractNo: this.editForm.contractNo,
          subsidyRatio: this.editForm.subsidyRatio,
          startTime: this.termStart(this.editForm.term),
          endTime: this.termEnd(this.editForm.term),
        });
        this.$message.success('已保存');
        this.editDialog = false;
        this.loadAgentList(this.listQuery.page);
        if (this.regionCode === this.editForm.regionCode) this.loadAll();
      } catch (e) {
        /* 拦截器已弹过错误 */
      } finally {
        this.saving = false;
      }
    },
    async onDisable(row) {
      try {
        await this.$confirm(
          `确认停用 ${row.regionName || row.regionCode} 的代理（uid ${row.agentUid}）？` +
            '停用后该代理端全部功能立即不可用，该区名额释放，可重新开通或从候补队列启用。' +
            '历史分账记录不受影响。',
          '提示',
          { type: 'warning' },
        );
      } catch (e) {
        return;
      }
      try {
        await disableRegionAgent(row.id, '平台停用');
        this.$message.success('已停用');
        this.loadAgentList(this.listQuery.page);
        if (this.regionCode === row.regionCode) this.loadAll();
      } catch (e) {
        /* 拦截器已弹过错误 */
      }
    },
    /**
     * 从列表跳到下面的区域详情。
     *
     * 只填 regionCode/Name/Path，不回填上面的级联选择器 —— 那需要把编码反查成
     * 省市区三级 id 路径，城市树里没有现成的反查，为一个跳转做一份反查得不偿失。
     */
    viewRegion(row) {
      this.regionCode = row.regionCode;
      this.regionName = row.regionName || '';
      this.regionPath = row.regionPath || '';
      this.loadAll();
      this.$nextTick(() => {
        const el = this.$el.querySelector('.agent-detail') || this.$el;
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    onRegionChange(ids) {
      if (!ids || !ids.length) {
        this.regionCode = '';
        this.regionName = '';
        this.regionPath = '';
        this.resetResult();
        return;
      }
      this.regionCode = String(ids[ids.length - 1]);
      this.regionPath = ids.join(',');
      this.regionName = this.pathNames(ids).join('/');
      this.loadAll();
    },
    pathNames(ids) {
      const names = [];
      let level = this.cityOptions;
      ids.forEach((id) => {
        const hit = (level || []).find((n) => String(n.id) === String(id));
        if (hit) {
          names.push(hit.name);
          level = hit.child;
        }
      });
      return names;
    },
    resetResult() {
      this.agent = null;
      this.queue = [];
      this.assignments = [];
    },
    async loadAll() {
      if (!this.regionCode) return;
      this.loading = true;
      try {
        // 三个接口互不依赖，并行拉；任一失败不该把另外两块也清空
        const [agent, queue, assignments] = await Promise.all([
          getRegionAgent(this.regionCode).catch(() => null),
          getRegionQueue(this.regionCode).catch(() => []),
          getRegionAssignments(this.regionCode).catch(() => []),
        ]);
        this.agent = agent && agent.id ? agent : null;
        this.queue = Array.isArray(queue) ? queue : [];
        this.assignments = Array.isArray(assignments) ? assignments : [];
      } finally {
        this.loading = false;
      }
    },
    queueStatusText(s) {
      return { 0: '候补中', 1: '已启用', 2: '已放弃', 3: '已拒绝' }[s] || '-';
    },
    queueTagType(s) {
      return { 0: 'warning', 1: 'success', 2: 'info', 3: 'danger' }[s] || 'info';
    },
    openAgentDialog() {
      if (this.agent) {
        this.$message.warning('该区域已有生效代理，新申请人请走候补队列');
        return;
      }
      this.agentForm = { agentUid: undefined, contractNo: '', subsidyRatio: 0, term: null };
      this.uidBrief = null;
      this.agentDialog = true;
      this.$nextTick(() => this.$refs.agentForm && this.$refs.agentForm.clearValidate());
    },
    submitOpen() {
      this.$refs.agentForm.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await openRegionAgent({
            regionCode: this.regionCode,
            regionName: this.regionName,
            regionPath: this.regionPath,
            agentUid: this.agentForm.agentUid,
            contractNo: this.agentForm.contractNo,
            subsidyRatio: this.agentForm.subsidyRatio,
            startTime: this.termStart(this.agentForm.term),
            endTime: this.termEnd(this.agentForm.term),
          });
          this.$message.success('开通成功');
          this.agentDialog = false;
          this.loadAll();
          this.loadAgentList(1);
        } catch (e) {
          /* 拦截器已弹过错误 */
        } finally {
          this.saving = false;
        }
      });
    },
    async onEnable(row) {
      try {
        await this.$confirm(`确认从候补队列启用 uid ${row.applicantUid} 为该区代理？`, '提示', { type: 'warning' });
      } catch (e) {
        return;
      }
      try {
        await enableFromQueue(row.id, this.regionPath);
        this.$message.success('已启用');
        this.loadAll();
        this.loadAgentList(1);
      } catch (e) {
        /* 拦截器已弹过错误 */
      }
    },
    openHandoverDialog() {
      this.handoverForm = { newAgentUid: undefined, pendingSettleYuan: 0, reason: '' };
      this.handoverDialog = true;
      this.$nextTick(() => this.$refs.handoverForm && this.$refs.handoverForm.clearValidate());
    },
    submitHandover() {
      this.$refs.handoverForm.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await handoverRegionAgent({
            regionCode: this.regionCode,
            newAgentUid: this.handoverForm.newAgentUid,
            reason: this.handoverForm.reason,
            // 后端金额单位是分，页面按元填，这里换算并取整，避免浮点尾数
            pendingSettleAmount: Math.round((this.handoverForm.pendingSettleYuan || 0) * 100),
          });
          this.$message.success('交接完成');
          this.handoverDialog = false;
          this.loadAll();
          this.loadAgentList(this.listQuery.page);
        } catch (e) {
          /* 拦截器已弹过错误 */
        } finally {
          this.saving = false;
        }
      });
    },
  },
};
</script>

<style scoped lang="scss">
.mt16 {
  margin-top: 16px;
}
.selWidth {
  width: 260px;
}
.uidWidth {
  width: 120px;
}
.danger-text {
  color: #f56c6c;
}
.sub-line {
  color: #999;
  font-size: 12px;
}
.uid-hint {
  font-size: 12px;
  line-height: 18px;
  color: #999;

  &.ok {
    color: #67c23a;
  }
  &.bad {
    color: #f56c6c;
  }
}
.pager {
  margin-top: 12px;
  text-align: right;
}
.tips {
  color: #999;
  font-size: 13px;
  line-height: 20px;
  margin-bottom: 12px;
}
.region-meta {
  font-size: 13px;
  color: #666;
}
.empty {
  color: #999;
  font-size: 13px;
}
.sub {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}
.unit {
  margin-left: 6px;
  color: #666;
}
.agent-detail ::v-deep .el-form-item {
  margin-bottom: 4px;
}
</style>
