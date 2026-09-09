<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false" v-loading="loading">
      <div class="tips">
        改动即时生效（后端写库并刷新进程内缓存），不需要重启联盟服务。
        红线项（自购返佣、等级差返佣）在页面上只读，不提供修改入口。
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadConfig">刷新</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" size="small" border>
        <el-table-column prop="key" label="配置项" min-width="240">
          <template slot-scope="{ row }">
            <div>{{ row.name }}</div>
            <div class="key">{{ row.key }}</div>
          </template>
        </el-table-column>
        <el-table-column label="当前值" min-width="180">
          <template slot-scope="{ row }">
            <span>{{ row.value }}</span>
            <span v-if="row.unit" class="unit">{{ row.unit }}</span>
            <span v-if="row.type === 'RATIO'" class="unit">（{{ (row.value / 100).toFixed(2) }}%）</span>
            <!-- 库里存的是分，运营看的是元；不换算的话 100000 会被当成十万元 -->
            <span v-if="row.type === 'DECIMAL_FEN'" class="unit">（{{ (row.value / 100).toFixed(2) }} 元）</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" min-width="320" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="{ row }">
            <el-button v-if="!row.locked" type="text" size="small" @click="openDialog(row)">修改</el-button>
            <el-tag v-else size="mini" type="danger">红线锁定</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="修改配置" :visible.sync="dialogVisible" width="560px">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px" size="small">
        <el-form-item label="配置项">
          <div>{{ current.name }}</div>
          <div class="key">{{ current.key }}</div>
        </el-form-item>
        <el-form-item label="说明">
          <div class="remark">{{ current.remark }}</div>
        </el-form-item>
        <el-form-item label="新值" prop="value">
          <el-input v-model.trim="form.value" class="selWidth" />
          <div v-if="current.type === 'RATIO'" class="hint">
            万分比整数，例如 1500 表示 15%
            <span v-if="/^\d+$/.test(form.value)" class="ratio-preview">
              当前填的是 {{ (form.value / 100).toFixed(2) }}%
            </span>
          </div>
          <div v-else-if="current.type === 'INT'" class="hint">整数</div>
          <div v-else-if="current.type === 'DECIMAL'" class="hint">金额，单位为元，最多两位小数</div>
          <div v-else-if="current.type === 'DECIMAL_FEN'" class="hint">
            以<b>分</b>为单位的整数，例如 100000 表示 1000 元；0 表示不限
            <span v-if="/^\d+$/.test(form.value)" class="ratio-preview">
              当前填的是 {{ (form.value / 100).toFixed(2) }} 元
            </span>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getAllianceConfig, updateAllianceConfig } from '@/api/alliance';

/**
 * 配置项元信息。后端 /config 只返回 key -> value 的字符串字典，
 * 中文名、单位、类型跟着 DDL 的种子数据在这里维护；
 * 出现表里没有的 key 也会照常展示，只是没有中文名。
 */
