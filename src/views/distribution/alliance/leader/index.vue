<template>
  <div class="divBox">
    <el-card shadow="never">
      <div class="tips">团长按绑定关系分成，代理按收货地分成。</div>
      <el-tabs v-model="tab" @tab-click="onTabChange">
        <el-tab-pane label="团长" name="leader">
          <el-form inline size="small" @submit.native.prevent>
            <el-form-item label="城市"><el-select v-model="leaderQuery.regionCode" filterable clearable placeholder="请选择城市" class="selWidthSm"><el-option v-for="c in cities" :key="c.id" :label="c.name" :value="c.id" /></el-select></el-form-item>
            <el-form-item label="联系方式"><el-input v-model.trim="leaderQuery.contact" clearable class="selWidthSm" /></el-form-item>
            <el-form-item label="审批状态"><el-select v-model="leaderQuery.auditStatus" clearable class="selWidthSm"><el-option label="待审" :value="0" /><el-option label="通过" :value="1" /><el-option label="驳回" :value="2" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" @click="loadLeaders(1)">查询</el-button><el-button @click="resetLeaders">重置</el-button></el-form-item>
          </el-form>
          <el-table :data="leaderList" v-loading="leaderLoading" border size="small"><el-table-column prop="id" label="ID" width="70" /><el-table-column label="团长" min-width="180"><template slot-scope="{row}">{{ userName(row.uid) }}<div class="sub-line">{{ contact(row.uid) }}</div></template></el-table-column><el-table-column prop="regionCode" label="区域" width="110" /><el-table-column prop="agentId" label="所属代理" width="90" /><el-table-column prop="memberCount" label="团员数" width="80" /><el-table-column label="累计佣金"><template slot-scope="{row}">¥{{ money(row.totalCommission) }}</template></el-table-column><el-table-column label="可提现"><template slot-scope="{row}">¥{{ money(row.balance) }}</template></el-table-column><el-table-column prop="createTime" label="创建时间" /></el-table>
          <el-pagination background layout="total, sizes, prev, pager, next" :total="Number(leaderTotal)" :page-size="Number(leaderQuery.size)" :current-page="Number(leaderQuery.page)" @current-change="loadLeaders" />
        </el-tab-pane>
        <el-tab-pane label="团长申请" name="apply">
          <el-form inline size="small" @submit.native.prevent><el-form-item label="城市"><el-select v-model="applyQuery.regionCode" filterable clearable placeholder="请选择城市" class="selWidthSm"><el-option v-for="c in cities" :key="c.id" :label="c.name" :value="c.id" /></el-select></el-form-item><el-form-item label="联系方式"><el-input v-model.trim="applyQuery.contact" clearable class="selWidthSm" /></el-form-item><el-form-item><el-button type="primary" @click="loadApplies(1)">查询</el-button><el-button @click="resetApplies">重置</el-button></el-form-item></el-form>
          <el-table :data="applyList" v-loading="applyLoading" border size="small"><el-table-column prop="id" label="ID" width="70" /><el-table-column prop="realName" label="申请人" /><el-table-column prop="phone" label="联系方式" /><el-table-column prop="regionName" label="申请区域" /><el-table-column prop="status" label="状态" /><el-table-column prop="createTime" label="提交时间" /></el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
<script>
import request from '@/utils/request';
import { getLeaderList, getLeaderApplyList } from '@/api/alliance';
export default { name: 'AllianceLeader', data() { return { tab: 'leader', cities: [], leaderList: [], leaderTotal: 0, leaderLoading: false, applyList: [], applyTotal: 0, applyLoading: false, leaderUsers: {}, leaderQuery: { regionCode: '', contact: '', auditStatus: null, page: 1, size: 20 }, applyQuery: { regionCode: '', contact: '', page: 1, size: 20 } }; }, created() { this.loadCities(); this.loadLeaders(1); }, methods: { async loadCities() { try { const r = await request({ url: '/admin/merchant/city/region/city/tree', method: 'get' }); const walk = a => (Array.isArray(a) ? a : []).flatMap(n => (n.child || n.children || []).length ? walk(n.child || n.children) : [{ id: String(n.regionId || n.id), name: n.regionName || n.name }]); this.cities = walk(r && (r.list || r)); } catch (e) { this.cities = []; } }, clean(q) { return Object.keys(q).reduce((o, k) => { if (q[k] !== '' && q[k] !== null && q[k] !== undefined) o[k] = q[k]; return o; }, {}); }, userName(uid) { const u = this.leaderUsers[uid]; return u && u.nickname ? u.nickname : `用户${uid || ''}`; }, contact(uid) { const u = this.leaderUsers[uid]; return u && u.phone ? u.phone : '-'; }, money(v) { return Number(v || 0).toFixed(2); }, loadLeaders(p) { if (p) this.leaderQuery.page = Number(p); this.leaderLoading = true; getLeaderList(this.clean(this.leaderQuery)).then(r => { this.leaderList = r && r.list || []; this.leaderUsers = r && r.users || {}; this.leaderTotal = Number(r && r.total) || 0; }).catch(() => { this.$message.error('团长业绩加载失败'); }).finally(() => { this.leaderLoading = false; }); }, loadApplies(p) { if (p) this.applyQuery.page = Number(p); this.applyLoading = true; getLeaderApplyList(this.clean(this.applyQuery)).then(r => { this.applyList = r && r.list || []; this.applyTotal = Number(r && r.total) || 0; }).catch(() => { this.$message.error('团长申请加载失败'); }).finally(() => { this.applyLoading = false; }); }, onTabChange() { if (this.tab === 'apply' && !this.applyList.length) this.loadApplies(1); }, resetLeaders() { this.leaderQuery = { regionCode: '', contact: '', auditStatus: null, page: 1, size: 20 }; this.loadLeaders(1); }, resetApplies() { this.applyQuery = { regionCode: '', contact: '', page: 1, size: 20 }; this.loadApplies(1); } } };
</script>
<style scoped>.selWidthSm{width:160px}.sub-line{color:#909399;font-size:12px;margin-top:4px}.tips{margin-bottom:16px;color:#909399}</style>
