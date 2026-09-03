<template>
  <div class="divBox">
    <el-card shadow="never" :bordered="false" class="filter-card">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="我方订单号">
          <el-input v-model.trim="query.orderNo" clearable placeholder="CH 开头" @keyup.enter.native="loadList(1)" />
        </el-form-item>
        <el-form-item label="第三方订单号">
          <el-input v-model.trim="query.outOrderNo" clearable placeholder="请输入订单号" @keyup.enter.native="loadList(1)" />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="query.channelId" clearable placeholder="全部渠道" @change="loadList(1)">
            <el-option v-for="item in channels" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" @change="loadList(1)">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList(1)">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :bordered="false" class="box-card mt14">
      <div class="toolbar">
        <el-button size="small" @click="downloadTemplate" v-hasPermi="['platform:channel:order:import']">下载导入模板</el-button>
        <el-upload
          action=""
          :show-file-list="false"
          :http-request="submitImport"
          :before-upload="beforeImport"
          v-hasPermi="['platform:channel:order:import']"
        >
          <el-button size="small" type="primary">导入订单</el-button>
        </el-upload>
        <el-select v-model="importChannelId" size="small" clearable placeholder="选择导入渠道" class="import-channel" v-hasPermi="['platform:channel:order:import']">
          <el-option v-for="item in channels" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="list" size="small" class="table mt20" border>
        <el-table-column prop="orderNo" label="我方订单号" min-width="165" />
        <el-table-column prop="outOrderNo" label="第三方订单号" min-width="150" />
        <el-table-column prop="channelName" label="渠道" min-width="120" />
        <el-table-column label="收货人" min-width="130">
          <template slot-scope="scope">{{ scope.row.realName || '-' }}<br /><span class="muted">{{ scope.row.userPhone || '' }}</span></template>
        </el-table-column>
        <el-table-column prop="totalNum" label="件数" width="70" />
        <el-table-column prop="totalPrice" label="金额" width="95" />
        <el-table-column label="发货方式" width="105">
          <template slot-scope="scope">{{ Number(scope.row.shipMode) === 1 ? 'WMS 出库' : '直接填单号' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="95">
          <template slot-scope="scope"><el-tag size="mini" :type="statusType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="expressNo" label="运单号" min-width="135" />
        <el-table-column label="操作" width="160" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="showDetail(scope.row)">详情</el-button>
            <el-button v-if="Number(scope.row.status) === 0" type="text" size="small" @click="openShip(scope.row)" v-hasPermi="['platform:channel:order:ship']">发货</el-button>
            <el-button v-if="Number(scope.row.status) === 0" type="text" size="small" class="danger" @click="cancelOrder(scope.row)" v-hasPermi="['platform:channel:order:ship']">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="query.page"
          :page-size="query.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="changeSize"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <el-dialog title="渠道订单详情" :visible.sync="detailVisible" width="760px">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="我方订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="第三方订单号">{{ detail.outOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detail.channelName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ detail.realName }} {{ detail.userPhone }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ address(detail) }}</el-descriptions-item>
        <el-descriptions-item label="运单号">{{ detail.expressNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detail && detail.items" :data="detail.items" border size="small" class="mt14">
        <el-table-column prop="productName" label="商品" min-width="180" />
        <el-table-column prop="sourceProductName" label="来源/店铺" min-width="150" />
        <el-table-column prop="sku" label="规格" min-width="130" />
        <el-table-column prop="outSkuCode" label="第三方商品编码" min-width="150" />
        <el-table-column prop="num" label="数量" width="70" />
        <el-table-column label="匹配状态" width="100"><template slot-scope="scope"><el-tag size="mini" :type="scope.row.attrValueId ? 'success' : 'danger'">{{ scope.row.attrValueId ? '已匹配' : '未匹配 SKU' }}</el-tag></template></el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog title="填写快递单号" :visible.sync="shipVisible" width="460px">
      <el-form ref="shipForm" :model="shipForm" label-width="90px" size="small">
        <el-form-item label="快递公司"><el-input v-model.trim="shipForm.expressName" placeholder="如：顺丰" /></el-form-item>
        <el-form-item label="快递单号"><el-input v-model.trim="shipForm.expressNo" placeholder="请输入运单号" /></el-form-item>
        <el-form-item label="备注"><el-input v-model.trim="shipForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer"><el-button @click="shipVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submitShip">确认发货</el-button></div>
    </el-dialog>
  </div>
</template>

<script>
import {
  channelListApi,
  channelOrderListApi,
  channelOrderDetailApi,
  channelOrderTemplateApi,
  channelOrderImportApi,
  channelShipApi,
  channelCancelApi,
} from '@/api/channel';

const STATUS = { 0: '待发货', 1: '仓库处理中', 2: '已发货', 3: '已取消' };

export default {
  name: 'ChannelOrder',
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      total: 0,
      channels: [],
      importChannelId: null,
      query: { page: 1, limit: 20, orderNo: '', outOrderNo: '', channelId: null, status: null },
      statusOptions: Object.keys(STATUS).map((value) => ({ value: Number(value), label: STATUS[value] })),
      detailVisible: false,
      detail: null,
      shipVisible: false,
      shipForm: { orderNo: '', expressName: '', expressNo: '', remark: '' },
    };
  },
  created() {
    this.loadChannels();
    this.loadList(1);
  },
  methods: {
    clean(params) {
      const result = {};
      Object.keys(params).forEach((key) => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) result[key] = params[key];
      });
      return result;
    },
    loadChannels() {
      channelListApi({ page: 1, limit: 200 }).then((res) => { this.channels = (res && (res.list || res.records)) || []; });
    },
    loadList(page) {
      if (page) this.query.page = page;
      this.loading = true;
      channelOrderListApi(this.clean(this.query)).then((res) => {
        this.list = (res && (res.list || res.records)) || [];
        this.total = Number((res && res.total) || 0);
      }).finally(() => { this.loading = false; });
    },
    changeSize(size) { this.query.limit = size; this.loadList(1); },
    resetQuery() { this.query = { page: 1, limit: 20, orderNo: '', outOrderNo: '', channelId: null, status: null }; this.loadList(1); },
    statusText(value) { return STATUS[value] || '-'; },
    statusType(value) { return { 0: 'warning', 1: 'info', 2: 'success', 3: 'danger' }[value] || 'info'; },
    address(row) { return [row.province, row.city, row.district, row.detailAddress].filter(Boolean).join('') || '-'; },
    showDetail(row) {
      channelOrderDetailApi(row.orderNo).then((res) => { this.detail = res || row; this.detailVisible = true; });
    },
    downloadTemplate() {
      channelOrderTemplateApi().then((response) => {
        const blob = response && response.data ? response.data : response;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = '私域渠道订单导入模板.xlsx'; link.click(); window.URL.revokeObjectURL(url);
      });
    },
    beforeImport() {
      if (!this.importChannelId) { this.$message.warning('请先选择导入渠道'); return false; }
      return true;
    },
    submitImport(option) {
      const form = new FormData(); form.append('channelId', this.importChannelId); form.append('file', option.file);
      channelOrderImportApi(form).then((res) => {
        this.$message.success('导入完成');
        if (res && res.failList && res.failList.length) this.$alert(`有 ${res.failList.length} 行导入失败，请到“导入记录”查看详情`, '导入提示');
        this.loadList(1);
      }).catch(() => {}).finally(() => { option.onSuccess && option.onSuccess(); });
    },
    openShip(row) { this.shipForm = { orderNo: row.orderNo, expressName: '', expressNo: '', remark: '' }; this.shipVisible = true; },
    submitShip() {
      if (!this.shipForm.expressNo) { this.$message.warning('请输入快递单号'); return; }
      this.saving = true;
      channelShipApi(this.shipForm).then(() => { this.$message.success('发货成功'); this.shipVisible = false; this.loadList(); }).finally(() => { this.saving = false; });
    },
    cancelOrder(row) {
      this.$prompt('请输入取消原因（可选）', '取消订单', { inputPlaceholder: '取消原因' }).then(({ value }) => channelCancelApi({ orderNo: row.orderNo, reason: value })).then(() => { this.$message.success('已取消'); this.loadList(); }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.filter-card { margin-bottom: 14px; }
.toolbar { display: flex; align-items: center; gap: 10px; }
.import-channel { width: 160px; }
.pagination { text-align: right; margin-top: 20px; }
.muted { color: #999; font-size: 12px; }
.danger { color: #f56c6c; }
</style>
