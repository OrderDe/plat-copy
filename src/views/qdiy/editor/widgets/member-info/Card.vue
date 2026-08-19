<template>
  <div class="member-info-card" :class="`variant-${variant}`" :style="variant === 1 ? cardStyle : null">
    <!-- 风格1：右上角图标 -->
    <div v-if="variant === 1" class="icon-info" :style="iconStyle">
      <div v-if="permission.set" class="icon"><i class="el-icon-setting" /></div>
    </div>

    <div class="user-info">
      <div class="user-avarat"><i class="el-icon-user-solid" /></div>

      <div class="member-box">
        <div class="user-top">
          <div class="user-name" :style="{ color: levelStyle.nameColor }">张三还是李四</div>
        </div>

        <div class="user-level-box">
          <div
            v-if="permission.level"
            class="user-level"
            :style="variant === 1 ? { color: levelStyle.levelColor, backgroundColor: levelStyle.levelBgColor } : null"
          >
            普通会员
          </div>
          <div class="user-auto">已认证</div>
        </div>

        <div class="user-level-box">
          <div class="invite_code" :style="{ color: levelStyle.nameColor }">邀请码:HN678910</div>
          <el-divider direction="vertical" />
          <div class="user-id" :style="{ color: levelStyle.nameColor }">ID:123456</div>
        </div>
      </div>

      <!-- 风格1 只有一个箭头，风格2 是两个按钮 -->
      <div v-if="variant === 1" class="nav-right">
        <i v-if="permission.centerPage" class="el-icon-arrow-right" :style="{ color: levelStyle.nameColor }" />
      </div>
      <div v-else class="nav-right">
        <div v-if="permission.set" class="btn-box" :style="iconStyle">设置<i class="el-icon-arrow-right" /></div>
        <div v-if="permission.centerPage" class="btn-box" :style="iconStyle">主页<i class="el-icon-arrow-right" /></div>
      </div>
    </div>

    <div class="assets-info" :style="variant === 2 ? cardStyle : null">
      <div :class="currencyClass" :style="assetStyle">
        <template v-for="(item, index) in assetList">
          <div v-if="index < showNum" :key="index" class="asset-cell">
            <div class="moeny">100</div>
            <div>{{ item.title }}</div>
          </div>
        </template>
      </div>
      <div v-if="currencyStyle == 1" class="indicator">
        <div class="indeic-1" />
        <div class="indeic-2" />
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 会员信息卡片 —— 画布预览子组件
 * 迁移自 PHP style-components/member-info/style1.php 与 style2.php
 *
 * 两个 PHP 文件逐行比对后只有排版差异（风格2 把设置/主页做成按钮、资产区带底卡），
 * 合并为一个组件用 variant 区分，避免抄两份近 400 行的重复实现。
 *
 * 资产项 PHP 侧来自服务端下发的 Vue.prototype.$capitals，Java 侧无该接口，
 * 用固定的「余额 / 积分 / 优惠券」兜底，与 PHP 的默认列表一致。
 */
export const DEFAULT_CAPITALS = [
  { code: 0, title: '余额' },
  { code: 1, title: '积分' },
  { code: 2, title: '优惠券' },
];

export default {
  name: 'MemberInfoCard',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
    // 1 = 风格1，2 = 风格2
    variant: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    searchData() {
      return this.activeItem.data || {};
    },
    currencyStyle() {
      return this.searchData.currencyStyle || 1;
    },
    currencyClass() {
      return this.currencyStyle == 1 ? 'assets-flex' : 'assets-info-grid';
    },
    // 一行显示时后台画布不滚动，只展示前三个
    showNum() {
      return this.currencyStyle == 1 ? 3 : 50;
    },
    iconStyle() {
      return {
        color: this.computedStyle.iconColor || '#fff',
        backgroundColor: this.computedStyle.iconBgColor || '#000',
      };
    },
    cardStyle() {
      const cs = this.computedStyle;
      const brTop = cs.compRadiusTop === undefined ? 10 : cs.compRadiusTop;
      const brBottom = cs.compRadiusBot === undefined ? 10 : cs.compRadiusBot;
      const style = {
        borderRadius: `${brTop}px ${brTop}px ${brBottom}px ${brBottom}px`,
      };
      if (cs.tabSelectColor != null) style.backgroundColor = cs.tabSelectColor;
      if (cs.cardShadowColor) style.boxShadow = `${cs.cardShadowColor} 0px 0px 25px`;
      if (cs.cardBgType == 2) {
        style.backgroundImage = `url(${cs.tabSelectImg})`;
        style.backgroundSize = 'cover';
      }
      return style;
    },
    levelStyle() {
      const { nameColor, memColor, memBgColor } = this.computedStyle;
      return {
        nameColor: nameColor || '#fff',
        levelColor: memColor || '#fff',
        levelBgColor: memBgColor || '#000',
      };
    },
    assetStyle() {
      return { color: this.computedStyle.assetColor };
    },
    /** contentList1 是下标数组，对应会员码 / 等级 / 设置 / 个人主页 */
    permission() {
      const obj = { memberCode: false, level: false, set: false, centerPage: false };
      const type = ['memberCode', 'level', 'set', 'centerPage'];
      const data = this.computedStyle.contentList1 || [0, 1, 2, 3];
      data.forEach((index) => {
        const key = type[index];
        if (key) obj[key] = true;
      });
      return obj;
    },
    assetList() {
      const data = this.searchData.contentList2 || [];
      if (!data.length) return [];
      return DEFAULT_CAPITALS.filter((item) => data.indexOf(item.code) !== -1);
    },
  },
};
</script>

<style scoped lang="scss">
.member-info-card {
  position: relative;
  padding: 30px 20px 16px;
  overflow: hidden;

  &.variant-1 {
    background-color: #e40a0a;
  }
}
.icon-info {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  right: 0;
  top: 0;
  width: 28px;
  height: 23px;
  border-radius: 0 0 0 12px;

  .icon > i {
    font-size: 15px;
  }
}
.user-info {
  display: flex;
  align-items: center;
}
.user-avarat {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 65px;
  height: 65px;
  margin-right: 12px;
  border-radius: 50%;
  background-color: #eee;
  color: #fff;
  font-size: 28px;
  flex-shrink: 0;
}
.member-box {
  flex: 1;
  overflow: hidden;
}
.user-top {
  display: flex;
  align-items: center;
}
.user-name {
  font-size: 16px;
  font-weight: bold;
}
.user-level-box {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding-top: 4px;
  color: #fff;
}
.user-level {
  border-radius: 10px;
  padding: 1px 8px;
}
.user-auto {
  padding-left: 8px;
  opacity: 0.8;
}
.nav-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}
.btn-box {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px 0 0 10px;
  margin-bottom: 4px;
}
.assets-info {
  margin-top: 14px;
  padding: 10px 0;
}
.assets-flex {
  display: flex;

  .asset-cell {
    flex: 1;
    text-align: center;
  }
}
.assets-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 10px;
  text-align: center;
}
.moeny {
  font-weight: bold;
  font-size: 16px;
}
.indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 8px;

  .indeic-1,
  .indeic-2 {
    width: 12px;
    height: 2px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.8);
    margin: 0 2px;
  }
  .indeic-2 {
    width: 6px;
    opacity: 0.5;
  }
}
</style>
