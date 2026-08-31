<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        一单可能有多条：团长一条、收货地代理一条，跨区订单还会多一条「招募代理」。
        三者是<b>不同的人</b>，各挂各的代理 ID，所以按角色筛完再看金额才对得上。
        <br />
        「区域」是订单收货地的行政区划编码，代理分成按它判定，与团长在哪个区无关。
      </div>

      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="角色">
          <el-select v-model="query.role" clearable class="selWidthSm">
            <el-option label="团长" value="LEADER" />
            <el-option label="收货地代理" value="AGENT" />
            <el-option label="招募代理" value="AGENT_ORIGIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域前缀">
          <el-input v-model.trim="query.regionPrefix" placeholder="44 / 4401" clearable class="selWidthSm" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable class="selWidthSm">
            <el-option label="待结算" :value="0" />
            <el-option label="结算中" :value="1" />
            <el-option label="已入账" :value="2" />
            <el-option label="已失效" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="受益人uid">
          <el-input v-model.number="query.uid" clearable class="selWidthSm" />
        </el-form-item>
        <el-form-item label="代理ID">
          <el-input v-model.number="query.agentId" clearable class="selWidthSm" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model.trim="query.orderNo" clearable class="selWidth" />
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
          <el-button type="primary" @click="loadList(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" size="small" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="orderNo" label="订单号" min-width="170" show-overflow-tooltip />
        <el-table-column label="角色" width="110">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="roleTagType(row.commissionRole)">{{ roleText(row.commissionRole) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="受益人" min-width="170">
          <template slot-scope="{ row }">
            <!-- uid = 0 是无代理区域的平台兜底：这笔钱归平台，但必须在明细里看得见 -->
            <div v-if="!row.uid">平台兜底</div>
            <div v-else>
              <div>{{ userName(row.uid) }}</div>
              <div class="sub-line">uid {{ row.uid }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="regionCode" label="收货地区域" width="110" />
        <el-table-column prop="agentId" label="代理ID" width="90" />
        <el-table-column label="计佣基数" width="110">
          <template slot-scope="{ row }">{{ money(row.orderPrice) }}</template>
        </el-table-column>
        <el-table-column label="比例" width="90">
          <template slot-scope="{ row }">{{ ratioText(row.ratio) }}</template>
        </el-table-column>
        <el-table-column label="分成金额" width="110">
          <template slot-scope="{ row }">
            <span :class="{ 'danger-text': Number(row.commissionAmount) < 0 }">
              {{ money(row.commissionAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="冲正" width="70">
          <template slot-scope="{ row }">{{ row.reversed ? '是' : '-' }}</template>
        </el-table-column>
        <el-table-column prop="ruleVersion" label="规则版本" min-width="130" show-overflow-tooltip />
        <el-table-column prop="settlementTime" label="入账时间" min-width="150" />
        <el-table-column prop="createTime" label="计佣时间" min-width="150" />
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="query.size"
          :current-page="query.page"
          :total="total"
          @size-change="onSizeChange"
          @current-change="loadList"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { getCommissionList } from '@/api/alliance';

const ROLE = { LEADER: '团长', AGENT: '收货地代理', AGENT_ORIGIN: '招募代理' };
const STATUS = { 0: '待结算', 1: '结算中', 2: '已入账', 3: '已失效' };

export default {
  name: 'AllianceCommission',
  data() {
    return {
      loading: false,
      list: [],
      users: {},
      total: 0,
      dateRange: [],
      query: {
        role: '',
        regionPrefix: '',
        status: null,
        uid: null,
        agentId: null,
        orderNo: '',
        page: 1,
        size: 20,
      },
    };
  },
  created() {
    this.loadList(1);
  },
  methods: {
    roleText(r) {
      return ROLE[r] || r || '-';
    },
    roleTagType(r) {
      return { LEADER: 'success', AGENT: '', AGENT_ORIGIN: 'warning' }[r] || 'info';
    },
    statusText(s) {
      return STATUS[s] || '-';
    },
    statusTagType(s) {
      return { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }[s] || 'info';
    },
    money(value) {
      return '￥' + Number(value || 0).toFixed(2);
    },
    // 后端存的是万分比（RATIO_BASE = 10000），不是百分比。直接当百分数显示会差 100 倍
    ratioText(ratio) {
      return (Number(ratio || 0) / 100).toFixed(2) + '%';
    },
    userName(uid) {
      const u = this.users[uid];
      return u ? u.nickname || '(未设置昵称)' : '查无此人';
    },
    loadList(page) {
      if (page) this.query.page = page;
      const params = {};
      Object.keys(this.query).forEach((key) => {
        const value = this.query[key];
        if (value !== '' && value !== null && value !== undefined && !Number.isNaN(value)) {
          params[key] = value;
        }
      });
      if (this.dateRange && this.dateRange.length === 2) {
        params.startTime = this.dateRange[0];
        params.endTime = this.dateRange[1];
      }
      this.loading = true;
      getCommissionList(params)
        .then((res) => {
          this.list = (res && res.list) || [];
          this.users = (res && res.users) || {};
          this.total = (res && res.total) || 0;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onSizeChange(size) {
      this.query.size = size;
      this.loadList(1);
    },
    reset() {
      this.dateRange = [];
      this.query = {
        role: '',
        regionPrefix: '',
        status: null,
        uid: null,
        agentId: null,
        orderNo: '',
        page: 1,
        size: 20,
      };
      this.loadList(1);
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
  width: 200px;
}
</style>
