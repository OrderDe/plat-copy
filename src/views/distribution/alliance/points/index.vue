<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        账本<b>只增不改</b>：冲正是另写一行并回填「冲正流水号」，原始行永远保持发生时的样子。
        所以对账时按时间区间求和得到的就是那段时间的真实净额，不需要排除任何行。
        <br />
        账户余额与账本对不上时，以<b>账本</b>为准 —— 余额是汇总出来的结果。
      </div>

      <el-tabs v-model="tab" @tab-click="onTabChange">
        <!-- ============ 账户 ============ -->
        <el-tab-pane label="积分账户" name="account">
          <el-form inline size="small" @submit.native.prevent>
            <el-form-item label="用户uid">
              <el-input v-model.number="accountQuery.uid" clearable class="selWidthSm" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAccounts(1)">查询</el-button>
              <el-button @click="resetAccounts">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="accountList" size="small" border v-loading="accountLoading">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="用户" min-width="180">
              <template slot-scope="{ row }">
                <div>{{ userName(accountUsers, row.uid) }}</div>
                <div class="sub-line">uid {{ row.uid }}{{ userPhone(accountUsers, row.uid) }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="available" label="可用" width="110" />
            <el-table-column prop="frozen" label="冻结" width="110" />
            <el-table-column prop="totalEarned" label="累计获得" width="110" />
            <el-table-column prop="totalUsed" label="累计使用" width="110" />
            <el-table-column prop="totalExpired" label="累计过期" width="110" />
            <el-table-column label="状态" width="80">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '正常' : '冻结' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updateTime" label="更新时间" min-width="150" />
            <el-table-column label="操作" width="90" fixed="right">
              <template slot-scope="{ row }">
                <el-button type="text" size="small" @click="viewLedger(row.uid)">查账本</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="accountQuery.size"
              :current-page="accountQuery.page"
              :total="accountTotal"
              @size-change="onAccountSize"
              @current-change="loadAccounts"
            />
          </div>
        </el-tab-pane>

        <!-- ============ 账本 ============ -->
        <el-tab-pane label="积分账本" name="ledger">
          <el-form inline size="small" @submit.native.prevent>
            <el-form-item label="用户uid">
              <el-input v-model.number="ledgerQuery.uid" clearable class="selWidthSm" />
            </el-form-item>
            <el-form-item label="方向">
              <el-select v-model="ledgerQuery.direction" clearable class="selWidthSm">
                <el-option label="收入" :value="1" />
                <el-option label="支出" :value="2" />
                <el-option label="冻结" :value="3" />
                <el-option label="解冻" :value="4" />
                <el-option label="过期" :value="5" />
              </el-select>
            </el-form-item>
            <el-form-item label="来源">
              <el-select v-model="ledgerQuery.sourceType" clearable class="selWidth">
                <el-option v-for="(text, key) in SOURCE" :key="key" :label="text" :value="key" />
              </el-select>
            </el-form-item>
            <el-form-item label="单号">
              <el-input
                v-model.trim="ledgerQuery.keyword"
                placeholder="流水号 / 业务号 / 核销单号"
                clearable
                class="selWidth"
              />
            </el-form-item>
            <el-form-item label="时间">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                value-format="yyyy-MM-dd HH:mm:ss"
                :default-time="['00:00:00', '23:59:59']"
                start-placeholder="开始"
                end-placeholder="结束"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadLedger(1)">查询</el-button>
              <el-button @click="resetLedger">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="ledgerList" size="small" border v-loading="ledgerLoading">
            <el-table-column prop="transactionId" label="流水号" min-width="180" show-overflow-tooltip />
            <el-table-column label="用户" min-width="160">
              <template slot-scope="{ row }">
                <div>{{ userName(ledgerUsers, row.uid) }}</div>
                <div class="sub-line">uid {{ row.uid }}</div>
              </template>
            </el-table-column>
            <el-table-column label="方向" width="80">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="directionTagType(row.direction)">
                  {{ directionText(row.direction) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="积分" width="100" />
            <el-table-column label="可用余额" width="140">
              <template slot-scope="{ row }">{{ row.beforeAvailable }} → {{ row.afterAvailable }}</template>
            </el-table-column>
            <el-table-column label="来源" min-width="130">
              <template slot-scope="{ row }">{{ sourceText(row.sourceType) }}</template>
            </el-table-column>
            <el-table-column prop="sourceId" label="来源单号" min-width="170" show-overflow-tooltip />
            <el-table-column prop="reversalNo" label="冲正流水号" min-width="170" show-overflow-tooltip />
            <el-table-column prop="createTime" label="时间" min-width="150" />
          </el-table>
          <div class="pager">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="ledgerQuery.size"
              :current-page="ledgerQuery.page"
              :total="ledgerTotal"
              @size-change="onLedgerSize"
              @current-change="loadLedger"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { getPointsAccounts, getPointsLedger } from '@/api/alliance';

const SOURCE = {
  REGISTER: '注册赠送',
  INVITE: '邀请奖励',
  SIGN_IN: '签到',
  TASK: '任务',
  CONSUME_REBATE: '消费返积分',
  VERIFY_FREEZE: '核销冻结',
  VERIFY_DEDUCT: '核销抵扣',
  MANUAL: '人工调整',
  REVERSAL: '冲正',
};
const DIRECTION = { 1: '收入', 2: '支出', 3: '冻结', 4: '解冻', 5: '过期' };

export default {
  name: 'AlliancePoints',
  data() {
    return {
      SOURCE,
      tab: 'account',
      dateRange: [],

      accountLoading: false,
      accountList: [],
      accountUsers: {},
      accountTotal: 0,
      accountQuery: { uid: null, page: 1, size: 20 },

      ledgerLoading: false,
      ledgerList: [],
      ledgerUsers: {},
      ledgerTotal: 0,
      ledgerQuery: { uid: null, direction: null, sourceType: '', keyword: '', page: 1, size: 20 },
    };
  },
  created() {
    this.loadAccounts(1);
  },
  methods: {
    onTabChange() {
      if (this.tab === 'ledger' && !this.ledgerList.length) {
        this.loadLedger(1);
      }
    },
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
    sourceText(s) {
      return SOURCE[s] || s || '-';
    },
    directionText(d) {
      return DIRECTION[d] || '-';
    },
    directionTagType(d) {
      return { 1: 'success', 2: 'danger', 3: 'warning', 4: 'info', 5: 'info' }[d] || 'info';
    },

    loadAccounts(page) {
      if (page) this.accountQuery.page = page;
      this.accountLoading = true;
      getPointsAccounts(this.clean(this.accountQuery))
        .then((res) => {
          this.accountList = (res && res.list) || [];
          this.accountUsers = (res && res.users) || {};
          this.accountTotal = (res && res.total) || 0;
        })
        .finally(() => {
          this.accountLoading = false;
        });
    },
    onAccountSize(size) {
      this.accountQuery.size = size;
      this.loadAccounts(1);
    },
    resetAccounts() {
      this.accountQuery = { uid: null, page: 1, size: 20 };
      this.loadAccounts(1);
    },

    loadLedger(page) {
      if (page) this.ledgerQuery.page = page;
      const params = this.clean(this.ledgerQuery);
      if (this.dateRange && this.dateRange.length === 2) {
        params.startTime = this.dateRange[0];
        params.endTime = this.dateRange[1];
      }
      this.ledgerLoading = true;
      getPointsLedger(params)
        .then((res) => {
          this.ledgerList = (res && res.list) || [];
          this.ledgerUsers = (res && res.users) || {};
          this.ledgerTotal = (res && res.total) || 0;
        })
        .finally(() => {
          this.ledgerLoading = false;
        });
    },
    onLedgerSize(size) {
      this.ledgerQuery.size = size;
      this.loadLedger(1);
    },
    resetLedger() {
      this.dateRange = [];
      this.ledgerQuery = { uid: null, direction: null, sourceType: '', keyword: '', page: 1, size: 20 };
      this.loadLedger(1);
    },

    viewLedger(uid) {
      this.tab = 'ledger';
      this.ledgerQuery.uid = uid;
      this.loadLedger(1);
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
.sub-line {
  color: #909399;
  font-size: 12px;
}
.pager {
  margin-top: 12px;
  text-align: right;
}
.selWidthSm {
  width: 130px;
}
.selWidth {
  width: 200px;
}
</style>
