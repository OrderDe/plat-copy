<template>
  <div class="app-container" v-loading="loading">
    <div class="page-header">
      <div class="page-title">催办短信配置</div>
      <div class="page-sub">配置阿里云短信参数,超时催办时自动发送给审批人</div>
    </div>

    <el-alert type="warning" :closable="false" style="margin-bottom: 16px;">
      <template slot="title">
        <b>使用前提</b>:
        ① 阿里云控制台 → 短信服务 → 申请签名 (如"淘街优品")
        ② 申请催办模板并等审核通过, 拿到模板 CODE (如 <code>SMS_123456789</code>)
        ③ 模板内容示例: <code>您有一条待办审批【${title}】已停留${hours}小时, 请及时处理</code>
        ④ 将模板 CODE 填入下方"催办模板 CODE"字段
      </template>
    </el-alert>

    <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
      <template slot="title">
        💡 <b>配置读取优先级</b>: 页面配置 → yml 配置 (aliyun.sms.*)。
        项目已在 <code>tjMall-flowable/application.yml</code> 复用了 <code>tjMall-app</code> 的 AccessKey / 签名。
        如果你**只需要临时启用催办**, 只需在下面填 <b>启用 + 催办模板 CODE</b>, 其他字段留空即可(会从 yml 兜底)。
      </template>
    </el-alert>

    <el-card shadow="never">
      <el-form :model="form" label-width="140px" size="small">
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
          <span class="tip">开启后,超时催办会自动发送短信</span>
        </el-form-item>
        <el-form-item label="服务商">
          <el-select v-model="form.provider" disabled style="width: 200px;">
            <el-option label="阿里云短信" value="ALIYUN" />
          </el-select>
        </el-form-item>
        <el-form-item label="AccessKey ID" >
          <el-input v-model="form.accessKeyId" placeholder="LTAI5t..." style="max-width: 400px;" />
        </el-form-item>
        <el-form-item label="AccessKey Secret" >
          <el-input v-model="form.accessKeySecret" type="password" show-password
                    placeholder="留空则保留原值" style="max-width: 400px;" />
          <div class="tip">安全考虑, 显示时以 **** 开头。留空不修改;若要更新请重新完整粘贴</div>
        </el-form-item>
        <el-form-item label="短信签名" >
          <el-input v-model="form.signName" placeholder="如: 淘街优品" style="max-width: 300px;" />
        </el-form-item>
        <el-form-item label="催办模板 CODE" >
          <el-input v-model="form.urgeTemplateCode" placeholder="SMS_XXXXXXX" style="max-width: 300px;" />
        </el-form-item>
        <el-form-item label="通用模板 CODE">
          <el-input v-model="form.defaultTemplateCode" placeholder="可选,通用兜底模板" style="max-width: 300px;" />
        </el-form-item>
        <el-form-item label="服务端点">
          <el-input v-model="form.endpoint" style="max-width: 400px;" />
          <div class="tip">默认: dysmsapi.aliyuncs.com (国际站用 dysmsapi.ap-southeast-1.aliyuncs.com)</div>
        </el-form-item>

        <el-form-item label="更新时间">
          <span class="tip">{{ form.updateTime || '—' }}</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="save">保存</el-button>
          <el-button @click="load">重置</el-button>
          <el-divider direction="vertical" />
          <el-input v-model="testPhone" placeholder="测试手机号" size="small" style="width: 180px; margin-right: 8px;" />
          <el-button type="success" @click="sendTest" :disabled="!testPhone">发送测试短信</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getSmsConfig, saveSmsConfig, testSms } from '@/api/smsNotify';

export default {
  name: 'ApprovalSmsConfig',
  data() {
    return {
      loading: false,
      form: {
        enabled: false, provider: 'ALIYUN', accessKeyId: '', accessKeySecret: '',
        signName: '', urgeTemplateCode: '', defaultTemplateCode: '', endpoint: 'dysmsapi.aliyuncs.com',
        updateTime: '',
      },
      testPhone: '',
    };
  },
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await getSmsConfig();
        const data = res && (res.data !== undefined ? res.data : res);
        if (data) this.form = Object.assign({}, this.form, data);
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally { this.loading = false; }
    },
    async save() {
      if (this.form.enabled && !this.form.urgeTemplateCode) {
        return this.$message.warning('启用状态下, 催办模板 CODE 必填');
      }
      try {
        await saveSmsConfig(this.form);
        this.$message.success('已保存');
        this.load();
      } catch (e) {
        this.$message.error('保存失败: ' + (e.message || e));
      }
    },
    async sendTest() {
      try {
        const res = await testSms(this.testPhone);
        const msg = res && (res.data !== undefined ? res.data : res);
        this.$message.success(msg || '已请求, 请查看后端日志');
      } catch (e) {
        this.$message.error('发送失败: ' + (e.message || e));
      }
    },
  },
};
</script>

<style scoped>
.page-header { margin-bottom: 12px; }
.page-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #86909c; }
.tip { color: #909399; font-size: 12px; margin-left: 8px; }
code { background: #f2f3f5; color: #606266; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
</style>
