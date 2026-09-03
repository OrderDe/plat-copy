<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        团长按「绑定关系」分成，与代理的「按收货地」是两条独立的判定路径。
        平台抽查否决只否决身份，<b>不回溯已经产生的分成</b>。
      </div>

      <el-tabs v-model="tab" @tab-click="onTabChange">
        <!-- ============ 团长 ============ -->
        <el-tab-pane label="团长" name="leader">
          <el-form inline size="small" @submit.native.prevent>
            <el-form-item label="区域前缀">
              <el-input
                v-model.trim="leaderQuery.regionPrefix"
                placeholder="44 广东 / 4401 广州"
                clearable
                class="selWidthSm"
              />
            </el-form-item>
            <el-form-item label="代理ID">
              <el-input v-model.number="leaderQuery.agentId" clearable class="selWidthSm" />
            </el-form-item>
            <el-form-item label="团长uid">
              <el-input v-model.number="leaderQuery.uid" clearable class="selWidthSm" />
            </el-form-item>
            <el-form-item label="审批状态">
              <el-select v-model="leaderQuery.auditStatus" clearable class="selWidthSm">
                <el-option label="待审" :value="0" />
                <el-option label="通过" :value="1" />
                <el-option label="驳回" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadLeaders(1)">查询</el-button>
              <el-button @click="resetLeaders">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="leaderList" size="small" border v-loading="leaderLoading">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="团长" min-width="170">
              <template slot-scope="{ row }">
                <div>{{ userName(leaderUsers, row.uid) }}</div>
                <div class="sub-line">uid {{ row.uid }}{{ userPhone(leaderUsers, row.uid) }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="regionCode" label="区域" width="110" />
            <el-table-column prop="agentId" label="所属代理" width="90" />
            <el-table-column prop="promoteCode" label="推广码" min-width="120" show-overflow-tooltip />
            <el-table-column prop="memberCount" label="团员数" width="80" />
            <el-table-column label="累计佣金" width="110">
              <template slot-scope="{ row }">{{ money(row.totalCommission) }}</template>
            </el-table-column>
            <el-table-column label="可提现" width="100">
              <template slot-scope="{ row }">{{ money(row.balance) }}</template>
            </el-table-column>
            <el-table-column label="审批" width="80">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="auditTagType(row.auditStatus)">
                  {{ auditText(row.auditStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="150" />
            <el-table-column label="操作" width="90" fixed="right">
              <template slot-scope="{ row }">
                <el-button type="text" size="small" @click="openChangeAgent(row)">换代理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="leaderQuery.size"
              :current-page="leaderQuery.page"
              :total="leaderTotal"
              @size-change="onLeaderSize"
              @current-change="loadLeaders"
            />
          </div>
        </el-tab-pane>

        <!-- ============ 申请 ============ -->
        <el-tab-pane label="团长申请" name="apply">
          <el-form inline size="small" @submit.native.prevent>
            <el-form-item label="区域前缀">
              <el-input v-model.trim="applyQuery.regionPrefix" clearable class="selWidthSm" />
            </el-form-item>
            <el-form-item label="代理ID">
              <el-input v-model.number="applyQuery.agentId" clearable class="selWidthSm" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="applyQuery.status" clearable class="selWidthSm">
                <el-option label="待审批" :value="0" />
                <el-option label="已通过" :value="1" />
                <el-option label="已驳回" :value="2" />
                <el-option label="已撤回" :value="3" />
                <el-option label="平台否决" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadApplies(1)">查询</el-button>
              <el-button @click="resetApplies">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="applyList" size="small" border v-loading="applyLoading">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="申请人" min-width="170">
              <template slot-scope="{ row }">
                <div>{{ row.realName || userName(applyUsers, row.uid) }}</div>
                <div class="sub-line">uid {{ row.uid }}{{ row.phone ? ' · ' + row.phone : '' }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="regionName" label="申请区域" min-width="140" show-overflow-tooltip />
            <el-table-column prop="agentId" label="审批代理" width="90" />
            <el-table-column prop="groupScale" label="群规模" width="80" />
            <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="applyTagType(row.status)">{{ applyText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="auditRemark" label="审批备注" min-width="140" show-overflow-tooltip />
            <el-table-column prop="createTime" label="提交时间" min-width="150" />
            <el-table-column label="操作" width="90" fixed="right">
              <template slot-scope="{ row }">
                <!-- 只有代理已通过的那些才谈得上抽查：待审批的还没成为团长，没什么可否决 -->
                <el-button
                  v-if="row.status === 1"
                  type="text"
                  size="small"
                  class="danger-text"
                  @click="openVeto(row)"
                >抽查否决</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="applyQuery.size"
              :current-page="applyQuery.page"
              :total="applyTotal"
              @size-change="onApplySize"
              @current-change="loadApplies"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog title="抽查否决" :visible.sync="vetoVisible" width="520px">
      <div class="tips mb12">
        否决后该团长身份失效，<b>已产生的分成不回溯</b>。请填写可追溯的否决理由。
      </div>
      <el-form size="small" label-width="90px">
        <el-form-item label="申请">#{{ vetoRow.id }}　{{ vetoRow.realName }}　{{ vetoRow.regionName }}</el-form-item>
        <el-form-item label="否决理由">
          <el-input v-model.trim="vetoReason" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="vetoVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitVeto">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="给团长换代理" :visible.sync="changeVisible" width="520px">
      <div class="tips mb12">
        只改管理关系，<b>不影响任何一单的分账</b> —— 历史订单按当时快照结算。
      </div>
      <el-form size="small" label-width="90px">
        <el-form-item label="团长">uid {{ changeRow.uid }}　当前区域 {{ changeRow.regionCode }}</el-form-item>
        <el-form-item label="新区域编码">
          <el-input v-model.trim="changeForm.newRegionCode" placeholder="该区必须已有生效代理" class="selWidth" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model.trim="changeForm.reason" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="changeVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitChangeAgent">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getLeaderList, getLeaderApplyList, vetoLeaderApply, changeLeaderAgent } from '@/api/alliance';

const AUDIT = { 0: '待审', 1: '通过', 2: '驳回' };
const APPLY = { 0: '待审批', 1: '已通过', 2: '已驳回', 3: '已撤回', 4: '平台否决' };

export default {
  name: 'AllianceLeader',
  data() {
    return {
      tab: 'leader',
      saving: false,

      leaderLoading: false,
      leaderList: [],
      leaderUsers: {},
      leaderTotal: 0,
      leaderQuery: { regionPrefix: '', agentId: null, uid: null, auditStatus: null, page: 1, size: 20 },

      applyLoading: false,
      applyList: [],
      applyUsers: {},
      applyTotal: 0,
      applyQuery: { regionPrefix: '', agentId: null, status: null, page: 1, size: 20 },

      vetoVisible: false,
      vetoRow: {},
      vetoReason: '',

      changeVisible: false,
      changeRow: {},
      changeForm: { newRegionCode: '', reason: '' },
    };
  },
  created() {
    const agentId = Number(this.$route && this.$route.query && this.$route.query.agentId);
    if (Number.isInteger(agentId) && agentId > 0) {
      this.leaderQuery.agentId = agentId;
    }
    this.loadLeaders(1);
  },
  methods: {
    onTabChange() {
      if (this.tab === 'apply' && !this.applyList.length) {
        this.loadApplies(1);
      }
    },
    // 空串与 null 都不传，否则后端会当成一个真实的筛选值
    clean(query) {
      const params = {};
      Object.keys(query).forEach((key) => {
        const value = query[key];
        if (value !== '' && value !== null && value !== undefined && !Number.isNaN(value)) {
          params[key] = value;
        }
      });
      return params;
    },
    userName(users, uid) {
      const u = users[uid];
      return u ? u.nickname || '(未设置昵称)' : '查无此人';
    },
    userPhone(users, uid) {
      const u = users[uid];
      return u && u.phone ? ' · ' + u.phone : '';
    },
    money(value) {
      return '￥' + Number(value || 0).toFixed(2);
    },
    auditText(s) {
      return AUDIT[s] || '-';
    },
    auditTagType(s) {
      return { 0: 'warning', 1: 'success', 2: 'danger' }[s] || 'info';
    },
    applyText(s) {
      return APPLY[s] || '-';
    },
    applyTagType(s) {
      return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info', 4: 'danger' }[s] || 'info';
    },

    loadLeaders(page) {
      if (page) this.leaderQuery.page = page;
      this.leaderLoading = true;
      getLeaderList(this.clean(this.leaderQuery))
        .then((res) => {
          this.leaderList = (res && res.list) || [];
          this.leaderUsers = (res && res.users) || {};
          this.leaderTotal = (res && res.total) || 0;
        })
        .finally(() => {
          this.leaderLoading = false;
        });
    },
    onLeaderSize(size) {
      this.leaderQuery.size = size;
      this.loadLeaders(1);
    },
    resetLeaders() {
      this.leaderQuery = { regionPrefix: '', agentId: null, uid: null, auditStatus: null, page: 1, size: 20 };
      this.loadLeaders(1);
    },

    loadApplies(page) {
      if (page) this.applyQuery.page = page;
      this.applyLoading = true;
      getLeaderApplyList(this.clean(this.applyQuery))
        .then((res) => {
          this.applyList = (res && res.list) || [];
          this.applyUsers = (res && res.users) || {};
          this.applyTotal = (res && res.total) || 0;
        })
        .finally(() => {
          this.applyLoading = false;
        });
    },
    onApplySize(size) {
      this.applyQuery.size = size;
      this.loadApplies(1);
    },
    resetApplies() {
      this.applyQuery = { regionPrefix: '', agentId: null, status: null, page: 1, size: 20 };
      this.loadApplies(1);
    },

    openVeto(row) {
      this.vetoRow = row;
      this.vetoReason = '';
      this.vetoVisible = true;
    },
    submitVeto() {
      if (!this.vetoReason) {
        this.$message.warning('请填写否决理由');
        return;
      }
      this.saving = true;
      vetoLeaderApply(this.vetoRow.id, this.vetoReason)
        .then(() => {
          this.$message.success('已否决');
          this.vetoVisible = false;
          this.loadApplies();
        })
        .finally(() => {
          this.saving = false;
        });
    },

    openChangeAgent(row) {
      this.changeRow = row;
      this.changeForm = { newRegionCode: '', reason: '' };
      this.changeVisible = true;
    },
    submitChangeAgent() {
      if (!this.changeForm.newRegionCode || !this.changeForm.reason) {
        this.$message.warning('请填写新区域编码与原因');
        return;
      }
      this.saving = true;
      changeLeaderAgent(this.changeRow.uid, this.changeForm.newRegionCode, this.changeForm.reason)
        .then(() => {
          this.$message.success('已换代理');
          this.changeVisible = false;
          this.loadLeaders();
        })
        .finally(() => {
          this.saving = false;
        });
    },
  },
};
</script>

<style scoped lang="scss">
.tips {
  color: #909399;
  font-size: 12px;
  line-height: 20px;
  margin-bottom: 12px;
}
.mb12 {
  margin-bottom: 12px;
}
.sub-line {
  color: #909399;
  font-size: 12px;
}
.danger-text {
  color: #f56c6c;
}
.pager {
  margin-top: 12px;
  text-align: right;
}
.selWidthSm {
  width: 130px;
}
.selWidth {
  width: 300px;
}
</style>
