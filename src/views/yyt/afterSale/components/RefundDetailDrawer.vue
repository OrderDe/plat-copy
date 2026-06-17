<template>
  <el-drawer
    title="售后详情"
    :visible.sync="visible"
    size="800px"
    direction="rtl"
    :before-close="handleClose"
  >
    <div v-loading="loading" class="drawer-body">
      <template v-if="detail">
        <!-- 售后基本信息 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">售后信息</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="售后单号">{{ detail.returnSn }}</el-descriptions-item>
            <el-descriptions-item label="订单号">{{ detail.orderSn }}</el-descriptions-item>
            <el-descriptions-item label="第三方退款单号">{{ detail.channelReturnSn }}</el-descriptions-item>
            <el-descriptions-item label="售后类型">{{ detail.returnTypeName }}</el-descriptions-item>
            <el-descriptions-item label="售后状态">
              <el-tag size="mini">{{ detail.returnStatusName }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="申请退款金额">
              <span class="price-orange">¥{{ detail.applyReturnAmount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="实际退款金额">
              <span class="price-orange">¥{{ detail.actualReturnAmount }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 订单金额 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">订单金额</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="商品总金额">
              <span class="price-text">¥{{ detail.totalPrice }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="订单总额">
              <span class="price-text">¥{{ detail.totalOrderPrice }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="邮费">
              <span class="price-text">¥{{ detail.postFee }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="商品数量">{{ detail.totalGoodsQuantity }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 退款原因 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">退款原因</span></div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="退款原因">{{ detail.returnReason || '—' }}</el-descriptions-item>
            <el-descriptions-item label="用户留言">{{ detail.returnComment || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 订单来源 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">订单来源</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单类型">{{ detail.orderType || '—' }}</el-descriptions-item>
            <el-descriptions-item label="订单平台">{{ detail.appName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="应用ID">{{ detail.appId || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 供应商/分销商信息 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">供应商/分销商信息</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="供应商名称">{{ detail.supplierName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="分销商">{{ detail.distributor || '—' }}</el-descriptions-item>
            <el-descriptions-item label="买家名称">{{ detail.buyerName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="买家ID">{{ detail.buyerId || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 操作信息 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">操作信息</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="供应商操作人">{{ detail.supplierOperationName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="供应商操作类型">{{ detail.supplierOperationType || '—' }}</el-descriptions-item>
            <el-descriptions-item label="平台操作人">{{ detail.operationName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="平台操作类型">{{ detail.operationType || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 收货地址 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">收货地址</span></div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="收货人">{{ detail.receiveName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail.receivePhone || '—' }}</el-descriptions-item>
            <el-descriptions-item label="收货地址">{{ detail.receiveAddress || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 时间信息 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">时间信息</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="创建时间">{{ detail.createTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ detail.finishTime || '—'}}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ detail.modifyTime || '—'}}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 商品信息 -->
        <el-card v-if="detail.goodsList && detail.goodsList.length" shadow="never" class="mb15">
          <div slot="header"><span class="card-title">商品信息</span></div>
          <el-table :data="detail.goodsList" border size="small">
            <el-table-column prop="orderSn" label="订单号" />
            <el-table-column prop="totalPrice" label="商品金额">
              <template slot-scope="scope">¥{{ scope.row.totalPrice }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </template>
    </div>
  </el-drawer>
</template>

<script>
import { GetRefundDetail } from '@/api/yytapi';

export default {
  name: 'RefundDetailDrawer',
  data() {
    return {
      visible: false,
      loading: false,
      detail: null,
    };
  },
  methods: {
    open(returnSn) {
      this.visible = true;
      this.detail = null;
      this.loading = true;
      GetRefundDetail({ returnSn }).then((res) => { console.log(res); this.detail = res || {}; })
        .finally(() => { this.loading = false; });
    },
    handleClose() { this.visible = false; },
  },
};
</script>

<style scoped>
.drawer-body { padding: 20px; overflow-y: auto; height: 100%; }
.card-title { font-weight: 600; font-size: 14px; }
.price-text { color: #f56c6c; font-weight: 600; }
.price-orange { color: #E6A23C; font-weight: 600; }
</style>
