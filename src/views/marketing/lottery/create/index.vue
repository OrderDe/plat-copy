<template>
  <div class="divBox lottery-create">
    <el-card shadow="never" :bordered="false">
      <div class="page-title">
        <span>{{ isEdit ? '编辑大转盘' : '创建大转盘' }}</span>
        <el-button type="text" icon="el-icon-back" @click="backToList">返回活动列表</el-button>
      </div>
      <el-steps :active="activeStep" align-center finish-status="success" class="steps">
        <el-step title="步骤1" description="基础设置" />
        <el-step title="步骤2" description="活动设置" />
        <el-step title="步骤3" description="奖项设置" />
        <el-step title="步骤4" description="转盘设置" />
      </el-steps>

      <div class="config-form">
        <el-form v-if="activeStep === 0" ref="baseForm" :model="form" label-width="150px" size="small">
          <el-divider content-position="left">基础设置</el-divider>
          <el-form-item label="活动名称" required>
            <el-input v-model.trim="form.name" maxlength="50" show-word-limit placeholder="请输入活动名称" />
          </el-form-item>
          <el-form-item label="活动时间" required>
            <el-date-picker v-model="form.dateRange" type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 420px" />
          </el-form-item>
          <el-form-item label="活动显示">
            <el-switch v-model="form.visible" active-text="显示" inactive-text="隐藏" />
          </el-form-item>
          <el-form-item label="活动状态">
            <el-radio-group v-model="form.status">
              <el-radio label="pending">未开始</el-radio>
              <el-radio label="running">进行中</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="活动说明">
            <el-input v-model="form.instruction" type="textarea" :rows="5" maxlength="500" show-word-limit placeholder="请输入活动规则和参与说明" />
          </el-form-item>
        </el-form>

        <el-form v-if="activeStep === 1" :model="form" label-width="190px" size="small">
          <el-divider content-position="left">抽奖设置</el-divider>
          <el-form-item label="总抽奖机会">
            <el-input-number v-model="form.totalChance" :min="0" :max="999999" controls-position="right" />
            <span class="unit">次（0 代表不限制）</span>
          </el-form-item>
          <el-form-item label="每人最多可抽奖次数">
            <el-input-number v-model="form.userChance" :min="0" :max="999999" controls-position="right" />
            <span class="unit">次（0 代表不限制）</span>
          </el-form-item>
          <el-form-item label="每日抽奖机会">
            <el-input-number v-model="form.dailyChance" :min="0" :max="999999" controls-position="right" />
            <span class="unit">次</span>
          </el-form-item>
          <el-form-item label="每人每天最多可抽奖次数">
            <el-input-number v-model="form.dailyUserChance" :min="0" :max="999999" controls-position="right" />
            <span class="unit">次（0 代表不限制）</span>
          </el-form-item>
          <el-divider content-position="left">额外抽奖机会</el-divider>
          <el-form-item label="可做任务时间">
            <el-radio-group v-model="form.extraTiming">
              <el-radio label="start">活动开始后</el-radio>
              <el-radio label="created">活动创建成功</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="额外机会来源">
            <el-checkbox-group v-model="form.extraSources">
              <el-checkbox label="points">积分兑换</el-checkbox>
              <el-checkbox label="invite">邀请新用户</el-checkbox>
              <el-checkbox label="consume">消费获得</el-checkbox>
              <el-checkbox label="product">购买指定商品</el-checkbox>
              <el-checkbox label="category">选择商品类型</el-checkbox>
              <el-checkbox label="single">单笔消费</el-checkbox>
              <el-checkbox label="total">累计消费</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-divider content-position="left">中奖设置</el-divider>
          <el-form-item label="每人中奖次数">
            <el-input-number v-model="form.userPrizeChance" :min="0" :max="999999" controls-position="right" />
            <span class="unit">次（0 代表不限制）</span>
          </el-form-item>
          <el-form-item label="每人每天最多中奖次数">
            <el-input-number v-model="form.dailyPrizeChance" :min="0" :max="999999" controls-position="right" />
            <span class="unit">次（0 代表不限制）</span>
          </el-form-item>
        </el-form>

        <el-form v-if="activeStep === 2" :model="form" label-width="160px" size="small">
          <el-form-item label="奖项数量">
            <el-radio-group v-model="form.awardCount" @change="setAwardCount">
              <el-radio v-for="count in awardCounts" :key="count" :label="count">{{ count }}项</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="用户抽奖多少次后可中奖">
            <el-input-number v-model="form.drawsBeforePrize" :min="0" :max="999999" controls-position="right" />
            <span class="unit">次（0 代表不限制）</span>
          </el-form-item>
          <el-divider content-position="left">奖品设置</el-divider>
          <div class="award-toolbar">
            <span>共 {{ form.awards.length }} 个奖项，点击奖项标题展开编辑</span>
            <el-button-group>
              <el-button size="mini" @click="expandAllAwards">全部展开</el-button>
              <el-button size="mini" @click="collapseAllAwards">全部收起</el-button>
            </el-button-group>
          </div>
          <el-collapse v-model="expandedAwards" class="award-list">
            <el-collapse-item v-for="(award, index) in form.awards" :key="award.key" :name="award.key" class="award-card">
              <template slot="title">
                <div class="award-collapse-title">
                  <span class="award-title">{{ awardLabel(index) }}</span>
                  <span class="award-summary">{{ awardSummary(award) }}</span>
                  <el-switch v-model="award.guaranteed" active-text="保底奖项" @click.native.stop />
                </div>
              </template>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="奖品名称" label-width="100px">
                    <el-input v-model.trim="award.name" placeholder="例如：100积分" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="奖品类型" label-width="100px">
                    <el-select v-model="award.type" style="width: 100%">
                      <el-option v-for="item in prizeTypes" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="奖励价值" label-width="100px">
                    <el-input-number v-model="award.value" :min="0" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="奖品数量" label-width="100px">
                    <el-input-number v-model="award.quantity" :min="0" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="中奖概率" label-width="100px">
                    <el-input-number v-model="award.probability" :min="0" :max="100" :precision="2" controls-position="right" />
                    <span class="unit">%</span>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="多少人参加后可中奖" label-width="160px">
                    <el-input-number v-model="award.participants" :min="0" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="奖品图片" label-width="100px">
                    <el-upload action="#" :auto-upload="false" :show-file-list="false" @change="onAwardImageChange($event, index)">
                      <div class="award-image" :class="{ placeholder: !award.image }">
                        <img v-if="award.image" :src="award.image" alt="奖品图片" />
                        <i v-else class="el-icon-plus" />
                      </div>
                    </el-upload>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-collapse-item>
          </el-collapse>
          <div class="probability-total" :class="{ valid: probabilityTotal === 100 }">中奖概率合计：{{ probabilityTotal.toFixed(2) }}%（应为 100%）</div>
        </el-form>

        <el-form v-if="activeStep === 3" :model="form" label-width="150px" size="small">
          <el-divider content-position="left">展示设置</el-divider>
          <el-form-item label="音乐">
            <el-radio-group v-model="form.music">
              <el-radio label="default1">默认一</el-radio>
              <el-radio label="default2">默认二</el-radio>
              <el-radio label="default3">默认三</el-radio>
            </el-radio-group>
            <el-button type="primary" plain size="mini" icon="el-icon-video-play" @click="playMusic">播放</el-button>
          </el-form-item>
          <el-form-item label="背景图">
            <div class="background-setting">
              <el-upload action="#" :auto-upload="false" :show-file-list="false" @change="onBackgroundChange">
                <div class="background-preview" :style="backgroundStyle"><i v-if="!form.background" class="el-icon-plus" /></div>
              </el-upload>
              <div class="upload-hint">建议上传 375×554 或等比例的图片</div>
            </div>
            <el-button size="mini" @click="form.background = ''">恢复默认</el-button>
          </el-form-item>
          <el-form-item label="中奖用户数据">
            <el-radio-group v-model="form.showWinners">
              <el-radio :label="true">显示</el-radio>
              <el-radio :label="false">不显示</el-radio>
            </el-radio-group>
            <el-button type="text" size="small" @click="previewWinners">示例</el-button>
          </el-form-item>
          <p class="notice">小程序版本为 6.6.07 及以上生效。</p>
          <el-divider content-position="left">分享设置</el-divider>
          <el-form-item label="分享文案">
            <el-input v-model="form.shareText" maxlength="60" show-word-limit placeholder="请输入分享文案" />
          </el-form-item>
          <el-form-item label="分享图片">
            <el-upload action="#" :auto-upload="false" :show-file-list="false" @change="onShareImageChange">
              <div class="share-preview" :class="{ placeholder: !form.shareImage }">
                <img v-if="form.shareImage" :src="form.shareImage" alt="分享图片" />
                <i v-else class="el-icon-plus" />
              </div>
            </el-upload>
            <div class="upload-hint">建议上传 375×300 的图片</div>
          </el-form-item>
          <div class="mini-preview">
            <div class="mini-preview-title">示例预览</div>
            <div class="mini-wheel"><span v-for="n in 8" :key="n">{{ form.awards[(n - 1) % form.awards.length].name || '谢谢参与' }}</span></div>
          </div>
        </el-form>
      </div>

      <div class="step-actions">
        <el-button v-if="activeStep > 0" @click="previousStep">上一步</el-button>
        <el-button v-if="activeStep < 3" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-else type="primary" @click="finish">完成</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
