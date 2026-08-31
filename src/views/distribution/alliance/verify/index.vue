<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="tips">
        全平台核销单，商户 ID 留空即查全部。金额单位是<b>分</b>，页面已换算成元展示。
        <br />
        「商户应收」是扣掉平台服务费之后的净额；部分退款的单据这个值已按比例冲减过，
        不需要再减一次。
      </div>

      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="商户ID">
          <el-input v-model.number="query.merchantId" clearable class="selWidthSm" />
        </el-form-item>
        <el-form-item label="用户uid">
          <el-input v-model.number="query.uid" clearable class="selWidthSm" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" clearable class="selWidthSm">
            <el-option label="积分抵扣" value="POINTS" />
            <el-option label="订单核销" value="ORDER" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable class="selWidthSm">
            <el-option v-for="(text, key) in STATUS" :key="key" :label="text" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="单号">
          <el-input v-model.trim="query.keyword" placeholder="核销单号 / 业务单号" clearable class="selWidth" />
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
        <el-table-column prop="verifyNo" label="核销单号" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="90">
          <template slot-scope="{ row }">{{ row.type === 'ORDER' ? '订单核销' : '积分抵扣' }}</template>
        </el-table-column>
        <el-table-column prop="merchantId" label="商户" width="80" />
        <el-table-column prop="storeId" label="门店" width="80" />
        <el-table-column prop="uid" label="用户uid" width="90" />
        <el-table-column label="订单金额" width="100">
          <template slot-scope="{ row }">{{ yuan(row.orderAmount) }}</template>
        </el-table-column>
        <el-table-column prop="deductPoints" label="抵扣积分" width="100" />
        <el-table-column label="抵扣金额" width="100">
          <template slot-scope="{ row }">{{ yuan(row.deductAmount) }}</template>
        </el-table-column>
        <el-table-column label="服务费" width="90">
          <template slot-scope="{ row }">{{ yuan(row.serviceFee) }}</template>
        </el-table-column>
        <el-table-column label="商户应收" width="100">
          <template slot-scope="{ row }">{{ yuan(row.receivable) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyTime" label="核销时间" min-width="150" />
        <el-table-column prop="createTime" label="创建时间" min-width="150" />
        <el-table-column prop="cancelReason" label="撤销原因" min-width="140" show-overflow-tooltip />
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
import { getVerifyRecords } from '@/api/alliance';

const STATUS = {
  PENDING_CONFIRM: '待确认',
  VERIFIED: '已核销',
  PART_REFUND: '部分退款',
  REFUNDED: '已退款',
  CANCELLED: '已撤销',
  EXPIRED: '已过期',
};

export default {
  name: 'AllianceVerifyRecords',
  data() {
    return {
      STATUS,
      loading: false,
      list: [],
      total: 0,
      dateRange: [],
      query: { merchantId: null, uid: null, type: '', status: '', keyword: '', page: 1, size: 20 },
    };
  },
  created() {
    this.loadList(1);
  },
  methods: {
    statusText(s) {
      return STATUS[s] || s || '-';
    },
    statusTagType(s) {
      return {
        PENDING_CONFIRM: 'warning',
        VERIFIED: 'success',
        PART_REFUND: 'warning',
        REFUNDED: 'danger',
        CANCELLED: 'danger',
        EXPIRED: 'info',
      }[s] || 'info';
    },
    // 后端一律用分存金额，不用浮点。这里只是展示，除以 100 即可
    yuan(fen) {
      return '￥' + (Number(fen || 0) / 100).toFixed(2);
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
      getVerifyRecords(params)
        .then((res) => {
          this.list = (res && res.list) || [];
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
      this.query = { merchantId: null, uid: null, type: '', status: '', keyword: '', page: 1, size: 20 };
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