const META = {
  'points.exchange.rate': { name: '积分记账汇率', type: 'INT', unit: '积分 = 1 元', remark: 'PRD 17.1 固定 100，商户不得改' },
  'points.withdraw.min.points': { name: '积分提现最低积分', type: 'INT', unit: '积分', remark: '低于该积分数不允许提交提现申请，默认 1000 积分' },
  'leader.withdraw.min.amount': { name: '团长最低提现金额', type: 'DECIMAL', unit: '元', remark: '低于该金额不允许提交团长佣金提现申请，默认 50 元；平台人工审核打款' },
  'leader.withdraw.fee.fixed': { name: '提现固定手续费', type: 'DECIMAL', unit: '元', remark: '每笔提现固定收取，从提现金额里扣；0 表示不收' },
  'leader.withdraw.fee.rate': { name: '提现手续费费率', type: 'RATIO', remark: '万分比，按提现金额收取，与固定手续费叠加' },
  'leader.withdraw.time.begin': { name: '可提现时段起', type: 'STRING', unit: 'HH:mm', remark: '与结束时间相同表示不限时段，如 07:00' },
  'leader.withdraw.time.end': { name: '可提现时段止', type: 'STRING', unit: 'HH:mm', remark: '如 20:00；时段外提交会被拒绝' },
  'leader.withdraw.workday.only': { name: '仅工作日可提现', type: 'INT', remark: '1 是 0 否。银行周末不到账，建议开启' },
  'leader.withdraw.card.secret': { name: '收款信息加密密钥', type: 'STRING', remark: '证件号与卡号的 AES 密钥，须为 16/24/32 位。留空则无法绑卡；已绑卡后更换会导致旧卡号无法解密' },
  'leader.withdraw.payout.mode': { name: '打款方式', type: 'STRING', remark: 'MANUAL 平台人工打款 / WECHAT_AUTO 审核通过后自动发起微信转账' },
  'leader.withdraw.wechat.change.api': { name: '微信零钱转账接口', type: 'STRING', remark: 'TRANSFER_BILLS 商家转账（团长需在小程序确认收款）/ TRANSFER_BATCHES 批量转账（免确认，微信正在下线）' },
  'leader.withdraw.wechat.scene.id': { name: '商家转账场景ID', type: 'STRING', remark: '在微信商户平台申请转账场景后获得，TRANSFER_BILLS 必填' },
  'leader.withdraw.wechat.scene.report': { name: '转账场景报备信息', type: 'STRING', remark: 'JSON 数组；字段名与内容须与申请场景时完全一致，否则微信拒绝受理' },
  'leader.withdraw.wechat.bank.enabled': { name: '银行卡自动打款', type: 'INT', remark: '1 是 0 否。开启后走微信「企业付款到银行卡」；需商户号已开通该产品，且收款卡填了银行编号' },
  'leader.withdraw.wechat.notify.url': { name: '转账结果回调地址', type: 'STRING', remark: '选填。留空则只能靠「刷新状态」主动查询微信' },
  'leader.apply.require.member': { name: '仅代理下线可申请团长', type: 'INT', remark: '1 是 0 否。开启后必须先扫代理邀请码成为其下线，才能提交团长申请' },
  'leader.apply.min.consume': { name: '申请团长的消费门槛', type: 'DECIMAL_FEN', unit: '元', remark: '在商城的累计实付金额，0 表示不限。校验在申请入口，不达标当场提示还差多少' },
  'leader.apply.min.orders': { name: '申请团长的订单数门槛', type: 'INT', unit: '单', remark: '累计已支付订单数，0 表示不限' },
  'leader.apply.auto.approve': { name: '团长申请自动通过', type: 'INT', remark: '1-提交即通过，不进代理待审列表 0-需代理审批。代理端另有「一键同意」可批量通过' },
  'share.relation.mode': { name: '分享关系口径', type: 'STRING', remark: 'LIFELONG-终身分享·新用户邀请即绑定（首次点开链接即定终身）/ FIRST_ORDER-终身分享·首单邀请即绑定（首单那一刻才定）/ INSTANT-即时分享（归最近一次点开链接的人，没人点过就不分润）/ INSTANT_LIFELONG-即时+终身（先看最近点击，没有再看终身绑定人）/ PROTECT-保护期内绑定（旧口径）。商户端「分销设置 → 全局设置」里也能改，是同一个值' },
  'share.leader.open.mode': { name: '团长开通方式', type: 'STRING', remark: 'FREE-免费开通 / PAID-付费开通。平台端「分销设置」页已下线，此项当前不生效，保留供恢复' },
  'share.leader.open.coupon': { name: '团长开通卡券', type: 'STRING', remark: '多个卡券 ID 用英文逗号分隔。随「分销设置」页一同下线，当前不生效' },
  'share.leader.share.coupon': { name: '团长分享卡券', type: 'STRING', remark: '多个卡券 ID 用英文逗号分隔。随「分销设置」页一同下线，当前不生效' },
  'share.agent.open.mode': { name: '区域代理开通方式', type: 'STRING', remark: 'FREE-免费开通 / PAID-付费开通。代理由平台在「区域与代理」里开通，此项当前不生效' },
  'share.agent.open.coupon': { name: '区域代理开通卡券', type: 'STRING', remark: '多个卡券 ID 用英文逗号分隔。当前不生效' },
  'share.agent.share.coupon': { name: '区域代理分享卡券', type: 'STRING', remark: '多个卡券 ID 用英文逗号分隔。当前不生效' },
  'invite.protect.days': { name: '积分邀请关系保护期', type: 'INT', unit: '天', remark: 'PRD 5.2' },
  'leader.bind.protect.days': { name: '团长绑定保护期', type: 'INT', unit: '天', remark: 'PRD 10.4，保护期内不改绑' },
  'commission.base.mode': { name: '佣金基数口径', type: 'STRING', remark: 'PROFIT-按毛利（售价-成本），成本 20 售价 30 时比例作用在多出来的 10 元上 / PAY-按实付减运费。商户没填成本价时两者结果相同；只影响之后的新订单，历史订单基数已固化不回溯' },
  'commission.max.payout.ratio': { name: '单笔佣金总上限', type: 'RATIO', remark: 'PRD 10.7.5，团长+代理合计占实付的上限，超出按比例削减' },
  'commission.settlement.days': { name: '确认收货后入账天数', type: 'INT', unit: '天', remark: 'PRD 10.6 的 T+N，全局配置优先于此兜底值' },
  'commission.leader.ratio': { name: '团长默认分成比例', type: 'RATIO', remark: '兜底值，优先读 eb_distribution_config.leader_ratio' },
  'commission.agent.ratio': { name: '区域代理默认分成比例', type: 'RATIO', remark: '兜底值' },
  'commission.agent.attribution.mode': { name: '代理分成归因口径', type: 'STRING', remark: 'CHAIN-全额给团长的所属代理 / REGION-全额给收货地代理 / SPLIT-跨区时两个代理按比例拆分。团长分成始终按绑定关系判定，不受此项影响' },
  'commission.agent.origin.share.ratio': { name: '招募代理拆分比例', type: 'RATIO', remark: '仅 SPLIT 口径生效：跨区时代理总池分给招募代理（发展该团长的那位）的比例，剩余归收货地代理' },
  'commission.agent.tier.district.ratio': { name: '区代分成占比', type: 'RATIO', remark: '三级区域代理：省代/市代/区代可同时存在，一单落到某区三级各拿一份，都从同一个代理总池里拆。三项之和应为 100%' },
  'commission.agent.tier.city.ratio': { name: '市代分成占比', type: 'RATIO', remark: '同上。某一级没有代理时，它的份额按剩下几级的比例等比放大分掉，不留给平台' },
  'commission.agent.tier.province.ratio': { name: '省代分成占比', type: 'RATIO', remark: '同上。三项全配成 0 等同于不分级，代理分成整份归收货地代理' },
  'commission.agent.origin.take.all': { name: '收货地无代理时全归招募代理', type: 'INT', remark: '仅 SPLIT 口径生效：1-整份代理分成归招募代理 0-按「无代理区域分成去向」走平台兜底' },
  'region.no.agent.fallback': { name: '无代理区域分成去向', type: 'STRING', remark: 'PLATFORM-平台兜底 / SUSPEND-暂挂待开通。PRD 17.3 待确认' },
  'verify.confirm.timeout.seconds': { name: '核销待确认超时', type: 'INT', unit: '秒', remark: 'PRD 8.5，超时自动作废并原路解冻积分' },
  'verify.cancel.window.hours': { name: '核销自助撤销时限', type: 'INT', unit: '小时', remark: 'PRD 8.8，超期走售后退款；平台财务不受限' },
  'verify.dynamic.code.ttl.seconds': { name: '动态码有效期', type: 'INT', unit: '秒', remark: 'PRD 8.4，订单码与用户付款码共用' },
  'verify.code.fail.lock.times': { name: '解析失败锁定次数', type: 'INT', unit: '次', remark: 'PRD 8.4，同设备连续失败上限' },
  'verify.code.fail.lock.seconds': { name: '解析失败锁定时长', type: 'INT', unit: '秒', remark: 'PRD 8.4' },
  'risk.address.change.threshold': { name: '改址次数告警阈值', type: 'INT', unit: '次/30天', remark: 'PRD 8.9 改址套利' },
  'risk.agent.audit.daily.limit': { name: '代理单日审批上限', type: 'INT', unit: '人/日', remark: 'PRD 8.9 代理滥招' },
  'distribution.self.buy.rebate': { name: '自购返佣', type: 'BOOL', locked: true, remark: '红线 R4/R5，本期强制关闭' },
  'distribution.level.diff.enable': { name: '等级差返佣', type: 'BOOL', locked: true, remark: '红线 R3，本期强制关闭' },
};