const STORAGE_KEY = 'platform-lottery-activities';

export default {
  name: 'LotteryCreate',
  data() {
    return {
      activeStep: 0,
      isEdit: Boolean(this.$route.params.id),
      awardCounts: [4, 6, 8, 10],
      expandedAwards: [],
      prizeTypes: [
        { label: '积分', value: 'points' },
        { label: '抵扣购物券/红包', value: 'coupon' },
        { label: '自营商城商品', value: 'selfProduct' },
        { label: '店内商品', value: 'merchantProduct' },
        { label: '谢谢惠顾', value: 'none' },
      ],
      form: {
        id: null,
        name: '',
        dateRange: [],
        visible: true,
        status: 'pending',
        instruction: '',
        totalChance: 0,
        userChance: 0,
        dailyChance: 0,
        dailyUserChance: 0,
        extraTiming: 'start',
        extraSources: [],
        userPrizeChance: 0,
        dailyPrizeChance: 0,
        awardCount: 4,
        drawsBeforePrize: 0,
        awards: [],
        music: 'default1',
        background: '',
        showWinners: false,
        shareText: '',
        shareImage: '',
      },
    };
  },
  computed: {
    probabilityTotal() {
      return this.form.awards.reduce((total, award) => total + Number(award.probability || 0), 0);
    },
    backgroundStyle() {
      return this.form.background ? { backgroundImage: `url(${this.form.background})` } : {};
    },
  },
  created() {
    this.setAwardCount(this.form.awardCount);
    if (this.isEdit) this.loadActivity();
  },
  methods: {
    awardTemplate(index) {
      return { key: `${Date.now()}-${index}-${Math.random()}`, name: index === 0 ? '一等奖' : '谢谢惠顾', type: index === 0 ? 'points' : 'none', value: index === 0 ? 100 : 0, quantity: index === 0 ? 10 : 0, probability: index === 0 ? 10 : 90, participants: 0, guaranteed: false, image: '' };
    },
    setAwardCount(count) {
      const expandedKeys = new Set(this.expandedAwards);
      const awards = this.form.awards.slice(0, count);
      while (awards.length < count) awards.push(this.awardTemplate(awards.length));
      this.form.awards = awards;
      this.expandedAwards = awards.map((award) => award.key).filter((key) => expandedKeys.has(key));
      if (!this.expandedAwards.length && awards.length) this.expandedAwards = [awards[0].key];
    },
    awardLabel(index) {
      return index < 4 ? ['一等奖', '二等奖', '三等奖', '四等奖'][index] : `奖项${index + 1}`;
    },
    awardSummary(award) {
      const type = this.prizeTypes.find((item) => item.value === award.type);
      const name = award.name || '未设置奖品';
      const typeName = type ? type.label : '未设置类型';
      return `${name} · ${typeName} · ${Number(award.probability || 0).toFixed(2)}%`;
    },
    expandAllAwards() {
      this.expandedAwards = this.form.awards.map((award) => award.key);
    },
    collapseAllAwards() {
      this.expandedAwards = [];
    },
    loadActivity() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const item = JSON.parse(saved).find((activity) => String(activity.id) === String(this.$route.params.id));
        if (item) {
          this.form.id = item.id;
          this.form.name = item.name;
          this.form.dateRange = [item.startTime, item.endTime];
          this.form.visible = item.visible;
          this.form.status = item.status;
        }
      } catch (e) {
        // Ignore malformed prototype data and keep an empty form.
      }
    },
    nextStep() {
      if (this.activeStep === 0 && !this.form.name) {
        this.$message.warning('请填写活动名称');
        return;
      }
      if (this.activeStep === 2 && this.probabilityTotal > 100) {
        this.$message.warning('中奖概率合计不能超过 100%');
        return;
      }
      this.activeStep += 1;
    },
    previousStep() {
      this.activeStep -= 1;
    },
    finish() {
      if (!this.form.name) {
        this.$message.warning('请填写活动名称');
        this.activeStep = 0;
        return;
      }
      if (this.probabilityTotal !== 100) {
        this.$message.warning('请将中奖概率调整为 100%');
        this.activeStep = 2;
        return;
      }
      const startTime = this.form.dateRange[0] || this.formatDate(new Date());
      const endTime = this.form.dateRange[1] || startTime;
      let activities = [];
      try {
        activities = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch (e) {
        activities = [];
      }
      const id = this.form.id || Math.max.apply(null, activities.map((item) => Number(item.id)).concat([10000])) + 1;
      const activity = { id, name: this.form.name, extraChance: this.form.extraSources.length ? '任务获得' : '无', startTime, endTime, participants: 0, visits: 0, winners: 0, visible: this.form.visible, status: this.form.status };
      const index = activities.findIndex((item) => String(item.id) === String(id));
      if (index > -1) activities.splice(index, 1, activity);
      else activities.unshift(activity);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
      this.$message.success(this.isEdit ? '活动已更新' : '活动创建成功');
      this.$router.push('/marketing/lottery/list');
    },
    backToList() {
      this.$router.push('/marketing/lottery/list');
    },
    formatDate(date) {
      const pad = (value) => (`0${value}`).slice(-2);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    onAwardImageChange(file, index) {
      if (file && file.raw) this.form.awards[index].image = URL.createObjectURL(file.raw);
    },
    onBackgroundChange(file) {
      if (file && file.raw) this.form.background = URL.createObjectURL(file.raw);
    },
    onShareImageChange(file) {
      if (file && file.raw) this.form.shareImage = URL.createObjectURL(file.raw);
    },
    playMusic() {
      this.$message.info('示例音乐播放');
    },
    previewWinners() {
      this.$message.info('示例：用户 138****8888 刚刚抽中一等奖');
    },
  },
};
</script>

