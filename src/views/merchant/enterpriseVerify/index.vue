<template>
  <div class="app-container enterprise-verify-page" v-loading="loading">
    <div class="page-header">
      <div class="page-title">企业四要素核验</div>
      <div class="page-sub">对接阿里云号码百科,核验商户入驻提交的企业名称、企业证件号、法人姓名、法人身份证号</div>
    </div>

    <el-alert type="warning" :closable="false" style="margin-bottom: 16px;">
      <template slot="title">
        <b>下面三个必填项去哪拿</b>:<br />
        ① <b>AccessKey ID / Secret</b> — 阿里云账号级凭据,与短信服务共用同一套,在
        <a href="https://ram.console.aliyun.com/manage/ak" target="_blank" rel="noopener">RAM 控制台 → AccessKey 管理</a>
        获取。若用子账号,需额外授予 <code>AliyunDytnsFullAccess</code>,否则调用报 NoPermission<br />
        ② <b>授权码 AuthCode</b> — 号码百科产品专属,跟「标签」走而不是跟套餐包走。在
        <a href="https://dytns.console.aliyun.com/" target="_blank" rel="noopener">号码百科控制台</a>
        的「标签广场」找到<b>企业四要素核验</b>标签 → 申请使用 → 提交资质等审核通过 →
        回「我的申请」里复制 AuthCode。<b>注意</b>:买套餐包只是充额度,不等于拿到授权码,两步是分开的<br />
        ③ <b>该接口按次计费</b>,相同企业在缓存有效期内复用上次结果,不重复扣费
      </template>
    </el-alert>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="核验配置" name="config">
        <el-card shadow="never">
          <el-form :model="form" label-width="150px" size="small">
            <el-form-item label="启用">
              <el-switch v-model="form.enabled" />
              <span class="tip">关闭后,入驻申请不做自动核验,全部走人工审核</span>
            </el-form-item>
            <el-form-item label="服务商">
              <el-select v-model="form.provider" disabled style="width: 200px;">
                <el-option label="阿里云号码百科" value="ALIYUN" />
              </el-select>
            </el-form-item>
            <el-form-item label="核验模式">
              <el-tag type="primary" size="small">四要素</el-tag>
              <div class="tip">
                企业名称 + 统一社会信用代码 + 法人姓名 + 法人身份证号，入驻表单已采集这四项。<br />
                当前阿里云账号仅开通了四要素套餐，故此项固定不可改。
              </div>
            </el-form-item>
            <el-form-item label="不通过时驳回">
              <el-switch v-model="form.rejectOnFail" />
              <span class="tip">开启后，要素不一致或企业已注销/吊销时直接驳回入驻提交；关闭则仅记录，放行进人工审核</span>
            </el-form-item>
            <el-form-item label="AccessKey ID">
              <el-input v-model="form.accessKeyId" placeholder="LTAI5t..." style="max-width: 400px;" />
            </el-form-item>
            <el-form-item label="AccessKey Secret">
              <el-input v-model="form.accessKeySecret" type="password" show-password
                        placeholder="留空则保留原值" style="max-width: 400px;" />
              <div class="tip">安全考虑,显示时以 **** 开头。留空不修改;若要更新请重新完整粘贴</div>
            </el-form-item>
            <el-form-item label="授权码 AuthCode">
              <el-input v-model="form.authCode" placeholder="号码百科控制台申请获得" style="max-width: 400px;" />
            </el-form-item>
            <el-form-item label="结果缓存(小时)">
              <el-input-number v-model="form.cacheHours" :min="0" :max="8760" style="width: 160px;" />
              <span class="tip">同一企业在此时长内复用上次核验结果,不重复计费。0 = 每次都调用</span>
            </el-form-item>
            <el-form-item label="服务端点">
              <el-input v-model="form.endpoint" style="max-width: 400px;" />
              <div class="tip">默认: dytnsapi.aliyuncs.com</div>
            </el-form-item>
            <el-form-item label="更新时间">
              <span class="tip">{{ form.updateTime || '—' }}</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-check" @click="save">保存</el-button>
              <el-button icon="el-icon-refresh-left" @click="loadConfig">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" style="margin-top: 16px;">
          <div slot="header">
            <span>联调测试</span>
            <span class="tip">填入一组真实企业信息验证配置是否正确,会产生一次计费调用(命中缓存则不计费)</span>
          </div>
          <el-form :model="testForm" label-width="150px" size="small" inline>
            <el-form-item label="企业名称">
              <el-input v-model="testForm.epCertName" placeholder="营业执照上的全称" style="width: 260px;" />
            </el-form-item>
            <el-form-item label="统一社会信用代码">
              <el-input v-model="testForm.epCertNo" placeholder="91110108..." style="width: 240px;" />
            </el-form-item>
            <el-form-item label="法人姓名">
              <el-input v-model="testForm.legalPersonName" style="width: 160px;" />
            </el-form-item>
            <el-form-item label="法人身份证号">
              <el-input v-model="testForm.legalPersonCertNo" style="width: 220px;" />
            </el-form-item>
            <el-form-item>
              <el-button type="success" icon="el-icon-search" :loading="testing"
                         :disabled="!testReady" @click="runTest">发起核验</el-button>
            </el-form-item>
          </el-form>

          <el-alert v-if="testResult" :type="alertType(testResult.status)" :closable="false" style="margin-top: 8px;">
            <template slot="title">
              <b>{{ statusText(testResult.status) }}</b>
              <span v-if="testResult.cached" class="tip">（命中本地缓存,未计费）</span>
            </template>
            <div class="result-detail">
              <div v-if="testResult.reasonCode !== null && testResult.reasonCode !== undefined">
                ReasonCode: {{ testResult.reasonCode }} — {{ reasonText(testResult.reasonCode) }}
              </div>
              <div v-if="testResult.enterpriseStatus">企业经营状态: {{ testResult.enterpriseStatus }}</div>
              <div v-if="testResult.inconsistentFields">不一致字段: {{ testResult.inconsistentFields }}</div>
              <div v-if="testResult.message">返回信息: {{ testResult.message }}</div>
              <div v-if="testResult.requestId">RequestId: {{ testResult.requestId }}<span class="tip">（对账用）</span></div>
            </div>
          </el-alert>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="核验记录" name="records">
        <el-card shadow="never">
          <div class="filter-bar">
            <el-input v-model="query.keyword" placeholder="企业名称 / 信用代码 / 法人姓名" size="small"
                      clearable style="width: 260px;" @keyup.enter.native="searchRecords" />
            <el-select v-model="query.result" placeholder="核验结果" size="small" clearable style="width: 200px;">
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
            <el-button type="primary" icon="el-icon-search" size="small" @click="searchRecords">查询</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </div>

          <el-table :data="records" size="small" style="margin-top: 12px;" v-loading="recordLoading">
            <el-table-column prop="epCertName" label="企业名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="epCertNo" label="统一社会信用代码" width="190" />
            <el-table-column prop="legalPersonName" label="法人" width="90" />
            <el-table-column prop="legalPersonCertNo" label="法人身份证" width="180" />
            <el-table-column label="模式" width="80">
              <template slot-scope="{ row }">{{ row.verifyMode === 'FOUR' ? '四要素' : '三要素' }}</template>
            </el-table-column>
            <el-table-column label="核验结果" width="150">
              <template slot-scope="{ row }">
                <el-tag :type="tagType(row.result)" size="mini">{{ statusText(row.result) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="原因" min-width="180" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span v-if="row.reasonCode !== null && row.reasonCode !== undefined">
                  {{ row.reasonCode }} — {{ reasonText(row.reasonCode) }}
                </span>
                <span v-else>{{ row.message || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enterpriseStatus" label="经营状态" width="100" />
            <el-table-column prop="bizType" label="场景" width="110" />
            <el-table-column prop="requestId" label="RequestId" width="200" show-overflow-tooltip />
            <el-table-column prop="createTime" label="核验时间" width="160" />
          </el-table>

          <el-pagination
            style="margin-top: 12px; text-align: right;"
            background
            layout="total, sizes, prev, pager, next"
            :current-page="query.page"
            :page-sizes="[10, 20, 50]"
            :page-size="query.limit"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import {
  getEnterpriseVerifyConfig,
  saveEnterpriseVerifyConfig,
  getEnterpriseVerifyRecords,
  testEnterpriseVerify,
} from '@/api/enterpriseVerify';

const STATUS_MAP = {
  CONSISTENT: { label: '一致且在营', tag: 'success', alert: 'success' },
  CONSISTENT_BUT_ABNORMAL: { label: '一致但经营异常', tag: 'warning', alert: 'warning' },
  INCONSISTENT: { label: '不一致', tag: 'danger', alert: 'error' },
  UNVERIFIABLE: { label: '无法核验', tag: 'warning', alert: 'warning' },
  ERROR: { label: '调用异常', tag: 'info', alert: 'error' },
};

const REASON_MAP = {
  0: '四要素属于同一企业,且企业在营',
  1: '四要素属于同一企业,但经营状态异常',
  2: '法人信息与企业信息不匹配',
  3: '四要素不属于同一企业',
  4: '未查询到该企业信息',
  5: '未查询到该法人信息',
};

export default {
  name: 'MerchantEnterpriseVerify',
  data() {
    return {
      loading: false,
      activeTab: 'config',
      form: {
        enabled: false,
        provider: 'ALIYUN',
        verifyMode: 'THREE',
        accessKeyId: '',
        accessKeySecret: '',
        authCode: '',
        cacheHours: 720,
        rejectOnFail: true,
        endpoint: 'dytnsapi.aliyuncs.com',
        updateTime: '',
      },
      testForm: { epCertName: '', epCertNo: '', legalPersonName: '', legalPersonCertNo: '' },
      testing: false,
      testResult: null,
      recordLoading: false,
      records: [],
      total: 0,
      query: { page: 1, limit: 10, keyword: '', result: '' },
      statusOptions: Object.keys(STATUS_MAP).map((k) => ({ value: k, label: STATUS_MAP[k].label })),
    };
  },
  computed: {
    testReady() {
      const f = this.testForm;
      return !!(f.epCertName && f.epCertNo && f.legalPersonName && f.legalPersonCertNo);
    },
  },
  created() {
    this.loadConfig();
    this.loadRecords();
  },
  methods: {
    unwrap(res) {
      return res && (res.data !== undefined ? res.data : res);
    },
    statusText(s) {
      return (STATUS_MAP[s] && STATUS_MAP[s].label) || s || '—';
    },
    tagType(s) {
      return (STATUS_MAP[s] && STATUS_MAP[s].tag) || 'info';
    },
    alertType(s) {
      return (STATUS_MAP[s] && STATUS_MAP[s].alert) || 'info';
    },
    reasonText(code) {
      return REASON_MAP[code] || '未知';
    },
    async loadConfig() {
      this.loading = true;
      try {
        const data = this.unwrap(await getEnterpriseVerifyConfig());
        if (data) this.form = Object.assign({}, this.form, data);
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    async save() {
      if (this.form.enabled && !this.form.authCode) {
        return this.$message.warning('启用状态下,授权码 AuthCode 必填');
      }
      try {
        await saveEnterpriseVerifyConfig(this.form);
        this.$message.success('已保存');
        this.loadConfig();
      } catch (e) {
        this.$message.error('保存失败: ' + (e.message || e));
      }
    },
    async runTest() {
      this.testing = true;
      this.testResult = null;
      try {
        this.testResult = this.unwrap(await testEnterpriseVerify(this.testForm));
        this.loadRecords();
      } catch (e) {
        this.$message.error('核验失败: ' + (e.message || e));
      } finally {
        this.testing = false;
      }
    },
    async loadRecords() {
      this.recordLoading = true;
      try {
        const data = this.unwrap(await getEnterpriseVerifyRecords(this.query));
        this.records = (data && data.records) || [];
        this.total = (data && data.total) || 0;
      } catch (e) {
        this.$message.error('加载记录失败: ' + (e.message || e));
      } finally {
        this.recordLoading = false;
      }
    },
    searchRecords() {
      this.query.page = 1;
      this.loadRecords();
    },
    resetQuery() {
      this.query = { page: 1, limit: 10, keyword: '', result: '' };
      this.loadRecords();
    },
    handleSizeChange(size) {
      this.query.limit = size;
      this.query.page = 1;
      this.loadRecords();
    },
    handlePageChange(page) {
      this.query.page = page;
      this.loadRecords();
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 12px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.tip { color: #909399; font-size: 12px; margin-left: 8px; }
.filter-bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.result-detail { font-size: 12px; line-height: 20px; color: #606266; margin-top: 4px; }
code { background: #f2f3f5; color: #606266; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
</style>
