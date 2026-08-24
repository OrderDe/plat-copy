<template>
  <div class="secondary-card-style">
    <diy-style-contain title="标题文字">
      <div class="row">
        <div class="row-label">主标题</div>
        <el-input v-model="secondaryInfo.title" :maxlength="10" show-word-limit size="small" @input="secondaryInfoChange" />
      </div>
      <div class="row">
        <div class="row-label">副标题</div>
        <el-input
          v-model="secondaryInfo.secondTitle"
          :maxlength="10"
          show-word-limit
          size="small"
          @input="secondaryInfoChange"
        />
      </div>
    </diy-style-contain>

    <diy-style-contain title="关联卡次">
      <el-radio-group v-model="secondaryInfo.card_type" @change="secondaryInfoChange">
        <el-radio :label="0">特定次卡</el-radio>
        <el-radio :label="1">全部次卡</el-radio>
      </el-radio-group>

      <div v-if="secondaryInfo.card_type == 0" class="card-pick">
        <ActivityPicker
          :value="pickCardList"
          :max-length="maxCardLen"
          :tip="pickTip"
          @change="onCardChange"
        />
      </div>

      <div v-else class="card-custom">
        <div class="row">
          <div class="row-label">次卡名称</div>
          <el-input v-model="cardInfo.title" :maxlength="15" show-word-limit size="small" placeholder="默认显示‘消费次卡’" @input="cardInfoChange" />
        </div>
        <div class="row">
          <div class="row-label">有效期</div>
          <!-- 前端 qdiySecondaryCard 读 validDesc，之前没有入口，卡片上永远显示兜底的「30日内有效」 -->
          <el-input
            v-model="cardInfo.validDesc"
            :maxlength="15"
            show-word-limit
            size="small"
            placeholder="默认显示‘30日内有效’"
            @input="cardInfoChange"
          />
        </div>
        <div class="row">
          <div class="row-label">售价</div>
          <el-input v-model="cardInfo.price" :maxlength="9" size="small" placeholder="68" @input="cardInfoChange" />
        </div>
        <div class="row">
          <div class="row-label">原价</div>
          <el-input v-model="cardInfo.original_price" :maxlength="9" size="small" placeholder="108" @input="cardInfoChange" />
        </div>
        <div class="row">
          <div class="row-label">虚拟销量</div>
          <el-input v-model="cardInfo.virtual_sales" :maxlength="9" size="small" placeholder="1000" @input="cardInfoChange" />
        </div>
        <!-- 前端读 card.background_color / card.font_color，之前面板里没有入口，只能用默认配色 -->
        <div class="row">
          <div class="row-label">卡片背景</div>
          <el-color-picker v-model="cardInfo.background_color" size="small" @change="cardInfoChange" />
          <span class="row-tip">配了入口海报时以海报为准</span>
        </div>
        <div class="row">
          <div class="row-label">文字颜色</div>
          <el-color-picker v-model="cardInfo.font_color" size="small" @change="cardInfoChange" />
        </div>
        <div class="row">
          <div class="row-label">入口海报</div>
          <div>
            <div v-if="!cardInfo.background" class="card-upload" @click="pickerVisible = true">
              <i class="el-icon-plus" />
            </div>
            <div v-else class="card-coverimg">
              <el-image style="width: 80px; height: 80px" :src="cardInfo.background" fit="cover" />
              <el-button class="icon-close" type="primary" size="mini" icon="el-icon-close" circle @click="delPic" />
            </div>
          </div>
        </div>
        <p class="tips-text">尺寸：686*360像素，小于1M，支持jpg、png、jpeg格式</p>
      </div>
    </diy-style-contain>

    <diy-style-contain v-if="secondaryInfo.card_type == 0" title="更多次卡展示">
      <el-radio-group v-model="secondaryInfo.isJump" @change="secondaryInfoChange">
        <el-radio :label="0">系统默认</el-radio>
        <el-radio :label="1">不跳转</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <el-dialog title="选择图片" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="onPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 消费次卡 —— 属性面板。迁移自 PHP common/secondary-card/style.php
 *
 * score-secondary-card（积分次卡）配置项与本组件完全一致，直接复用本文件。
 * 次卡选择走 ActivityPicker（按次卡 ID 录入），原因见该组件注释。
 */
import uploadPictures from '@/components/base/uploadPicture';
import ActivityPicker from '../../components/ActivityPicker';
import { deepClone } from '../../controls/utils';

export default {
  name: 'SecondaryCardStyle',
  components: { uploadPictures, ActivityPicker },
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
    pickTip: {
      type: String,
      default: '按次卡 ID 添加，真实次卡信息由 App 端按 ID 获取',
    },
  },
  data() {
    return {
      result: {},
      pickerVisible: false,
      maxCardLen: 10,
      secondaryInfo: {
        title: '次卡组件主标题',
        secondTitle: '多种权益，一卡解锁',
        isJump: 0,
        card_type: 0,
      },
      cardInfo: {
        title: '消费次卡',
        virtual_sales: '1000',
        original_price: '108',
        price: '68',
        validDesc: '',
        background: null,
        background_color: '#FFD9C2',
        font_color: '#333333',
      },
      pickCardList: [],
    };
  },
  created() {
    this.result = deepClone(this.activeItem);
    if (!this.result.data) this.$set(this.result, 'data', {});
    if (!this.result.computedStyle) this.$set(this.result, 'computedStyle', {});

    this.secondaryInfo = Object.assign(this.secondaryInfo, this.result.data.secondaryInfo || {});
    this.cardInfo = Object.assign(this.cardInfo, this.result.data.cardInfo || {});
    this.pickCardList = this.result.data.cards || [];
  },
  methods: {
    secondaryInfoChange() {
      this.$set(this.result.data, 'secondaryInfo', Object.assign({}, this.secondaryInfo));
      this.$emit('update', this.result);
    },
    cardInfoChange() {
      this.$set(this.result.data, 'cardInfo', Object.assign({}, this.cardInfo));
      this.$emit('update', this.result);
    },
    onCardChange(list) {
      this.pickCardList = list;
      this.$set(this.result.data, 'cards', list);
      this.$emit('update', this.result);
    },
    onPicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url) {
        this.cardInfo.background = url;
        this.cardInfoChange();
      }
      this.pickerVisible = false;
    },
    delPic() {
      this.cardInfo.background = null;
      this.cardInfoChange();
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .row-label {
    width: 80px;
    flex-shrink: 0;
    text-align: center;
    color: #999;
  }
  .row-tip {
    margin-left: 8px;
    font-size: 12px;
    color: #c0c4cc;
  }
}
.card-pick,
.card-custom {
  margin-top: 12px;
}
.card-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border: 1px dashed #d5d5d5;
  border-radius: 4px;
  cursor: pointer;
  color: #c0c4cc;
}
.card-coverimg {
  position: relative;

  .icon-close {
    position: absolute;
    top: -8px;
    right: -8px;
  }
}
.tips-text {
  color: #999;
  font-size: 12px;
}
</style>