<style scoped lang="scss">
.lottery-create {
  .page-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    color: #303133;
    font-size: 16px;
    font-weight: 500;
  }
  .steps {
    margin: 26px 20px 34px;
  }
  .config-form {
    max-width: 920px;
    min-height: 520px;
    margin: 0 auto;
  }
  .unit {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
  }
  .award-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -4px 0 10px;
    color: #909399;
    font-size: 12px;
  }
  .award-toolbar .el-button {
    color: #606266;
  }
  .award-list {
    border-top: 0;
    border-bottom: 0;
  }
  .award-card {
    margin: 0 0 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #fafcff;
    overflow: hidden;
  }
  .award-card ::v-deep .el-collapse-item__header {
    height: 46px;
    padding: 0 16px;
    border-bottom: 1px solid transparent;
    background: #fafcff;
    line-height: 46px;
  }
  .award-card.is-active ::v-deep .el-collapse-item__header {
    border-bottom-color: #ebeef5;
  }
  .award-card ::v-deep .el-collapse-item__wrap {
    border-bottom: 0;
    background: #fafcff;
  }
  .award-card ::v-deep .el-collapse-item__content {
    padding: 16px 18px 4px;
  }
  .award-collapse-title {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
  }
  .award-title {
    flex: 0 0 auto;
    color: #409eff;
    font-weight: 500;
  }
  .award-summary {
    min-width: 0;
    margin-left: 16px;
    overflow: hidden;
    color: #909399;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .award-collapse-title ::v-deep .el-switch {
    flex: 0 0 auto;
    margin-left: auto;
    margin-right: 22px;
  }
  .probability-total {
    margin: 12px 0;
    color: #f56c6c;
    text-align: center;
  }
  .probability-total.valid {
    color: #67c23a;
  }
  .award-image,
  .share-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 78px;
    height: 78px;
    overflow: hidden;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    background: #f5f7fa;
    color: #c0c4cc;
    font-size: 22px;
  }
  .award-image img,
  .share-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .background-setting {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .background-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 178px;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    background-color: #f5f7fa;
    background-position: center;
    background-size: cover;
    color: #c0c4cc;
    font-size: 22px;
  }
  .upload-hint,
  .notice {
    color: #f56c6c;
    font-size: 12px;
  }
  .notice {
    margin: 0 0 18px 150px;
  }
  .mini-preview {
    margin: 10px 0 0 150px;
    padding: 14px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #fffaf4;
  }
  .mini-preview-title {
    margin-bottom: 10px;
    color: #909399;
    font-size: 12px;
  }
  .mini-wheel {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .mini-wheel span {
    padding: 8px 4px;
    border: 1px solid #f6c37b;
    border-radius: 3px;
    background: #fff3dc;
    color: #b7791f;
    font-size: 12px;
    text-align: center;
  }
  .step-actions {
    padding-top: 20px;
    text-align: center;
  }
  .step-actions .el-button + .el-button {
    margin-left: 14px;
  }
}
</style>