export default {
  name: 'AllianceConfig',
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      dialogVisible: false,
      current: {},
      form: { value: '' },
      rules: {
        value: [
          { required: true, message: '请填写配置值', trigger: 'blur' },
          { validator: this.validateValue, trigger: 'blur' },
        ],
      },
    };
  },
  created() {
    this.loadConfig();
  },
  methods: {
    validateValue(rule, value, callback) {
      const type = this.current.type;
      if ((type === 'INT' || type === 'RATIO') && !/^\d+$/.test(value)) {
        return callback(new Error('必须是非负整数'));
      }
      if (type === 'DECIMAL' && !/^\d+(\.\d{1,2})?$/.test(value)) {
        return callback(new Error('必须是非负金额，最多保留两位小数'));
      }
      if (type === 'BOOL' && value !== '0' && value !== '1') {
        return callback(new Error('只能填 0 或 1'));
      }
      callback();
    },
    async loadConfig() {
      this.loading = true;
      try {
        const res = await getAllianceConfig();
        const map = res && typeof res === 'object' ? res : {};
        this.list = Object.keys(map)
          .sort()
          .map((key) => {
            const meta = META[key] || {};
            return {
              key,
              value: map[key],
              name: meta.name || key,
              type: meta.type || 'STRING',
              unit: meta.unit || '',
              remark: meta.remark || '',
              locked: !!meta.locked,
            };
          });
      } catch (e) {
        /* 拦截器已弹过错误 */
      } finally {
        this.loading = false;
      }
    },
    openDialog(row) {
      this.current = row;
      this.form = { value: row.value };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          await updateAllianceConfig(this.current.key, this.form.value);
          this.$message.success('已生效');
          this.dialogVisible = false;
          this.loadConfig();
        } catch (e) {
          /* 拦截器已弹过错误 */
        } finally {
          this.saving = false;
        }
      });
    },
  },
};
</script>

<style scoped lang="scss">
.selWidth {
  width: 260px;
}
.tips {
  color: #999;
  font-size: 13px;
  line-height: 20px;
  margin-bottom: 12px;
}
.key {
  color: #999;
  font-size: 12px;
}
.ratio-preview { margin-left: 8px; color: #409eff; font-weight: 600; }
.remark {
  color: #666;
  font-size: 12px;
  line-height: 18px;
}
.hint {
  color: #999;
  font-size: 12px;
}
.unit {
  margin-left: 6px;
  color: #666;
}
</style>
