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
          <el-table :data="leaderList" v-loading="leaderLoading" border size="small"><el-table-column prop="id" label="ID" width="70" /><el-table-column label="团长" min-width="180"><template slot-scope="{row}">{{ userName(row.uid) }}<div class="sub-line">{{ contact(row.uid) }}</div></template></el-table-column><el-table-column label="区域" width="140"><template slot-scope="{row}">{{ regionName(row.regionCode) }}</template></el-table-column><el-table-column prop="agentId" label="所属代理" width="90" /><el-table-column prop="memberCount" label="团员数" width="80" /><el-table-column label="累计佣金"><template slot-scope="{row}">¥{{ money(row.totalCommission) }}</template></el-table-column><el-table-column label="可提现"><template slot-scope="{row}">¥{{ money(row.balance) }}</template></el-table-column><el-table-column prop="createTime" label="创建时间" /></el-table>
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
            <el-form-item><el-button type="primary" @click="loadApplies(1)">查询</el-button><el-button @click="resetApplies">重置</el-button></el-form-item>
          </el-form>
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
import { getLeaderList, getLeaderApplyList } from '@/api/alliance';

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
      leaderUsers: {},
      leaderQuery: { regionCode: '', contact: '', auditStatus: null, page: 1, size: 20 },
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
      getLeaderList(this.clean(this.leaderQuery)).then(r => {
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
    resetLeaders() { this.leaderRegionIds = []; this.leaderQuery = { regionCode: '', contact: '', auditStatus: null, page: 1, size: 20 }; this.loadLeaders(1); },
    resetApplies() {
      this.applyRegionIds = [];
      this.applyQuery = { regionCode: '', contact: '', status: undefined, page: 1, size: 20 };
      this.loadApplies(1);
    },
    onApplySizeChange(size) { this.applyQuery.size = size; this.loadApplies(1); },
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
<style scoped>.selWidth{width:280px}.selWidthSm{width:160px}.sub-line{color:#909399;font-size:12px;margin-top:4px}.tips{margin-bottom:16px;color:#909399}.block{margin-top:14px;text-align:right}</style>
