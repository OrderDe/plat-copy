<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false" v-loading="listLoading">
      <div slot="header">
        全部区域代理
        <span class="sub">默认只列生效记录。交接产生的历史行要勾「含已失效」才出，否则一个区会看到好几条</span>
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="城市">
          <!-- 选到哪一级就用哪一级的编码当前缀：选省查全省，选市查全市，选区查一个区 -->
          <el-cascader
            v-model="listRegionIds"
            :options="cityOptions"
            :props="cascaderProps"
            clearable
            filterable
            class="selWidth"
            placeholder="请选择省/市/区，留空查全国"
            @change="onListRegionChange"
          />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input
            v-model.trim="listQuery.contact"
            placeholder="联系人姓名或手机号"
            clearable
            class="selWidth"
            @keyup.enter.native="loadAgentList(1)"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="listQuery.includeInactive" @change="loadAgentList(1)">含已失效</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAgentList(1)">查询</el-button>
          <el-button @click="resetAgentList">重置</el-button>
          <el-button type="success" @click="openAgentDialog">开通代理</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="agentList" size="small" border>
        <el-table-column prop="regionCode" label="区域编码" width="110" />
        <el-table-column prop="regionName" label="区域名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="代理" min-width="170">
          <template slot-scope="{ row }">
            <div>{{ agentName(row) }}</div>
            <div v-if="agentPhone(row)" class="sub-line">{{ agentPhone(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" min-width="150">
          <template slot-scope="{ row }">
            <div>{{ row.contactName || '-' }}</div>
            <div v-if="row.contactPhone" class="sub-line">{{ row.contactPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="名下团长" width="120">
          <template slot-scope="{ row }">
            <span>{{ row.leaderCount || 0 }}</span>
            <el-button type="text" size="small" class="ml6" @click="viewLeaders(row)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="合作期" min-width="200">
          <template slot-scope="{ row }">{{ termText(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="150">
          <template slot-scope="{ row }">
            <!--
              开关只能从「生效」拨到「停用」，反向拨不回来：
              停用会把 active_key 回填、腾出该区名额，这期间可能已经开了新代理，
              直接改回 status=1 会让同区出现两条 active_key=0 撞唯一索引。
              要恢复请重新开通或从候补队列启用。
            -->
            <el-switch
              :value="row.status === 1 && Number(row.activeKey) === 0"
              :disabled="!(row.status === 1 && Number(row.activeKey) === 0)"
              active-color="#13ce66"
              @change="onToggleStatus(row)"
            />
            <el-tag size="mini" class="ml6" :type="agentTagType(row)">{{ agentStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="开通时间" min-width="150" />
        <el-table-column label="操作" width="220" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="viewRegion(row)">查看</el-button>
            <el-button type="text" size="small" @click="openEditDialog(row)">修改</el-button>
            <el-button
              v-if="row.status === 1 && Number(row.activeKey) === 0"
              type="text"
              size="small"
              @click="openHandoverDialog(row)"
            >交接</el-button>
            <el-button
              v-if="row.status === 1 && Number(row.activeKey) === 0 && Number(row.leaderCount || 0) === 0"
              type="text"
              size="small"
              class="danger-text"
              @click="onDelete(row)"
            >删除</el-button>
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

    <el-card v-if="regionCode" class="box-card mt16" shadow="never" :bordered="false" v-loading="loading">
      <div slot="header">当前生效代理</div>
      <el-form v-if="agent" label-width="110px" class="agent-detail">
        <el-row>
          <el-col :span="8"><el-form-item label="联系人：">{{ agent.contactName || '-' }}</el-form-item></el-col>
          <el-col :span="8"><el-form-item label="联系方式：">{{ agent.contactPhone || '-' }}</el-form-item></el-col>
          <el-col :span="8">
            <el-form-item label="名下团长数：">
              <span>{{ agent.leaderCount || 0 }}</span>
              <el-button type="text" size="small" class="ml6" @click="viewLeaders(agent)">查看</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="状态：">
            <el-tag :type="agent.status === 1 ? 'success' : 'info'" size="mini">
              {{ agent.status === 1 ? '生效' : '已失效' }}
            </el-tag>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="开通时间：">{{ agent.createTime || '-' }}</el-form-item></el-col>
        </el-row>
      </el-form>
      <div v-else class="empty">{{ regionCode ? '该区域暂无生效代理，团长申请将由平台兜底审批' : '请在上方列表点「查看」选一个区域' }}</div>
    </el-card>

    <el-card v-if="regionCode && queue.length" class="box-card mt16" shadow="never" :bordered="false" v-loading="loading">
      <div slot="header">候补队列</div>
      <el-table :data="queue" size="small" border>
        <el-table-column prop="id" label="ID" width="70" />
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

    <el-card v-if="regionCode && assignments.length" class="box-card mt16" shadow="never" :bordered="false" v-loading="loading">
      <div slot="header">
        历史归属版本
        <span class="sub">交接会让版本号递增，历史订单按当时的版本追溯归属，不回溯改算</span>
      </div>
      <el-table :data="assignments" size="small" border>
        <el-table-column prop="version" label="版本" width="70" />
        <el-table-column prop="agentId" label="代理记录 ID" width="120" />
        <el-table-column prop="regionPath" label="区域路径" min-width="140" />
        <el-table-column prop="startTime" label="生效时间" min-width="150" />
        <el-table-column label="失效时间" min-width="150">
          <template slot-scope="{ row }">{{ row.endTime || '当前生效' }}</template>
        </el-table-column>
        <el-table-column prop="handoverReason" label="交接原因" min-width="160" show-overflow-tooltip />
      </el-table>
    </el-card>

    <el-dialog title="开通区域代理" :visible.sync="agentDialog" width="560px">
      <div class="tips">
        一区一代理：一个区域同时只允许存在一位生效代理。该区已有代理时开通会被后端拒绝，
        新申请人一律进候补队列，等现任停用且待结算收益结清后再启用。
      </div>
      <el-form ref="agentForm" :model="agentForm" :rules="agentRules" label-width="110px" size="small">
        <el-form-item label="区域" prop="regionCode">
          <el-cascader
            v-model="agentForm.regionIds"
            :options="cityOptions"
            :props="cascaderProps"
            class="selWidth"
            clearable
            filterable
            placeholder="请选择省/市/区"
            @change="onAgentRegionChange"
          />
          <div v-if="agentForm.regionCode" class="uid-hint">
            编码 {{ agentForm.regionCode }}　路径 {{ agentForm.regionPath }}
          </div>
        </el-form-item>
        <el-form-item label="代理账号" prop="agentUid">
          <!--
            搜出来选，不让人手打 uid。代理是靠这个 uid 登录小程序审批团长、看分成的，
            填错了照样开通成功 —— 列表显示生效、分账照算，但没有任何人登得进代理端，
            团长申请堆在那里永远没人审批。
          -->
          <el-select
            v-model="agentForm.agentUid"
            filterable
            remote
            clearable
            reserve-keyword
            class="selWidth"
            placeholder="搜代理本人的小程序昵称 / 手机号"
            :remote-method="searchAgentUser"
            :loading="uidChecking"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.uid"
              :label="`${u.nickname || '（未设昵称）'}　${u.phone || ''}`"
              :value="u.uid"
              :disabled="!u.valid"
            />
          </el-select>
          <div class="uid-hint">
            就是代理本人登录微信小程序的那个账号，不另发账号密码。
            他必须先在小程序注册/登录过才搜得到；选中后他下次打开小程序即可看到「代理中心」。
          </div>
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model.trim="agentForm.contactName" maxlength="32" class="selWidth" />
        </el-form-item>
        <el-form-item label="联系方式" prop="contactPhone">
          <el-input v-model.trim="agentForm.contactPhone" maxlength="32" class="selWidth" />
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
        <el-form-item label="代理">{{ editForm.agentName }}</el-form-item>
        <el-form-item label="联系人">
          <el-input v-model.trim="editForm.contactName" maxlength="32" class="selWidth" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model.trim="editForm.contactPhone" maxlength="32" class="selWidth" />
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
      <div class="tips">
        交接后原代理立即失去代理端全部功能，历史订单仍按当时快照结算、<b>不回溯改算</b>。
        <br />
        ⚠️ 现任的<b>待结算收益不会自动校验</b> —— 后端那道「未结清不允许交接」的判定要传入待结算金额，
        而代理侧目前没有余额表（只有资金流水），这里传不出真实数字。交接前请先人工确认已结清。
      </div>
      <el-form ref="handoverForm" :model="handoverForm" :rules="handoverRules" label-width="130px" size="small">
        <el-form-item label="区域">{{ handoverForm.regionName }}（{{ handoverForm.regionCode }}）</el-form-item>
        <el-form-item label="现任代理">{{ handoverForm.currentAgent }}</el-form-item>
        <el-form-item label="新代理账号" prop="newAgentUid">
          <el-select
            v-model="handoverForm.newAgentUid"
            filterable
            remote
            clearable
            reserve-keyword
            class="selWidth"
            placeholder="搜新代理本人的小程序昵称 / 手机号"
            :remote-method="searchAgentUser"
            :loading="uidChecking"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.uid"
              :label="`${u.nickname || '（未设昵称）'}　${u.phone || ''}`"
              :value="u.uid"
              :disabled="!u.valid"
            />
          </el-select>
          <div class="uid-hint">
            同样是他登录微信小程序的那个账号，必须先注册/登录过才搜得到。
            交接后原代理立即失去代理端全部功能，历史订单仍按当时快照结算、不回溯改算。
          </div>
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
  deleteRegionAgent,
  searchUser,
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
      uidChecking: false,
      listQuery: { regionPrefix: '', contact: '', includeInactive: false, page: 1, size: 20 },
      // 级联选择器的选中路径，提交时只取末级编码当区域前缀
      listRegionIds: [],
      cityOptions: [],
      cascaderProps: { value: 'id', label: 'name', children: 'child', checkStrictly: true, emitPath: true },
      regionCode: '',
      regionName: '',
      regionPath: '',
      agent: null,
      queue: [],
      assignments: [],
      agentDialog: false,
      // term 是 [开始, 结束] 的数组，提交时才拆成两个字段；留空即长期有效
      // 区域在弹窗里自己选：页面上方不再有全局的区域选择器
      agentForm: {
        regionIds: [], regionCode: '', regionName: '', regionPath: '',
        agentUid: undefined, contactName: '', contactPhone: '', term: null,
      },
      // 搜出来的候选用户，只服务于开通弹窗里的那个下拉
      userOptions: [],
      editDialog: false,
      // contractNo / subsidyRatio 不在界面上，但要原样带回提交 ——
      // 不传的话后端会当成「清空」，把存量的合同号抹掉
      editForm: {
        id: null, regionCode: '', regionName: '', agentUid: null, agentName: '',
        contactName: '', contactPhone: '', contractNo: '', subsidyRatio: 0, term: null,
      },
      agentRules: {
        regionCode: [{ required: true, message: '请选择省/市/区', trigger: 'change' }],
        agentUid: [{ required: true, message: '请搜索并选择代理账号', trigger: 'change' }],
        contactName: [{ required: true, message: '请填写联系人', trigger: 'blur' }],
        contactPhone: [{ required: true, message: '请填写联系方式', trigger: 'blur' }],
      },
      handoverDialog: false,
      handoverForm: { regionCode: '', regionName: '', currentAgent: '', newAgentUid: undefined, reason: '' },
      handoverRules: {
        newAgentUid: [{ required: true, message: '请搜索并选择新代理账号', trigger: 'change' }],
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
          contact: this.listQuery.contact || undefined,
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
    onListRegionChange(value) {
      this.listQuery.regionPrefix = value && value.length ? value[value.length - 1] : '';
      this.loadAgentList(1);
    },
    resetAgentList() {
      this.listRegionIds = [];
      this.listQuery = { regionPrefix: '', contact: '', includeInactive: false, page: 1, size: 20 };
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
    /**
     * 远程搜候选代理。keyword 是纯数字时后端会同时按 uid 精确匹配和手机号前缀试，
     * 所以运营手上只有 uid 也照样搜得到。
     */
    async searchAgentUser(keyword) {
      if (!keyword || !keyword.trim()) {
        this.userOptions = [];
        return;
      }
      this.uidChecking = true;
      try {
        const res = await searchUser(keyword.trim(), 10);
        this.userOptions = Array.isArray(res) ? res : [];
      } catch (e) {
        this.userOptions = [];
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
        contactName: row.contactName || '',
        contactPhone: row.contactPhone || '',
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
          contactName: this.editForm.contactName,
          contactPhone: this.editForm.contactPhone,
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
    /**
     * 状态开关。只有「生效 → 停用」这一个方向，反向拨不回来 ——
     * 停用会腾出该区名额，这期间可能已经开了新代理。
     */
    onToggleStatus(row) {
      this.onDisable(row);
    },
    async onDelete(row) {
      try {
        await this.$confirm(
          `确认删除 ${row.regionName || row.regionCode} 的区域代理记录？该区域未绑定团长，删除后可重新开通。`,
          '提示',
          { type: 'warning' },
        );
        await deleteRegionAgent(row.id);
        this.$message.success('删除成功');
        this.loadAgentList(this.listQuery.page);
        if (this.regionCode === row.regionCode) this.loadAll();
      } catch (e) {
        // 用户取消或后端校验失败
      }
    },
    async onDisable(row) {
      try {
        await this.$confirm(
          `确认停用 ${row.regionName || row.regionCode} 的代理？` +
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
    viewLeaders(row) {
      const agentId = row && row.id;
      if (!agentId) {
        this.$message.warning('未找到代理记录，无法查看名下团长');
        return;
      }
      this.$router.push({
        name: 'allianceLeader',
        query: { agentId: String(agentId) },
      });
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
      // 「该区已有代理」不在这里拦：弹窗打开时还没选区，无从判断。
      // 后端有 uk_region_active 唯一索引兜底，会返回 REGION_AGENT_EXISTS，
      // 拦截器直接把「现任代理 uid=x」弹出来，比前端猜一遍更准
      this.agentForm = {
        regionIds: [], regionCode: '', regionName: '', regionPath: '',
        agentUid: undefined, contactName: '', contactPhone: '', term: null,
      };
      this.userOptions = [];
      this.agentDialog = true;
      this.$nextTick(() => this.$refs.agentForm && this.$refs.agentForm.clearValidate());
    },
    onAgentRegionChange(ids) {
      if (!ids || !ids.length) {
        this.agentForm.regionCode = '';
        this.agentForm.regionName = '';
        this.agentForm.regionPath = '';
        return;
      }
      // regionCode 取末级 id，regionPath 是逗号分隔的整条 id 路径，与后端约定一致
      this.agentForm.regionCode = String(ids[ids.length - 1]);
      this.agentForm.regionPath = ids.join(',');
      this.agentForm.regionName = this.pathNames(ids).join('/');
    },
    submitOpen() {
      this.$refs.agentForm.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await openRegionAgent({
            regionCode: this.agentForm.regionCode,
            regionName: this.agentForm.regionName,
            regionPath: this.agentForm.regionPath,
            agentUid: this.agentForm.agentUid,
            contactName: this.agentForm.contactName,
            contactPhone: this.agentForm.contactPhone,
            startTime: this.termStart(this.agentForm.term),
            endTime: this.termEnd(this.agentForm.term),
          });
          this.$message.success('开通成功');
          this.agentDialog = false;
          // 顺手把下方详情切到刚开通的这个区，省得再回列表点一次「查看」
          this.regionCode = this.agentForm.regionCode;
          this.regionName = this.agentForm.regionName;
          this.regionPath = this.agentForm.regionPath;
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
        await this.$confirm('确认从候补队列启用该申请人为该区代理？', '提示', { type: 'warning' });
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
    openHandoverDialog(row) {
      // 区域从行上带，不再依赖下方详情选中的那个区
      this.handoverForm = {
        regionCode: row.regionCode,
        regionName: row.regionName || '',
        currentAgent: this.agentName(row),
        newAgentUid: undefined,
        reason: '',
      };
      // 两个弹窗共用这一份候选，开之前清掉，免得带着上次开通时搜的人
      this.userOptions = [];
      this.handoverDialog = true;
      this.$nextTick(() => this.$refs.handoverForm && this.$refs.handoverForm.clearValidate());
    },
    submitHandover() {
      this.$refs.handoverForm.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await handoverRegionAgent({
            regionCode: this.handoverForm.regionCode,
            newAgentUid: this.handoverForm.newAgentUid,
            reason: this.handoverForm.reason,
            // 待结算金额不再由页面填。后端拿它做「未结清不允许交接」的判定，
            // 传 0 等于这道判定不生效 —— 代理侧没有余额表，前端拿不到真实数字，
            // 让人手填反而更糟：填错就是绕过校验，还留下一条像是核对过的记录。
            // 补上 §8.4 的代理账户表后改成后端自己算，不再走入参
            pendingSettleAmount: 0,
          });
          this.$message.success('交接完成');
          this.handoverDialog = false;
          this.loadAgentList(this.listQuery.page);
          if (this.regionCode === this.handoverForm.regionCode) this.loadAll();
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
.danger-text {
  color: #f56c6c;
}
.sub-line {
  color: #999;
  font-size: 12px;
}
.ml6 {
  margin-left: 6px;
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
