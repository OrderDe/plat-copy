<template>
  <el-drawer
    title="订单详情"
    :visible.sync="visible"
    size="800px"
    direction="rtl"
    :before-close="handleClose"
  >
    <div v-loading="loading" class="drawer-body">
      <template v-if="detail">
        <!-- 订单基本信息 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">订单信息</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单号">{{ detail.order && detail.order.orderSn }}</el-descriptions-item>
            <el-descriptions-item label="批次订单号">{{ detail.order && detail.order.batchOrderSn }}</el-descriptions-item>
            <el-descriptions-item label="外部订单号">{{ detail.order && detail.order.outOrderSn }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="statusTagType(detail.order && detail.order.orderStatus)" size="mini">
                {{ detail.order && detail.order.orderStatusName }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发货状态">
              <el-tag :type="sendTypeTag(detail.order && detail.order.sendType)" size="mini">
                {{ sendTypeLabel(detail.order && detail.order.sendType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单总额">
              <span class="price-text">¥{{ detail.order && detail.order.totalAmount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="支付金额">
              <span class="price-text">¥{{ detail.order && detail.order.payAmount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="SKU IDs">{{ detail.order && detail.order.skuIds }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detail.order && detail.order.createTime }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 收货地址 -->
        <el-card v-if="detail.receiveAddr" shadow="never" class="mb15">
          <div slot="header"><span class="card-title">收货地址</span></div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="收货人">{{ detail.receiveAddr.receiveName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail.receiveAddr.receiveMobile }}</el-descriptions-item>
            <el-descriptions-item label="收货地址">
              {{ detail.receiveAddr.provinceName }}{{ detail.receiveAddr.cityName }}{{ detail.receiveAddr.areaName }}{{ detail.receiveAddr.receiveAddrDetail }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 发货列表 -->
        <el-card v-if="detail.deliverList && detail.deliverList.length" shadow="never" class="mb15">
          <div slot="header"><span class="card-title">发货信息</span></div>
          <div v-for="(item, index) in detail.deliverList" :key="index" class="deliver-item mb15">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="发货时间">{{ item.sendTime }}</el-descriptions-item>
              <el-descriptions-item label="快递公司">{{ item.expressName }}</el-descriptions-item>
              <el-descriptions-item label="快递单号">{{ item.deliverySn }}</el-descriptions-item>
              <el-descriptions-item label="发货人">{{ item.sendName }}</el-descriptions-item>
              <el-descriptions-item label="发货地址" :span="2">{{ item.sendAddr }}</el-descriptions-item>
            </el-descriptions>

            <!-- 商品明细 -->
            <el-table v-if="item.expressItemList && item.expressItemList.length" :data="item.expressItemList" border size="mini" class="mt10">
              <el-table-column prop="goodsName" label="商品名称" min-width="200" show-overflow-tooltip />
              <el-table-column label="规格" min-width="120">
                <template slot-scope="scope">
                  <span>{{ formatSpec(scope.row.goodsSpecJson) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="goodsQuantity" label="商品数量" width="100" align="center" />
              <el-table-column prop="sendGoodsQuantity" label="发货数量" width="100" align="center" />
            </el-table>

            <!-- 物流轨迹 -->
            <div v-if="item.deliveryUpdateList && item.deliveryUpdateList.length" class="logistics-box mt10">
              <p class="logistics-title">物流轨迹</p>
              <div class="logistics-list">
                <div v-for="(log, logIndex) in item.deliveryUpdateList" :key="logIndex" class="logistics-item">
                  <span class="logistics-time">{{ log.time }}</span>
                  <span class="logistics-context">{{ log.context }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </template>
    </div>
  </el-drawer>
</template>

<script>
import { GetYytOrderDetail } from '@/api/yytapi';

const STATUS_MAP = {
  0: { label: '待支付', type: 'warning' },
  1: { label: '待发货', type: 'primary' },
  2: { label: '部分发货', type: 'success' },
  3: { label: '待核销', type: 'warning' },
  4: { label: '待收货', type: 'primary' },
  5: { label: '已收货', type: 'success' },
  6: { label: '已完成', type: 'success' },
  9: { label: '已取消', type: 'info' },
};

const SEND_TYPE_MAP = {
  0: { label: '未发货', type: 'info' },
  1: { label: '已发货', type: 'success' },
  2: { label: '部分发货', type: 'warning' },
};

export default {
  name: 'OrderDetailDrawer',
  data() {
    return {
      visible: false,
      loading: false,
      detail: null,
    };
  },
  methods: {
    open(orderSn) {
      this.visible = true;
      this.detail = null;
      this.loading = true;
      GetYytOrderDetail({ orderSn })
        .then((res) => {
          this.detail = res || {};
        })
        .finally(() => { this.loading = false; });
    },
    handleClose() { this.visible = false; },
    statusTagType(status) { return STATUS_MAP[status] && STATUS_MAP[status].type || 'info'; },
    sendTypeLabel(type) { return (SEND_TYPE_MAP[type] && SEND_TYPE_MAP[type].label) || type || '-'; },
    sendTypeTag(type) { return (SEND_TYPE_MAP[type] && SEND_TYPE_MAP[type].type) || 'info'; },
    formatSpec(goodsSpecJson) {
      if (!goodsSpecJson) return '-';
      try {
        const specs = JSON.parse(goodsSpecJson);
        return specs.map(s => s.specValueName).join('，');
      } catch (e) {
        return goodsSpecJson;
      }
    },
  },
};
</script>

<style scoped>
.drawer-body { padding: 20px; overflow-y: auto; height: 100%; }
.card-title { font-weight: 600; font-size: 14px; }
.price-text { color: #f56c6c; font-weight: 600; }
.deliver-item { padding-bottom: 15px; border-bottom: 1px solid #eee; }
.deliver-item:last-child { border-bottom: none; }
.logistics-box { background: #f5f7fa; padding: 15px; border-radius: 4px; }
.logistics-title { font-weight: 600; margin-bottom: 10px; font-size: 13px; }
.logistics-list { max-height: 200px; overflow-y: auto; }
.logistics-item { display: flex; padding: 6px 0; border-bottom: 1px dashed #e4e7ed; }
.logistics-item:last-child { border-bottom: none; }
.logistics-time { width: 140px; color: #909399; font-size: 12px; flex-shrink: 0; }
.logistics-context { color: #303133; font-size: 13px; }
</style>
