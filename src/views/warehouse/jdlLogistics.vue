<template>
  <div class="app-container jdl-page">
    <el-card class="jdl-hero" shadow="never">
      <div class="hero-mark">JD</div>
      <div class="hero-copy">
        <h2>京东物流查询工作台</h2>
        <p>运单查询、全程轨迹、实时位置、预计送达和异常处理统一入口</p>
      </div>
      <div class="hero-context">
        <el-select v-model="merchantId" v-if="isPlatform && canSelectMerchant" clearable filterable size="small" placeholder="全部商户" @change="onMerchantChange">
          <el-option v-for="item in merchantList" :key="item.id" :label="merchantLabel(item)" :value="item.id" />
        </el-select>
        <span v-else-if="isPlatform" class="merchant-name">平台账号无商户切换权限</span>
        <span v-else class="merchant-name">店铺：{{ currentMerchantName }}</span>
        <el-tag type="success" size="small"><i class="el-icon-success" /> 接口已接入</el-tag>
      </div>
    </el-card>

    <el-container class="jdl-workspace">
      <el-aside width="190px" class="jdl-aside">
        <el-menu :default-active="activePage" class="jdl-menu" @select="selectPage">
          <div class="menu-title">物流信息查询</div>
          <el-menu-item v-for="item in queryPages" :key="item.key" :index="item.key">
            <i :class="item.icon" /> <span slot="title">{{ item.label }}</span>
          </el-menu-item>
          <div class="menu-title">运营配置</div>
          <el-menu-item v-for="item in operationPages" :key="item.key" :index="item.key">
            <i :class="item.icon" /> <span slot="title">{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="jdl-main">
        <section v-show="activePage === 'overview'">
          <div class="notice"><i class="el-icon-info" /> 页面数据来自京东物流接口；平台端可切换商户，商户端自动使用当前登录商户。</div>
          <el-row :gutter="12" class="stats-row">
            <el-col :span="6"><el-card shadow="never" class="stat-card"><span>本次会话查询</span><strong>{{ history.length }}</strong><small>点击查询后实时累计</small></el-card></el-col>
            <el-col :span="6"><el-card shadow="never" class="stat-card"><span>已查询运单</span><strong class="blue">{{ waybillCount }}</strong><small>运单信息或轨迹查询</small></el-card></el-col>
            <el-col :span="6"><el-card shadow="never" class="stat-card"><span>接口成功次数</span><strong class="green">{{ successCount }}</strong><small>仅统计当前会话</small></el-card></el-col>
            <el-col :span="6"><el-card shadow="never" class="stat-card"><span>需关注状态</span><strong class="orange">{{ exceptionCount }}</strong><small>异常、拦截或取消</small></el-card></el-col>
          </el-row>
          <el-row :gutter="12" class="overview-row">
            <el-col :span="16">
              <el-card shadow="never">
                <div class="card-title">快速查询 <span>支持京东运单号、商家订单号</span></div>
                <el-form :inline="true" size="small" class="toolbar" @submit.native.prevent="quickQuery">
                  <el-select v-model="quickForm.type" style="width:125px"><el-option label="京东运单号" value="waybillCode" /><el-option label="商家订单号" value="customerOrderCode" /></el-select>
                  <el-input v-model.trim="quickForm.value" style="width:270px" placeholder="请输入编号" @keyup.enter.native="quickQuery" />
                  <el-button type="primary" :loading="loading.quick" @click="quickQuery">查询</el-button>
                  <el-button @click="selectPage('track')">全程跟踪</el-button>
                </el-form>
                <el-table :data="history.slice(0, 5)" border stripe size="small" empty-text="本次会话暂无查询记录">
                  <el-table-column prop="code" label="查询编号" min-width="180" show-overflow-tooltip />
                  <el-table-column prop="typeLabel" label="类型" width="110" />
                  <el-table-column prop="statusDesc" label="状态" min-width="140" show-overflow-tooltip />
                  <el-table-column prop="time" label="查询时间" width="170" />
                  <el-table-column label="操作" width="90"><template slot-scope="{ row }"><el-button type="text" @click="openDetail(row.code)">详情</el-button></template></el-table-column>
                </el-table>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="health-card">
                <div class="card-title">接口能力 <span>服务端已提供</span></div>
                <div v-for="item in healthRows" :key="item.label" class="health-row"><span>{{ item.label }}</span><el-tag type="success" size="mini">{{ item.status }}</el-tag></div>
              </el-card>
            </el-col>
          </el-row>
        </section>

        <section v-show="activePage === 'waybill'">
          <el-card shadow="never">
            <div class="card-title">运单信息查询 <span>运单详情、订单状态和附件</span></div>
            <el-form :inline="true" size="small" class="toolbar" @submit.native.prevent="queryWaybill">
              <el-input v-model.trim="waybillCode" style="width:300px" placeholder="请输入京东运单号" @keyup.enter.native="queryWaybill" />
              <el-button type="primary" :loading="loading.waybill" @click="queryWaybill">查询</el-button>
              <el-button :disabled="!waybillRows.length" @click="exportWaybill">导出结果</el-button>
            </el-form>
            <el-table :data="waybillRows" border stripe size="small" empty-text="请输入运单号查询">
              <el-table-column prop="waybillCode" label="运单号" min-width="180" />
              <el-table-column prop="orderCode" label="京东订单号" min-width="150" />
              <el-table-column prop="route" label="寄件/收件" min-width="210" show-overflow-tooltip />
              <el-table-column prop="weight" label="重量/体积" width="125" />
              <el-table-column prop="productName" label="产品类型" min-width="120" />
              <el-table-column label="当前状态" width="120"><template slot-scope="{ row }"><el-tag :type="statusType(row.statusDesc)" size="mini">{{ row.statusDesc || '待查询' }}</el-tag></template></el-table-column>
              <el-table-column label="创建时间" width="170"><template slot-scope="{ row }">{{ formatDateTime(row.createTime) }}</template></el-table-column>
              <el-table-column label="操作" width="170" fixed="right"><template slot-scope="{ row }"><el-button type="text" @click="openDetail(row.waybillCode)">详情</el-button><el-button type="text" @click="queryAttachment(row.waybillCode)">附件</el-button></template></el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="never" class="field-model"><div class="card-title">已接入返回字段</div><code>waybillCode、orderCode、productType、senderCity、receiverCity、weight、volume、currentStatus、pickupTime、signTime、attachments[]</code></el-card>
        </section>

        <section v-show="activePage === 'track'">
          <el-row :gutter="12">
            <el-col :span="16"><el-card shadow="never"><div class="card-title">运单全程跟踪 <span>查询京东物流轨迹节点</span></div><div class="toolbar"><el-input v-model.trim="trackCode" style="width:300px" placeholder="请输入京东运单号" @keyup.enter.native="queryTrace" /><el-button type="primary" :loading="loading.track" @click="queryTrace">查询轨迹</el-button><el-button @click="queryTrace">刷新</el-button></div><el-timeline v-if="traceDetails.length" class="trace-list"><el-timeline-item v-for="(item, index) in traceDetails" :key="`${item.operationTime}-${index}`" :timestamp="formatDateTime(item.operationTime)" :type="index === 0 ? 'primary' : 'success'"><b>{{ item.operationTitle || item.categoryName || '物流节点' }}</b><p>{{ item.operationRemark || '-' }}</p><small>{{ item.operatorName || '' }}</small></el-timeline-item></el-timeline><el-empty v-else description="请输入运单号查询轨迹" /></el-card></el-col>
            <el-col :span="8"><el-card shadow="never"><div class="card-title">轨迹摘要</div><div class="info-row"><b>当前节点</b><span>{{ traceDetails[0] ? (traceDetails[0].operationTitle || traceDetails[0].categoryName) : '-' }}</span></div><div class="info-row"><b>更新时间</b><span>{{ traceDetails[0] ? formatDateTime(traceDetails[0].operationTime) : '-' }}</span></div><div class="info-row"><b>节点数量</b><span>{{ traceDetails.length }}</span></div></el-card></el-col>
          </el-row>
        </section>

        <section v-show="activePage === 'location'"><el-row :gutter="12"><el-col :span="16"><el-card shadow="never"><div class="card-title">运单实时位置 <span>配送中运单可查询最新 GPS 点位</span></div><div class="toolbar"><el-input v-model.trim="locationCode" style="width:300px" placeholder="请输入京东运单号" @keyup.enter.native="queryLocation" /><el-button type="primary" :loading="loading.location" @click="queryLocation">刷新位置</el-button><el-button :disabled="!latestPoint" @click="openMap">打开地图</el-button></div><div class="mapbox"><div class="map-grid" /><div v-if="latestPoint" class="map-pin" :style="pinStyle"><i class="el-icon-location" /></div><div v-if="latestPoint" class="map-tip"><b>最新位置</b><br>{{ formatDateTime(latestPoint.gpsTime) }}<br><span>{{ latestPoint.lng }}, {{ latestPoint.lat }}</span></div><el-empty v-else description="请输入运单号查询位置" /></div></el-card></el-col><el-col :span="8"><el-card shadow="never"><div class="card-title">位置明细</div><div class="info-row"><b>经纬度</b><span>{{ latestPoint ? `${latestPoint.lng}, ${latestPoint.lat}` : '-' }}</span></div><div class="info-row"><b>更新时间</b><span>{{ latestPoint ? formatDateTime(latestPoint.gpsTime) : '-' }}</span></div><div class="info-row"><b>运输工具</b><span>{{ locationData && locationData.courierName ? `${locationData.courierName}${locationData.courierMobile ? ` · ${locationData.courierMobile}` : ''}` : '-' }}</span></div><div class="info-row"><b>点位数量</b><span>{{ locationPoints.length }}</span></div></el-card></el-col></el-row></section>

        <section v-show="activePage === 'eta'"><el-card shadow="never"><div class="card-title">预计送达时间 <span>支持单个或批量运单查询</span></div><div class="toolbar"><el-input v-model="etaCodes" type="textarea" :rows="2" style="width:420px" placeholder="每行或逗号分隔一个运单号" /><el-button type="primary" :loading="loading.eta" @click="queryEta">查询 ETA</el-button></div><el-table :data="etaRows" border stripe size="small" empty-text="请输入运单号查询"><el-table-column prop="waybillCode" label="运单号" min-width="220" /><el-table-column prop="deliveryTime" label="预计送达" min-width="200" /><el-table-column label="查询结果" width="130"><template slot-scope="{ row }"><el-tag :type="row.error ? 'danger' : 'success'" size="mini">{{ row.error ? '查询失败' : '已返回' }}</el-tag></template></el-table-column><el-table-column prop="error" label="备注" min-width="240" show-overflow-tooltip /></el-table></el-card></section>

        <section v-show="activePage === 'receiver'"><el-row :gutter="12"><el-col :span="15"><el-card shadow="never"><div class="card-title">收件人信息校验 <span>校验手机号后四位与运单地址</span></div><el-form :model="receiverForm" label-width="105px" size="small" class="form-panel"><el-form-item label="京东运单号"><el-input v-model.trim="receiverForm.waybillCode" placeholder="请输入运单号" /></el-form-item><el-form-item label="手机号后四位"><el-input v-model.trim="receiverForm.mobileLast4" maxlength="4" placeholder="例如 6688" /></el-form-item><el-form-item label="收件详细地址"><el-input v-model.trim="receiverForm.fullAddress" type="textarea" :rows="3" placeholder="请输入与订单一致的完整地址" /></el-form-item><el-form-item><el-button type="primary" :loading="loading.receiver" @click="verifyReceiver">立即校验</el-button></el-form-item></el-form><el-alert v-if="receiverResult !== null" :title="receiverResult ? '校验通过' : '校验未通过，请核对收件信息'" :type="receiverResult ? 'success' : 'warning'" :closable="false" show-icon /></el-card></el-col><el-col :span="9"><el-card shadow="never"><div class="card-title">附近网点查询</div><el-form :model="siteForm" label-width="65px" size="small"><el-form-item label="省份"><el-input v-model.trim="siteForm.province" /></el-form-item><el-form-item label="城市"><el-input v-model.trim="siteForm.city" /></el-form-item><el-form-item label="区县"><el-input v-model.trim="siteForm.county" /></el-form-item><el-form-item label="地址"><el-input v-model.trim="siteForm.address" /></el-form-item><el-form-item><el-button type="primary" :loading="loading.sites" @click="querySites">查询网点</el-button></el-form-item></el-form><el-table v-if="siteRows.length" :data="siteRows" border size="mini"><el-table-column prop="siteName" label="网点" min-width="130" /><el-table-column prop="distance" label="距离(km)" width="85" /></el-table></el-card></el-col></el-row></section>

        <section v-show="activePage === 'freight'"><el-row :gutter="12"><el-col :span="15"><el-card shadow="never"><div class="card-title">运费查询 <span>下单前预估，结果以京东实际结算为准</span></div><el-form :model="freightForm" label-width="90px" size="small" class="form-panel"><el-form-item label="目的省份"><el-input v-model.trim="freightForm.receiveProvince" /></el-form-item><el-form-item label="目的城市"><el-input v-model.trim="freightForm.receiveCity" /></el-form-item><el-form-item label="目的区县"><el-input v-model.trim="freightForm.receiveCounty" /></el-form-item><el-form-item label="重量(kg)"><el-input-number v-model="freightForm.weight" :min="0.01" :precision="2" controls-position="right" /></el-form-item><el-form-item label="产品编码"><el-input v-model.trim="freightForm.productCode" placeholder="可选，默认京东标准快递" /></el-form-item><el-form-item v-if="isPlatform && canSelectMerchant" label="计费商户"><el-select v-model="freightForm.merId" clearable filterable placeholder="全部商户"><el-option v-for="item in merchantList" :key="item.id" :label="merchantLabel(item)" :value="item.id" /></el-select></el-form-item><el-form-item><el-button type="primary" :loading="loading.freight" @click="queryFreight">试算运费</el-button></el-form-item></el-form></el-card></el-col><el-col :span="9"><el-card shadow="never"><div class="card-title">费用明细</div><div v-if="freightResult" class="fee-result"><div class="fee-total">¥{{ freightTotal }}</div><div class="info-row"><b>预估费用</b><span>¥{{ money(freightResult.totalFreightPre) }}</span></div><div class="info-row"><b>标准费用</b><span>¥{{ money(freightResult.totalFreightStandard) }}</span></div><div v-if="freightResult.commonFeeInfoResponse" class="info-row"><b>计费重量</b><span>{{ freightResult.commonFeeInfoResponse.calWeight || '-' }} kg</span></div></div><el-empty v-else description="填写目的地后试算" /></el-card></el-col></el-row></section>

        <section v-show="activePage === 'push'"><el-card shadow="never"><div class="card-title">物流轨迹推送配置 <span>以下地址由本系统接收京东物流回调</span></div><el-alert title="回调地址需要在京东物流开放平台配置；本页不展示虚假的启停开关。" type="info" :closable="false" show-icon class="push-tip" /><el-table :data="callbackRows" border stripe size="small"><el-table-column prop="label" label="推送类型" min-width="150" /><el-table-column prop="url" label="回调地址" min-width="380" show-overflow-tooltip /><el-table-column prop="endpoint" label="后端接口" min-width="170" /><el-table-column label="状态" width="120"><template><el-tag type="success" size="mini">接收端已实现</el-tag></template></el-table-column><el-table-column label="操作" width="90"><template slot-scope="{ row }"><el-button type="text" @click="copyCallback(row.url)">复制</el-button></template></el-table-column></el-table></el-card><el-card shadow="never" class="push-doc"><div class="card-title">失败处理建议</div><p>京东物流回调由后端记录到应用日志；如需重试或告警，请在网关/日志平台配置监控。业务订单与运单映射完成后，可继续扩展自动确认收货等动作。</p></el-card></section>

        <section v-show="activePage === 'exceptions'"><el-row :gutter="12" class="stats-row"><el-col :span="8"><el-card shadow="never" class="stat-card"><span>当前会话异常查询</span><strong class="orange">{{ exceptionRows.length }}</strong><small>状态来自京东实时查询</small></el-card></el-col><el-col :span="8"><el-card shadow="never" class="stat-card"><span>已勾选运单</span><strong class="blue">{{ selectedExceptions.length }}</strong><small>可批量解除拦截</small></el-card></el-col><el-col :span="8"><el-card shadow="never" class="stat-card"><span>可取消订单</span><strong class="red">{{ cancellableCount }}</strong><small>需要同时提供订单号</small></el-card></el-col></el-row><el-card shadow="never" class="exception-card"><div class="card-title">异常与拦截监控 <span>订单状态查询 / 批量解除拦截 / 订单取消</span></div><el-form :inline="true" size="small" class="toolbar" @submit.native.prevent="queryException"><el-input v-model.trim="exceptionForm.waybillCode" style="width:220px" placeholder="京东运单号" /><el-input v-model.trim="exceptionForm.customerOrderCode" style="width:220px" placeholder="商家订单号（可选）" /><el-button type="primary" :loading="loading.exception" @click="queryException">查询状态</el-button><el-button type="danger" :disabled="!selectedExceptions.length" @click="removeSelectedIntercept">批量解除拦截</el-button></el-form><el-table :data="exceptionRows" border stripe size="small" @selection-change="selectedExceptions = $event" empty-text="请输入运单号查询"><el-table-column type="selection" width="50" /><el-table-column prop="customerOrderCode" label="商家订单号" min-width="170" /><el-table-column prop="waybillCode" label="运单号" min-width="180" /><el-table-column label="当前状态" width="140"><template slot-scope="{ row }"><el-tag :type="statusType(row.statusDesc)" size="mini">{{ row.statusDesc || '-' }}</el-tag></template></el-table-column><el-table-column prop="queryTime" label="查询时间" width="170" /><el-table-column label="操作" width="180"><template slot-scope="{ row }"><el-button type="text" @click="openDetail(row.waybillCode)">详情</el-button><el-button type="text" :disabled="!row.orderId || !row.customerOrderCode" @click="cancelException(row)">取消订单</el-button></template></el-table-column></el-table></el-card></section>
      </el-main>
    </el-container>

    <el-drawer :title="drawerTitle" :visible.sync="drawerVisible" size="480px"><div v-loading="loading.detail" class="drawer-content"><template v-if="drawerDetail"><div class="drawer-status"><el-tag :type="statusType(drawerDetail.statusDesc)">{{ drawerDetail.statusDesc || '状态待查询' }}</el-tag><span>{{ drawerDetail.waybillCode }}</span></div><div class="info-row"><b>京东订单号</b><span>{{ drawerDetail.orderCode || '-' }}</span></div><div class="info-row"><b>寄件网点</b><span>{{ drawerDetail.pickupSiteName || '-' }}</span></div><div class="info-row"><b>配送网点</b><span>{{ drawerDetail.deliverySiteName || '-' }}</span></div><div class="info-row"><b>产品类型</b><span>{{ drawerDetail.productName || '-' }}</span></div><div class="info-row"><b>重量</b><span>{{ drawerDetail.weight || '-' }}{{ drawerDetail.weight ? ' kg' : '' }}</span></div><div class="info-row"><b>创建时间</b><span>{{ drawerDetail.createTime || '-' }}</span></div><div class="info-row"><b>预计送达</b><span>{{ drawerDetail.deliveryTime || '-' }}</span></div><div class="info-row"><b>收件地址</b><span>{{ drawerDetail.receiverAddress || '-' }}</span></div><div class="drawer-actions"><el-button type="primary" size="small" @click="selectPage('track'); trackCode = drawerDetail.waybillCode; drawerVisible = false; queryTrace()">查看轨迹</el-button><el-button size="small" @click="queryAttachment(drawerDetail.waybillCode)">查询附件</el-button></div></template><el-empty v-else description="暂无详情" /></div></el-drawer>
    <el-dialog title="运单附件" :visible.sync="attachmentVisible" width="520px"><div v-if="attachmentUrl"><a :href="attachmentUrl" target="_blank" rel="noopener">打开京东物流附件</a><p class="muted">附件地址由京东接口返回，请注意权限和有效期。</p></div><el-empty v-else description="该运单暂无可用附件" /></el-dialog>
  </div>
</template>

<script>
import Cookies from 'js-cookie';
import SettingMer from '@/utils/settingMer';
import { merchantListApi } from '@/api/merchant';
import { jdlLogisticsApi } from '@/api/jdlLogistics';

const emptyLoading = () => ({ quick: false, waybill: false, detail: false, track: false, location: false, eta: false, receiver: false, sites: false, freight: false, exception: false });

export default {
  name: 'JdlLogisticsWorkbench',
  data() {
    return {
      isPlatform: true,
      activePage: 'overview',
      queryPages: [
        { key: 'overview', label: '查询工作台', icon: 'el-icon-monitor' },
        { key: 'waybill', label: '运单信息查询', icon: 'el-icon-tickets' },
        { key: 'track', label: '运单全程跟踪', icon: 'el-icon-s-operation' },
        { key: 'location', label: '实时位置查询', icon: 'el-icon-location-outline' },
        { key: 'eta', label: '预计送达时间', icon: 'el-icon-time' },
        { key: 'receiver', label: '收件人信息校验', icon: 'el-icon-user' },
      ],
      operationPages: [
        { key: 'freight', label: '运费查询', icon: 'el-icon-money' },
        { key: 'push', label: '物流轨迹推送', icon: 'el-icon-upload2' },
        { key: 'exceptions', label: '异常与拦截监控', icon: 'el-icon-warning-outline' },
      ],
      merchantId: null,
      merchantList: [],
      loading: emptyLoading(),
      quickForm: { type: 'waybillCode', value: '' },
      history: [],
      waybillCode: '',
      waybillRows: [],
      trackCode: '',
      traceDetails: [],
      locationCode: '',
      locationData: null,
      locationPoints: [],
      etaCodes: '',
      etaRows: [],
      receiverForm: { waybillCode: '', mobileLast4: '', fullAddress: '' },
      receiverResult: null,
      siteForm: { province: '', city: '', county: '', address: '' },
      siteRows: [],
      freightForm: { merId: null, receiveProvince: '', receiveCity: '', receiveCounty: '', weight: 1, productCode: '' },
      freightResult: null,
      exceptionForm: { waybillCode: '', customerOrderCode: '' },
      exceptionRows: [],
      selectedExceptions: [],
      drawerVisible: false,
      drawerTitle: '运单详情',
      drawerDetail: null,
      attachmentVisible: false,
      attachmentUrl: '',
    };
  },
  computed: {
    currentMerchantName() { return this.$store.getters.name || Cookies.get('JavaMerchantName') || '当前登录商户'; },
    waybillCount() { return this.history.filter((item) => item.type === 'waybillCode').length; },
    successCount() { return this.history.filter((item) => item.success).length; },
    exceptionCount() { return this.history.filter((item) => /异常|拦截|取消|失败/.test(item.statusDesc || '')).length; },
    cancellableCount() { return this.exceptionRows.filter((item) => item.orderId && item.customerOrderCode).length; },
    latestPoint() { return this.locationPoints.length ? this.locationPoints[this.locationPoints.length - 1] : null; },
    pinStyle() { return this.latestPoint ? { left: `${25 + ((Math.abs(Number(this.latestPoint.lng)) * 17) % 50)}%`, top: `${25 + ((Math.abs(Number(this.latestPoint.lat)) * 13) % 45)}%` } : {}; },
    currentMerchantLabel() { return this.merchantId ? this.merchantLabel(this.merchantList.find((item) => item.id === this.merchantId) || {}) : '全部商户'; },
    freightTotal() { return this.freightResult ? this.money(this.freightResult.totalFreightPre) : '0.00'; },
    canSelectMerchant() {
      const permissions = (this.$store && this.$store.getters && this.$store.getters.permissions) || [];
      return permissions.includes('*:*:*') || permissions.includes('platform:merchant:page:list');
    },
    callbackRows() {
      const origin = String(SettingMer.httpUrl || '').replace(/\/$/, '');
      return [
        { label: '轨迹节点推送', endpoint: 'POST /api/webhook/jdl/trace', url: `${origin}/api/webhook/jdl/trace` },
        { label: '拦截状态推送', endpoint: 'POST /api/webhook/jdl/intercept', url: `${origin}/api/webhook/jdl/intercept` },
        { label: '附件信息推送', endpoint: 'POST /api/webhook/jdl/attachment', url: `${origin}/api/webhook/jdl/attachment` },
        { label: '验货服务推送', endpoint: 'POST /api/webhook/jdl/inspection', url: `${origin}/api/webhook/jdl/inspection` },
        { label: '通用费用回推', endpoint: 'POST /api/webhook/jdl/fee', url: `${origin}/api/webhook/jdl/fee` },
      ];
    },
    healthRows() { return [{ label: '运单信息查询', status: '已接入' }, { label: '全程跟踪', status: '已接入' }, { label: '实时位置', status: '已接入' }, { label: '运费查询', status: '已接入' }, { label: 'Webhook 接收', status: '已接入' }]; },
  },
  created() { this.loadMerchants(); },
  methods: {
    selectPage(page) { this.activePage = page; },
    merchantLabel(item) { return item.name || item.merName || item.merchantName || item.account || `商户 ${item.id || ''}`; },
    async loadMerchants() {
      if (!this.canSelectMerchant) return;
      try {
        const res = await merchantListApi({ page: 1, limit: 999 });
        this.merchantList = (res && (res.list || res.records)) || [];
      } catch (e) { this.merchantList = []; }
    },
    onMerchantChange() { this.freightForm.merId = this.merchantId; this.history = []; this.exceptionRows = []; },
    formatDateTime(value) {
      if (value === null || value === undefined || value === '') return '-';
      if (typeof value === 'number' || /^\d+$/.test(String(value))) { const date = new Date(Number(value) < 10000000000 ? Number(value) * 1000 : Number(value)); return this.formatDateTime(date); }
      if (Object.prototype.toString.call(value) === '[object Date]') { if (Number.isNaN(value.getTime())) return '-'; return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`; }
      return String(value).replace('T', ' ').replace(/\.\d{3,}/, '').replace(/Z$/, '');
    },
    money(value) { const n = Number(value); return Number.isFinite(n) ? n.toFixed(2) : '0.00'; },
    statusType(status) { if (/签收|完成|正常|成功|揽收/.test(status || '')) return 'success'; if (/异常|失败|取消/.test(status || '')) return 'danger'; if (/拦截|运输|派送|等待/.test(status || '')) return 'warning'; return 'info'; },
    addHistory(code, type, statusDesc, success) { this.history.unshift({ code, type, typeLabel: type === 'waybillCode' ? '京东运单号' : '商家订单号', statusDesc: statusDesc || '已返回', success: !!success, time: this.formatDateTime(new Date()) }); this.history = this.history.slice(0, 30); },
    normalizeWaybillInfo(info, status, deliveryTime) {
      const shipment = info && info.shipmentInfo ? info.shipmentInfo : {};
      const product = info && info.products ? info.products : {};
      const cargo = info && info.cargoes && info.cargoes[0] ? info.cargoes[0] : {};
      return { waybillCode: info && info.waybillCode, orderCode: (info && info.baseInfo && info.baseInfo.orderCode) || (info && info.orderId), route: `${shipment.pickupSiteName || '-'} → ${shipment.deliverySiteName || '-'}`, weight: `${cargo.weight || '-'} / ${cargo.volume || '-'}m³`, productName: product.productName || shipment.aging || '-', statusDesc: (status && (status.statusDesc || status.status)) || '', createTime: this.formatDateTime(info && info.createTime), pickupSiteName: shipment.pickupSiteName, deliverySiteName: shipment.deliverySiteName, deliveryTime: this.formatDateTime(deliveryTime), receiverAddress: info && info.extendOrderInfo && info.extendOrderInfo.receiverAddress, raw: info };
    },
    async quickQuery() {
      if (!this.quickForm.value) return this.$message.warning('请输入运单号或商家订单号');
      this.loading.quick = true;
      try {
        if (this.quickForm.type === 'waybillCode') {
          const result = await this.fetchWaybill(this.quickForm.value);
          this.addHistory(this.quickForm.value, 'waybillCode', result.statusDesc, true);
          this.openDrawerWithData(result, '运单详情');
        } else {
          const status = await jdlLogisticsApi.orderStatus({ customerOrderCode: this.quickForm.value });
          this.addHistory(this.quickForm.value, 'customerOrderCode', status && (status.statusDesc || status.status), true);
          this.$message.success('订单状态查询成功');
        }
      } catch (e) { this.addHistory(this.quickForm.value, this.quickForm.type, '查询失败', false); } finally { this.loading.quick = false; }
    },
    async fetchWaybill(code) {
      const result = await Promise.all([jdlLogisticsApi.waybillInfo(code), jdlLogisticsApi.orderStatus({ waybillCode: code }).catch(() => null), jdlLogisticsApi.deliveryTime(code).catch(() => null)]);
      return this.normalizeWaybillInfo(result[0], result[1], result[2]);
    },
    async queryWaybill() { if (!this.waybillCode) return this.$message.warning('请输入京东运单号'); this.loading.waybill = true; try { this.waybillRows = [await this.fetchWaybill(this.waybillCode)]; this.addHistory(this.waybillCode, 'waybillCode', this.waybillRows[0].statusDesc, true); } finally { this.loading.waybill = false; } },
    async openDetail(code) { if (!code) return; this.drawerVisible = true; this.drawerTitle = '运单详情'; this.drawerDetail = null; this.loading.detail = true; try { this.openDrawerWithData(await this.fetchWaybill(code), '运单详情'); } finally { this.loading.detail = false; } },
    openDrawerWithData(data, title) { this.drawerDetail = data; this.drawerTitle = title || '运单详情'; this.drawerVisible = true; },
    async queryAttachment(code) { if (!code) return; this.attachmentVisible = true; this.attachmentUrl = ''; try { this.attachmentUrl = await jdlLogisticsApi.waybillAttachment(code); } catch (e) { this.attachmentUrl = ''; } },
    exportWaybill() { const blob = new Blob([JSON.stringify(this.waybillRows, null, 2)], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `jdl-waybill-${Date.now()}.json`; link.click(); URL.revokeObjectURL(url); },
    async queryTrace() { if (!this.trackCode) return this.$message.warning('请输入京东运单号'); this.loading.track = true; try { const result = await jdlLogisticsApi.trace(this.trackCode); this.traceDetails = (result && result.traceDetails) || []; this.addHistory(this.trackCode, 'waybillCode', this.traceDetails[0] && (this.traceDetails[0].operationTitle || this.traceDetails[0].categoryName), true); } finally { this.loading.track = false; } },
    async queryLocation() { if (!this.locationCode) return this.$message.warning('请输入京东运单号'); this.loading.location = true; try { const result = await jdlLogisticsApi.location(this.locationCode); this.locationData = result && result.data ? result.data : result; this.locationPoints = (this.locationData && this.locationData.waybillGisDtoList) || []; } finally { this.loading.location = false; } },
    openMap() { if (!this.latestPoint) return; window.open(`https://uri.amap.com/marker?position=${this.latestPoint.lng},${this.latestPoint.lat}`, '_blank', 'noopener'); },
    parseCodes(value) { return String(value || '').split(/[\s,，;；]+/).map((item) => item.trim()).filter(Boolean); },
    async queryEta() { const codes = this.parseCodes(this.etaCodes); if (!codes.length) return this.$message.warning('请输入至少一个运单号'); this.loading.eta = true; try { this.etaRows = await Promise.all(codes.map((code) => jdlLogisticsApi.deliveryTime(code).then((value) => ({ waybillCode: code, deliveryTime: this.formatDateTime(value), error: '' })).catch((error) => ({ waybillCode: code, deliveryTime: '-', error: (error && error.message) || '接口未返回结果' })))); } finally { this.loading.eta = false; } },
    async verifyReceiver() { const form = this.receiverForm; if (!form.waybillCode || !form.mobileLast4 || !form.fullAddress) return this.$message.warning('请完整填写运单号、手机号后四位和地址'); this.loading.receiver = true; try { this.receiverResult = await jdlLogisticsApi.verifyReceiver(form); } finally { this.loading.receiver = false; } },
    async querySites() { const form = this.siteForm; if (!form.province || !form.city || !form.county) return this.$message.warning('请填写省、市、区县'); this.loading.sites = true; try { const result = await jdlLogisticsApi.nearbySites(form); this.siteRows = (result && result.sites) || []; } finally { this.loading.sites = false; } },
    async queryFreight() { const form = this.freightForm; if (!form.receiveProvince || !form.receiveCity || !form.receiveCounty) return this.$message.warning('请填写目的地省、市、区县'); this.loading.freight = true; try { const payload = { ...form }; if (!payload.merId) delete payload.merId; this.freightResult = await jdlLogisticsApi.freight(payload); } finally { this.loading.freight = false; } },
    async queryException() { const form = this.exceptionForm; if (!form.waybillCode && !form.customerOrderCode) return this.$message.warning('请输入运单号或商家订单号'); this.loading.exception = true; try { const status = await jdlLogisticsApi.orderStatus({ waybillCode: form.waybillCode || undefined, customerOrderCode: form.customerOrderCode || undefined }); let info = null; if (form.waybillCode) info = await jdlLogisticsApi.waybillInfo(form.waybillCode).catch(() => null); const row = { waybillCode: form.waybillCode || '-', customerOrderCode: form.customerOrderCode || '', orderId: info && info.orderId, statusDesc: (status && (status.statusDesc || status.status)) || '已返回', queryTime: this.formatDateTime(new Date()) }; this.exceptionRows = [row, ...this.exceptionRows.filter((item) => item.waybillCode !== row.waybillCode)]; } finally { this.loading.exception = false; } },
    async removeSelectedIntercept() { const codes = this.selectedExceptions.map((item) => item.waybillCode).filter((code) => code && code !== '-'); if (!codes.length) return; try { await this.$confirm(`确定解除 ${codes.length} 个运单的拦截吗？`, '操作确认', { type: 'warning' }); await jdlLogisticsApi.removeIntercept({ waybillCodes: codes, reason: '后台工作台批量解除拦截' }); this.$message.success('解除拦截请求已提交'); this.selectedExceptions = []; } catch (e) {} },
    async cancelException(row) { if (!row.orderId || !row.customerOrderCode) return this.$message.warning('取消订单需要同时提供商家订单号和京东订单 ID'); try { const result = await this.$prompt('请输入取消原因', '取消订单', { inputValue: '客户申请取消', inputValidator: (value) => !!value || '请输入取消原因' }); await jdlLogisticsApi.cancelOrder({ orderId: row.orderId, customerOrderCode: row.customerOrderCode, cancelReason: result.value }); this.$message.success('取消请求已提交'); } catch (e) {} },
    copyCallback(url) { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(() => this.$message.success('回调地址已复制')); return; } const input = document.createElement('textarea'); input.value = url; document.body.appendChild(input); input.select(); document.execCommand('copy'); document.body.removeChild(input); this.$message.success('回调地址已复制'); },
  },
};
</script>

<style scoped>
.jdl-page { background: #f5f7fa; min-height: calc(100vh - 84px); }
.jdl-hero { display: flex; align-items: center; margin-bottom: 12px; border: 0; }
.hero-mark { width: 44px; height: 44px; margin-right: 12px; border-radius: 8px; background: #e1251b; color: #fff; font-size: 18px; font-weight: 700; line-height: 44px; text-align: center; }
.hero-copy { flex: 1; }.hero-copy h2 { margin: 0 0 5px; font-size: 20px; color: #303133; }.hero-copy p { margin: 0; color: #909399; font-size: 13px; }
.hero-context { display: flex; align-items: center; gap: 12px; }.merchant-name { color: #606266; font-size: 13px; }
.jdl-workspace { min-height: 650px; background: #fff; border: 1px solid #ebeef5; }.jdl-aside { border-right: 1px solid #ebeef5; background: #fff; }.jdl-menu { border-right: 0; }.menu-title { padding: 15px 20px 7px; color: #909399; font-size: 12px; }.jdl-menu .el-menu-item { height: 42px; line-height: 42px; font-size: 13px; }.jdl-menu .el-menu-item i { margin-right: 5px; }
.jdl-main { padding: 16px; background: #f5f7fa; overflow-x: hidden; }.notice { margin-bottom: 12px; padding: 10px 12px; color: #606266; background: #ecf5ff; border: 1px solid #d9ecff; border-radius: 4px; font-size: 13px; }.notice i { color: #409eff; margin-right: 5px; }
.stats-row { margin-bottom: 12px; }.stat-card { min-height: 102px; }.stat-card span,.stat-card small { display: block; color: #909399; font-size: 12px; }.stat-card strong { display: block; margin: 7px 0 4px; color: #303133; font-size: 26px; line-height: 1; }.stat-card strong.blue { color: #409eff; }.stat-card strong.green { color: #67c23a; }.stat-card strong.orange { color: #e6a23c; }.stat-card strong.red { color: #f56c6c; }
.overview-row { margin-top: 12px; }.card-title { margin-bottom: 14px; color: #303133; font-size: 15px; font-weight: 600; }.card-title span { margin-left: 8px; color: #a0a6ad; font-size: 12px; font-weight: 400; }.toolbar { margin-bottom: 14px; }.toolbar .el-button { margin-left: 8px; }.health-row,.info-row { display: flex; justify-content: space-between; align-items: center; min-height: 38px; border-bottom: 1px solid #f0f2f5; color: #606266; font-size: 13px; }.health-row:last-child,.info-row:last-child { border-bottom: 0; }.info-row { align-items: flex-start; padding: 8px 0; }.info-row b { flex: 0 0 90px; color: #909399; font-weight: 400; }.info-row span { text-align: right; word-break: break-all; }
.field-model,.push-doc { margin-top: 12px; }.field-model code { display: block; padding: 12px; color: #606266; background: #f5f7fa; border-radius: 4px; font-size: 12px; word-break: break-all; }.form-panel { max-width: 680px; }.form-panel .el-input,.form-panel .el-textarea,.form-panel .el-select,.form-panel .el-input-number { width: 100%; }.trace-list { margin-top: 22px; }.trace-list p { margin: 5px 0; color: #606266; }.trace-list small { color: #909399; }.mapbox { position: relative; height: 370px; overflow: hidden; border: 1px solid #dcdfe6; border-radius: 4px; background: #edf4f8; }.map-grid { position: absolute; inset: 0; opacity: .75; background-image: linear-gradient(30deg, transparent 47%, #d5e4ea 48%, #d5e4ea 50%, transparent 51%), linear-gradient(150deg, transparent 47%, #d5e4ea 48%, #d5e4ea 50%, transparent 51%), linear-gradient(90deg, transparent 49%, #dbe8ed 50%, transparent 51%); background-size: 80px 80px; }.map-pin { position: absolute; z-index: 2; color: #e1251b; font-size: 30px; transform: translate(-50%, -100%); }.map-tip { position: absolute; z-index: 3; top: 18px; left: 18px; padding: 9px 12px; color: #606266; background: rgba(255,255,255,.95); border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,.1); font-size: 12px; }.eta-codes { min-height: 56px; }.fee-total { margin: 10px 0 18px; color: #e1251b; font-size: 28px; font-weight: 700; }.push-tip { margin-bottom: 15px; }.push-doc p,.muted { color: #909399; font-size: 13px; line-height: 1.7; }.exception-card { margin-top: 12px; }.drawer-content { min-height: 320px; }.drawer-status { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; color: #303133; font-size: 14px; }.drawer-actions { margin-top: 18px; }.jdl-page .el-card { border-color: #ebeef5; }.jdl-page .el-table { width: 100%; }
@media (max-width: 1200px) { .jdl-aside { width: 165px !important; }.jdl-main { padding: 12px; }.hero-context { display: block; }.hero-context .el-tag { margin-left: 8px; } }
</style>
