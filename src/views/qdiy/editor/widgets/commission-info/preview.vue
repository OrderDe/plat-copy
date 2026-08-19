<template>
  <div class="commission-info-preview" :style="containStyle">
    <div class="commission-card" :style="cardStyle">
      <div class="my-income-container">
        <span :style="myIncomeStyle">{{ cardText }}</span>
      </div>
      <div class="money-container">
        <span class="money" :style="moneyStyle">
          <span v-if="showUnit">￥</span>
          <span>0.94</span>
        </span>
        <span class="withdraw-btn" :style="{ backgroundColor: computedStyle.withdrawBtnColor }">提现</span>
      </div>
      <div v-if="showDetail">
        <span class="account-btn" :style="{ backgroundColor: computedStyle.accountDetailsBtnColor }">账单详情</span>
      </div>
      <div class="remind-container">
        <span class="remind-item" :style="{ backgroundColor: computedStyle.reminderBgColor }">
          <img v-if="computedStyle.reminderImg" class="remind-icon" :src="computedStyle.reminderImg" >
          <i v-else class="el-icon-bell remind-icon-holder" />
          <span>{{ remindText }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 分销信息 —— 画布预览
 * 迁移自 PHP common/commission-info/preview.php + style-components/commission-info/style1.php
 *
 * PHP 侧只有风格1，这里把子组件合并进 preview。
 * 默认提醒图标 resources/img/decorate/commission-info/bell.png 无资源，未配置时用 Element 图标。
 */
export default {
  name: 'CommissionInfoPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    searchData() {
      return this.activeItem.data || {};
    },
    containStyle() {
      const cs = this.computedStyle;
      return {
        backgroundColor: cs.containBgColor,
        padding: `${cs.compMarginTop || 0}px ${cs.compMarginLR || 0}px ${cs.compMarginBot || 0}px`,
      };
    },
    cardStyle() {
      const cs = this.computedStyle;
      const style = {
        backgroundColor: cs.tabSelectColor,
        borderRadius: `${cs.compRadiusTop || 0}px ${cs.compRadiusTop || 0}px ${cs.compRadiusBot || 0}px ${
          cs.compRadiusBot || 0
        }px`,
      };
      if (cs.cardShadowColor) style.boxShadow = `${cs.cardShadowColor} 0px 0px 25px`;
      if (cs.cardBgType == 2) {
        style.backgroundImage = `url(${cs.tabSelectImg})`;
        style.backgroundSize = 'cover';
      }
      return style;
    },
    myIncomeStyle() {
      return { color: this.computedStyle.myIncomeColor, fontSize: '17px' };
    },
    moneyStyle() {
      return { color: this.computedStyle.moneyColor, fontSize: '24px' };
    },
    cardText() {
      const info = this.searchData.dependentInfo || {};
      return info.cardText || '我的收益（元）';
    },
    remindText() {
      const info = this.searchData.reminderInfo || {};
      return info.text || '每月25~31号可提现结算收益';
    },
    showDetail() {
      return (this.searchData.dependentInfo || {}).isHiddenDetail != 1;
    },
    showUnit() {
      return (this.searchData.dependentInfo || {}).isHiddenUnit != 1;
    },
  },
};
</script>

<style scoped lang="scss">
.commission-info-preview {
  overflow: hidden;
}
.commission-card {
  padding: 16px;
  background-color: #e40a0a;
  color: #fff;
}
.money-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}
.money {
  font-weight: bold;
}
.withdraw-btn,
.account-btn {
  display: inline-block;
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 12px;
  background: #965757;
}
.remind-container {
  padding-top: 10px;
}
.remind-item {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #965757;
}
.remind-icon {
  max-width: 24px;
  max-height: 24px;
  margin-right: 4px;
}
.remind-icon-holder {
  margin-right: 4px;
}
</style>
