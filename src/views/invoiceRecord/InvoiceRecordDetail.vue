<template>
  <el-drawer title="发票详情" :visible.sync="dialogVisible" size="90%">
    <div class="pl20" v-loading="loading">
      <!-- ========== 1. 开票信息 ========== -->
      <el-descriptions title="开票信息" :column="2" border class="desc-block">
        <el-descriptions-item label="申请单号">{{ dataDetail.invoiceCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开票订单号">{{ dataDetail.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发票抬头">{{ dataDetail.invoiceTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开票金额">¥{{ (dataDetail.invoiceAmount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="开票类型">
          <el-tag v-if="dataDetail.invoiceType === 1" type="success" size="mini">企业</el-tag>
          <el-tag v-else type="info" size="mini">个人</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发票类型">
          <el-tag v-if="dataDetail.category === 1" size="mini">增值税普通发票</el-tag>
          <el-tag v-else-if="dataDetail.category === 2" type="warning" size="mini">增值税专用发票</el-tag>
          <el-tag v-else-if="dataDetail.category === 3" type="primary" size="mini">电子发票</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="税号">{{ dataDetail.taxNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开票状态">
          <el-tag v-if="dataDetail.status === 0" type="info" size="mini">开票中</el-tag>
          <el-tag v-else-if="dataDetail.status === 1" type="success" size="mini">已开票</el-tag>
          <el-tag v-else-if="dataDetail.status === 2" type="warning" size="mini">审核中</el-tag>
          <el-tag v-else-if="dataDetail.status === 3" type="primary" size="mini">已审核</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ dataDetail.userName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ formatDateTime(dataDetail.applyTime) }}</el-descriptions-item>
        <el-descriptions-item label="开票日期">{{ formatDateTime(dataDetail.invoiceTime) }}</el-descriptions-item>
        <el-descriptions-item label="企业地址" :span="2">{{ dataDetail.companyAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业电话">{{ dataDetail.companyPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ dataDetail.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开户银行">{{ dataDetail.bankName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行账户">{{ dataDetail.bankAccount || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="dataDetail.status === 0" class="go-btn" @click="handleUploadInvoice(dataDetail.id)">去开票
      </div>
      <!-- ========== 2. 订单信息 ========== -->
      <el-descriptions title="订单信息" :column="2" border class="desc-block" v-if="dataDetail.order">
        <el-descriptions-item label="订单号">{{ dataDetail.order.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="orderStatusTag(dataDetail.order.status)" size="mini">{{ orderStatusText(dataDetail.order.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="收货人">{{ dataDetail.order.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货电话">{{ dataDetail.order.userPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ dataDetail.order.userAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品总数">{{ dataDetail.order.totalNum || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品总价">¥{{ (dataDetail.order.proTotalPrice || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="邮费">¥{{ (dataDetail.order.totalPostage || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="订单总价">¥{{ (dataDetail.order.totalPrice || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="优惠券金额">¥{{ (dataDetail.order.couponPrice || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="实际支付">¥{{ (dataDetail.order.payPrice || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ payTypeText(dataDetail.order.payType) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDateTime(dataDetail.order.payTime) }}</el-descriptions-item>
        <el-descriptions-item label="支付渠道">{{ payChannelText(dataDetail.order.payChannel) }}</el-descriptions-item>
        <el-descriptions-item label="退款状态">{{ refundStatusText(dataDetail.order.refundStatus) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(dataDetail.order.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="用户备注" :span="2">{{ dataDetail.order.userRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="平台备注" :span="2">{{ dataDetail.order.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert v-else title="暂无订单信息" type="info" :closable="false" class="desc-block" />

      <!-- ========== 3. 商品信息 ========== -->
      <el-descriptions title="商品信息" :column="2" border class="desc-block" v-if="dataDetail.product">
        <el-descriptions-item label="商品名称" :span="2">{{ dataDetail.product.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品ID">{{ dataDetail.product.id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品简介">{{ dataDetail.product.intro || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品价格">¥{{ (dataDetail.product.price || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="原价">¥{{ (dataDetail.product.otPrice || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ dataDetail.product.unitName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="库存">{{ dataDetail.product.stock || '-' }}</el-descriptions-item>
        <el-descriptions-item label="销量">{{ dataDetail.product.sales || '-' }}</el-descriptions-item>
        <el-descriptions-item label="运费来源">
          <span v-if="dataDetail.product.freightSource === 1">京东物流实时运费</span>
          <span v-else>本地运费模板</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(dataDetail.product.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="商品图片" :span="2">
          <el-image
            v-if="dataDetail.product.image"
            :src="dataDetail.product.image"
            fit="cover"
            style="width: 80px; height: 80px; border-radius: 4px;"
            :preview-src-list="[dataDetail.product.image]"
          />
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-alert v-else title="暂无商品信息" type="info" :closable="false" class="desc-block" />
    </div>
    <span slot="footer">
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </span>
    <!-- 开票上传弹窗 -->
    <InvoiceUploadForm ref="uploadFormRef" @success="getDetail" />
  </el-drawer>
</template>

<script>
import { getInvoiceRecordDetail } from '@/api/invoiceRecord';
import InvoiceUploadForm from './InvoiceUploadForm.vue';
export default {
  name: 'InvoiceRecordDetail',
  data() {
    return {
      dialogVisible: false,
      loading: false,
      invoiceId: null,
      dataDetail: {}
    };
  },
  components: {
    InvoiceUploadForm,
  },
  methods: {
    getDetail(){
      this.getInvoiceDetail(this.invoiceId);
    },
    /** 开票上传操作 */
    handleUploadInvoice(id) {
      this.$refs.uploadFormRef.open(id);
    },
    /** 格式化时间 */
    formatDateTime(time) {
      if (!time) return '-';
      if (typeof time === 'number' && time > 1000000000000) {
        time = new Date(time);
      }
      if (time instanceof Date) {
        return time.toISOString().slice(0, 19).replace('T', ' ');
      }
      if (typeof time === 'string' && time.includes('-')) {
        return time.slice(0, 19);
      }
      return time || '-';
    },
    /** 订单状态文字 */
    orderStatusText(status) {
      const map = {
        0: '待支付', 1: '待发货', 2: '部分发货', 3: '待核销',
        4: '待收货', 5: '已收货', 6: '已完成', 9: '已取消'
      };
      return map[status] || '-';
    },
    /** 订单状态标签颜色 */
    orderStatusTag(status) {
      const map = { 0: 'danger', 1: 'warning', 4: 'primary', 5: 'success', 6: 'success', 9: 'info' };
      return map[status] || '';
    },
    /** 支付方式文字 */
    payTypeText(type) {
      const map = { weixin: '微信支付', alipay: '支付宝', yue: '余额支付' };
      return map[type] || type || '-';
    },
    /** 支付渠道文字 */
    payChannelText(channel) {
      const map = {
        public: '公众号', mini: '小程序', h5: '网页支付', yue: '余额',
        wechatIos: '微信Ios', wechatAndroid: '微信Android',
        alipay: '支付宝', alipayApp: '支付宝App'
      };
      return map[channel] || channel || '-';
    },
    /** 退款状态文字 */
    refundStatusText(status) {
      const map = { 0: '未退款', 1: '申请中', 2: '部分退款', 3: '已退款' };
      return map[status] || '-';
    },
    /** 获取发票详情 */
    async getInvoiceDetail(id) {
      try {
        const res = await getInvoiceRecordDetail(id);
        console.log(res);
        this.dataDetail = res;
      } catch (error) {
        console.error('获取发票信息失败:', error);
        this.$message.error('获取发票信息失败');
      }
    },
    /** 打开弹窗 */
    async open(id) {
      this.dialogVisible = true;
      this.loading = true;
      this.invoiceId = id;
      try {
        await this.getInvoiceDetail(id);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.desc-block {
  margin-bottom: 20px;
}
.go-btn{
  width: 84px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0084ff;
  color: #fff;
  border-radius: 4px;
  margin: 20px 0;
}
</style>
