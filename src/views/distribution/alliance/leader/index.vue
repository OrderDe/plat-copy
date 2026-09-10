<template>
  <div class="divBox">
    <el-card shadow="never">
      <div class="tips">团长按绑定关系分成，代理按收货地分成。</div>
      <el-tabs v-model="tab" @tab-click="onTabChange">
        <el-tab-pane label="团长" name="leader">
          <el-form inline size="small" @submit.native.prevent>
            <el-form-item label="城市">
              <el-cascader v-model="leaderRegionIds" :options="cityOptions" :props="cascaderProps" clearable class="selWidth" placeholder="请选择省/市/区" @change="onLeaderRegionChange" />
            </el-form-item>
            <el-form-item label="联系方式"><el-input v-model.trim="leaderQuery.contact" clearable class="selWidthSm" /></el-form-item>
            <el-form-item label="审批状态"><el-select v-model="leaderQuery.auditStatus" clearable class="selWidthSm"><el-option label="待审" :value="0" /><el-option label="通过" :value="1" /><el-option label="驳回" :value="2" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" @click="loadLeaders(1)">查询</el-button><el-button @click="resetLeaders">重置</el-button></el-form-item>
          </el-form>
          <div v-if="leaderQuery.agentId" class="agent-filter">
            正在看代理 <b>#{{ leaderQuery.agentId }}</b> 名下的团长
            <el-button type="text" size="small" @click="clearAgentFilter">查看全部团长</el-button>
          </div>
          <el-table :data="leaderList" v-loading="leaderLoading" border size="small">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="团长" min-width="180">
              <template slot-scope="{ row }">
                {{ userName(row.uid) }}<div class="sub-line">{{ contact(row.uid) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="区域" width="140">
              <template slot-scope="{ row }">{{ regionName(row.regionCode) }}</template>
            </el-table-column>
            <el-table-column label="所属代理" width="110">
              <template slot-scope="{ row }">
                <span v-if="Number(row.agentId) > 0">#{{ row.agentId }}</span>
                <el-tag v-else size="mini" type="info">未绑定</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="memberCount" label="团员数" width="80" />
            <el-table-column label="累计佣金">
              <template slot-scope="{ row }">¥{{ money(row.totalCommission) }}</template>
            </el-table-column>
            <el-table-column label="可提现">
              <template slot-scope="{ row }">¥{{ money(row.balance) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" />
            <el-table-column label="操作" width="90" fixed="right">
              <template slot-scope="{ row }">
                <el-button
                  v-if="Number(row.agentId) > 0"
                  type="text"
                  size="small"
                  class="danger-text"
                  @click="unbindAgent(row)"
                >解绑代理</el-button>
                <span v-else class="sub-line">-</span>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination background layout="total, sizes, prev, pager, next" :total="Number(leaderTotal)" :page-size="Number(leaderQuery.size)" :current-page="Number(leaderQuery.page)" @current-change="loadLeaders" />
        </el-tab-pane>
        <el-tab-pane label="团长申请" name="apply">
          <el-form inline size="small" @submit.native.prevent>
            <el-form-item label="城市">
              <el-cascader v-model="applyRegionIds" :options="cityOptions" :props="cascaderProps" clearable class="selWidth" placeholder="请选择省/市/区" @change="onApplyRegionChange" />
            </el-form-item>
            <el-form-item label="联系方式"><el-input v-model.trim="applyQuery.contact" clearable class="selWidthSm" /></el-form-item>
            <el-form-item label="状态">
              <el-select v-model="applyQuery.status" clearable placeholder="全部" class="selWidthSm">
                <el-option v-for="s in applyStatusOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadApplies(1)">查询</el-button>
              <el-button @click="resetApplies">重置</el-button>
              <el-button type="success" :loading="batchApproving" @click="approveAll">一键通过</el-button>
            </el-form-item>
          </el-form>
          <div class="tips">
            审批权在区域代理手上（他招的人他审），这里是平台的兜底通道：代理长期不审、
            或要集中放行时用。<b>审批人仍记在该区代理名下</b>，事后追溯与代理自己审批时一致。<br />
            「一键通过」只处理<b>当前筛选条件下</b>的待审申请；选了城市就只批那个区域，不选就是全平台。
          </div>
          <el-table :data="applyList" v-loading="applyLoading" border size="small">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="realName" label="申请人" min-width="100" />
            <el-table-column prop="phone" label="联系方式" min-width="120" />
            <el-table-column prop="regionName" label="申请区域" min-width="110" />
            <el-table-column label="申请类型" width="90">
              <template slot-scope="{ row }">{{ applyTypeText(row.applyType) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="applyStatusTag(row.status)">{{ applyStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="审批备注" min-width="160" show-overflow-tooltip>
              <template slot-scope="{ row }">
                {{ row.platformVetoReason || row.auditRemark || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="提交时间" min-width="150" />
            <el-table-column prop="auditTime" label="审批时间" min-width="150" />
            <el-table-column label="条件达标" width="110">
              <template slot-scope="{ row }">
                <!-- 点开才查：一页 20 条，每条都要跑一遍规则取数，进页面就全查会拖慢列表 -->
                <el-popover placement="left" width="300" trigger="click"
                  @show="loadConditions(row.uid)">
                  <div v-loading="conditionLoading">
                    <div v-if="!conditionCache[row.uid]" class="sub-line">加载中…</div>
                    <template v-else>
                      <div v-if="!conditionCache[row.uid].items.length" class="sub-line">
                        平台未配置任何条件，谁都能申请
                      </div>
                      <div v-for="(c, i) in conditionCache[row.uid].items" :key="i" class="cond-line">
                        <span>{{ c.label }}</span>
                        <span :class="c.passed ? 'cond-ok' : 'cond-bad'">
                          {{ c.passed ? '已达标' : ('当前 ' + c.actualText) }}
                        </span>
                      </div>
                    </template>
                  </div>
                  <el-button slot="reference" type="text" size="small">查看</el-button>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template slot-scope="{ row }">
                <el-button v-if="Number(row.status) === 0" type="text" size="small"
                  @click="approveOne(row)">通过</el-button>
                <span v-else class="sub-line">-</span>
              </template>
            </el-table-column>
          </el-table>
          <!-- 申请列表原来没有分页控件，只能看到第一页 20 条 —— 申请多起来之后
               后面的根本翻不到，运营会以为「只有这些人申请过」 -->
          <div class="block">
            <el-pagination background layout="total, sizes, prev, pager, next"
              :total="Number(applyTotal)" :page-size="Number(applyQuery.size)"
              :current-page="Number(applyQuery.page)"
              @size-change="onApplySizeChange" @current-change="loadApplies" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
<script>
import request from '@/utils/request';
import {
  getLeaderList,
  getLeaderApplyList,
  getApplicantConditions,
  approveLeaderApply,
  approveAllLeaderApplies,
  unbindLeaderAgent,
} from '@/api/alliance';

const cityListTree = () => request({ url: '/admin/merchant/city/region/city/tree', method: 'get' });

export default {
  name: 'AllianceLeader',
  data() {
    return {
      tab: 'leader',
      // 三级树直接喂给级联选择器：拍平成几千个 option 塞进 el-select 会把页面卡死
      cityOptions: [],
      cascaderProps: { value: 'id', label: 'name', children: 'child', checkStrictly: true, emitPath: true },
      regionNameMap: {},
      leaderRegionIds: [],
      applyRegionIds: [],
      leaderList: [], leaderTotal: 0, leaderLoading: false,
      applyList: [], applyTotal: 0, applyLoading: false,
      batchApproving: false,
      // 按 uid 缓存达标情况：同一个人可能在列表里被反复点开，没必要每次都跑一遍规则
      conditionCache: {}, conditionLoading: false,
      leaderUsers: {},
      leaderQuery: { regionCode: '', contact: '', auditStatus: null, agentId: null, page: 1, size: 20 },
      applyQuery: { regionCode: '', contact: '', status: undefined, page: 1, size: 20 },
      // 状态码与后端 LeaderService 里的常量一一对应，改一边要同步改另一边
      applyStatusOptions: [
        { value: 0, label: '待审批' },
        { value: 1, label: '已通过' },
        { value: 2, label: '已驳回' },
        { value: 3, label: '已撤回' },
        { value: 4, label: '平台否决' },
      ],
    };
  },
  created() {
    this.loadCityTree();
    // 「区域与代理」页点「查看」跳过来时带着 agentId，直接筛成那个代理名下的团长
    const agentId = this.$route.query && this.$route.query.agentId;
    if (agentId) this.leaderQuery.agentId = Number(agentId) || null;
    this.loadLeaders(1);
  },
  methods: {
    async loadCityTree() {
      try {
        const res = await cityListTree();
        const list = Array.isArray(res) ? res : (res && res.list) || [];
        const nameMap = {};
        this.cityOptions = this.normalizeTree(list, 1, nameMap);
        // 整体赋值，Vue 2 里逐 key 写入不会触发视图更新
        this.regionNameMap = nameMap;
      } catch (e) {
        this.cityOptions = [];
      }
    },
    // 最多下钻三级（省/市/区），顺手记下 code -> 名称，列表里才好显示中文
    normalizeTree(list, depth = 1, nameMap = {}) {
      if (!Array.isArray(list)) return [];
      return list.map(n => {
        const item = { id: String(n.regionId != null ? n.regionId : n.id), name: n.regionName || n.name };
        nameMap[item.id] = item.name;
        const children = n.child || n.children;
        if (depth < 3 && Array.isArray(children) && children.length) item.child = this.normalizeTree(children, depth + 1, nameMap);
        return item;
      });
    },
    onLeaderRegionChange(value) { this.leaderQuery.regionCode = value && value.length ? value[value.length - 1] : ''; },
    onApplyRegionChange(value) { this.applyQuery.regionCode = value && value.length ? value[value.length - 1] : ''; },
    clean(q) { return Object.keys(q).reduce((o, k) => { if (q[k] !== '' && q[k] !== null && q[k] !== undefined) o[k] = q[k]; return o; }, {}); },
    userName(uid) { const u = this.leaderUsers[uid]; return u && u.nickname ? u.nickname : `用户${uid || ''}`; },
    contact(uid) { const u = this.leaderUsers[uid]; return u && u.phone ? u.phone : '-'; },
    regionName(code) { return this.regionNameMap[String(code)] || code || '-'; },
    money(v) { return Number(v || 0).toFixed(2); },
    loadLeaders(p) {
      if (p) this.leaderQuery.page = Number(p);
      this.leaderLoading = true;
      // 后端收的是 regionPrefix（按区域编码前缀匹配，省/市/区都能筛），
      // 原来直接把 regionCode 发过去，那个参数后端根本不认 —— 城市筛选一直是摆设
      const { regionCode, ...rest } = this.leaderQuery;
      const params = this.clean({ ...rest, regionPrefix: regionCode });
      getLeaderList(params).then(r => {
        this.leaderList = (r && r.list) || [];
        this.leaderUsers = (r && r.users) || {};
        this.leaderTotal = Number(r && r.total) || 0;
      }).catch(() => { this.$message.error('团长业绩加载失败'); }).finally(() => { this.leaderLoading = false; });
    },
    loadApplies(p) {
      if (p) this.applyQuery.page = Number(p);
      this.applyLoading = true;
      getLeaderApplyList(this.clean(this.applyQuery)).then(r => {
        this.applyList = (r && r.list) || [];
        this.applyTotal = Number(r && r.total) || 0;
      }).catch(() => { this.$message.error('团长申请加载失败'); }).finally(() => { this.applyLoading = false; });
    },
    onTabChange() { if (this.tab === 'apply' && !this.applyList.length) this.loadApplies(1); },
    resetLeaders() {
      this.leaderRegionIds = [];
      // 重置保留 agentId：从「区域与代理」点「查看」跳过来时，重置查询条件
      // 不该顺手把「只看这个代理名下」也清掉 —— 那样用户会以为跳转失效了
      this.leaderQuery = {
        regionCode: '', contact: '', auditStatus: null,
        agentId: this.leaderQuery.agentId, page: 1, size: 20,
      };
      this.loadLeaders(1);
    },
    clearAgentFilter() { this.leaderQuery.agentId = null; this.loadLeaders(1); },
    /**
     * 解除团长与区域代理的管理绑定。
     *
     * 只摘管理关系，团长身份、推广码、团员、历史订单与已产生的佣金全部保留 ——
     * 想停掉一个人的团长身份走的是另一条路（平台否决）。
     *
     * 解绑之后：该团长的申请不再由原代理审批、不再计入原代理的名下团长数；
     * 「按分享链路」口径下这一单的代理分成会回落到收货地判定。
     * 历史订单在支付成功时已固化归属，不回溯。
     */
    unbindAgent(row) {
      const name = this.userName(row.uid);
      this.$prompt(
        `将「${name}」从代理 #${row.agentId} 名下解绑。团长身份、推广码、团员与历史佣金都保留，`
          + '此后不再由该代理审批与统计；已产生的订单分账不回溯。',
        '解绑代理',
        {
          confirmButtonText: '确定解绑',
          cancelButtonText: '取消',
          inputPlaceholder: '请填写解绑原因（必填，会记进操作日志）',
          // 后端 unbindAgent 强制要求原因，这里先拦一道，省得填空了才报错
          inputValidator: (v) => (v && v.trim() ? true : '请填写解绑原因'),
        },
      ).then(({ value }) => {
        unbindLeaderAgent(row.uid, value.trim())
          .then(() => {
            this.$message.success('已解绑');
            this.loadLeaders();
          })
          .catch(() => {});
      }).catch(() => {});
    },
    resetApplies() {
      this.applyRegionIds = [];
      this.applyQuery = { regionCode: '', contact: '', status: undefined, page: 1, size: 20 };
      this.loadApplies(1);
    },
    onApplySizeChange(size) { this.applyQuery.size = size; this.loadApplies(1); },
    /**
     * 拉某个申请人当前的达标情况。
     *
     * 算的是「此刻」的值而不是提交那一刻的快照 —— 审批要判断的是「现在该不该批」：
     * 中途退款会让消费额掉下来，平台也可能在这期间把条件调严了。
     */
    loadConditions(uid) {
      if (!uid || this.conditionCache[uid]) return;
      this.conditionLoading = true;
      getApplicantConditions(uid)
        .then((res) => {
          const data = (res && res.items) ? res : { items: [] };
          this.$set(this.conditionCache, uid, data);
        })
        .catch(() => { this.$set(this.conditionCache, uid, { items: [] }); })
        .finally(() => { this.conditionLoading = false; });
    },
    async approveOne(row) {
      try {
        await this.$confirm(
          `确认通过「${row.realName || row.uid}」的团长申请？通过后对方立即成为团长。`,
          '提示', { type: 'warning' });
        await approveLeaderApply(row.id);
        this.$message.success('已通过');
        this.loadApplies();
      } catch (e) {
        /* 取消或拦截器已弹过错误 */
      }
    },
    /**
     * 一键通过。后端逐条走审批流程，单条失败不影响其余，
     * 所以这里报的是「实际通过几条」而不是「全部通过」——
     * 一批里混进一个已经是团长的人，说全部通过就是骗人。
     */
    async approveAll() {
      const scope = this.applyQuery.regionCode ? '该区域' : '全平台';
      try {
        await this.$confirm(
          `确认把${scope}所有待审批的团长申请全部通过？通过后对方立即成为团长。`,
          '一键通过', { type: 'warning' });
      } catch (e) {
        return;
      }
      this.batchApproving = true;
      try {
        const res = await approveAllLeaderApplies(this.applyQuery.regionCode || undefined);
        const n = typeof res === 'number' ? res : (res && res.data) || 0;
        this.$message.success(`已通过 ${n} 条`);
        this.conditionCache = {};
        this.loadApplies(1);
      } catch (e) {
        /* 拦截器已弹过错误 */
      } finally {
        this.batchApproving = false;
      }
    },
    /** 状态原来直接打印数字，运营看到一列 0/1/2 完全不知道是什么 */
    applyStatusText(status) {
      const hit = this.applyStatusOptions.find((s) => s.value === Number(status));
      return hit ? hit.label : String(status == null ? '-' : status);
    },
    applyStatusTag(status) {
      return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info', 4: 'danger' }[Number(status)] || 'info';
    },
    applyTypeText(type) {
      return { PERSONAL: '个人', STORE: '门店' }[type] || (type || '-');
    },
  },
};
</script>
<style scoped>
.agent-filter {
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #ecf5ff;
  border-radius: 4px;
  font-size: 13px;
  color: #409eff;
}
.danger-text { color: #f56c6c; }
.selWidth{width:280px}.selWidthSm{width:160px}.sub-line{color:#909399;font-size:12px;margin-top:4px}.tips{margin-bottom:16px;color:#909399}.block{margin-top:14px;text-align:right}.cond-line{display:flex;justify-content:space-between;padding:4px 0;font-size:12px}.cond-ok{color:#67c23a}.cond-bad{color:#f56c6c}</style>
