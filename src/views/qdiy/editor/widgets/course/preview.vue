<template>
  <div
    class="diy-course"
    :class="{ 'three-tem': styleVal == 3, 'four-tem': styleVal == 4 }"
    :style="{ background: computedStyle.searchBox, padding: marginInfos.temp }"
  >
    <div
      v-for="(item, index) in courseList"
      :key="index"
      :class="itemClass"
      :style="{ ...marginInfos.model, background: computedStyle.iptBg, ...inputStyle }"
    >
      <div class="diy-course-image">
        <div v-if="isShowHot" :class="hotClass" :style="hotStyle">{{ hotName }}</div>
        <div class="course-img"><i class="el-icon-video-camera" /></div>
      </div>
      <div class="course-model">
        <div v-if="permession.title.showAlpha" class="course-title" :style="{ color: permession.title.color }">
          {{ item.title }}
        </div>
        <div v-if="permession.desc.showAlpha" class="course-desc" :style="{ color: permession.desc.color }">
          {{ item.introduce }}
        </div>
        <div class="course-bottom">
          <div v-if="permession.price.showAlpha" class="course-price" :style="{ color: permession.price.color }">
            ￥<span class="price-num">{{ item.price }}</span>
          </div>
          <div v-if="permession.count.showAlpha" class="course-count" :style="{ color: permession.count.color }">
            {{ item.views }}人学习
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 课程 —— 画布预览。迁移自 PHP common/course/preview.php
 *
 * 四种排版（一行一个 / 列表 / 三列 / 四列）与显示项开关照搬；
 * 课程封面与角标底图是 PHP 侧静态资源，平台端用占位块与纯色角标替代。
 * 课程数据按已选课程数量渲染示例卡片（Java 侧无课程模块接口）。
 */
const DEMO_ITEM = { title: '这里是课程标题', introduce: '这里是课程副标题', price: '88.88', views: 0 };

export default {
  name: 'CoursePreview',
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
    styleVal() {
      return this.searchData.styleVal || 1;
    },
    itemClass() {
      return ['', 'course-style-big', 'course-style-list', 'course-style-col', 'course-style-col'][this.styleVal];
    },
    courseList() {
      const list = this.searchData.courseList || [];
      const count = list.length || 3;
      return new Array(count).fill(null).map(() => ({ ...DEMO_ITEM }));
    },
    /** 显示内容：未配置时全显示 */
    permession() {
      const def = {
        title: { showAlpha: true, color: '#202021' },
        desc: { showAlpha: true, color: '#999ca7' },
        price: { showAlpha: true, color: '#DB0505' },
        count: { showAlpha: true, color: '#000000' },
      };
      const list = this.searchData.showContent;
      if (!list || !list.length) return def;
      Object.keys(def).forEach((k) => {
        def[k].showAlpha = false;
      });
      list.forEach((it) => {
        if (def[it.key]) {
          def[it.key].showAlpha = true;
          def[it.key].color = it.color;
        }
      });
      return def;
    },
    angleMark() {
      return this.searchData.angleMark || null;
    },
    isShowHot() {
      return !!this.angleMark && this.angleMark.label != 1;
    },
    hotClass() {
      const obj = ['diy-course-hot'];
      const am = this.angleMark;
      if (am && am.label == 2 && am.angleMarkStyle) obj.push(`hot-style-${am.angleMarkStyle.label}`);
      return obj;
    },
    hotStyle() {
      const am = this.angleMark;
      if (am && am.label == 3 && am.customImgUrl) {
        return { background: `url(${am.customImgUrl}) no-repeat`, backgroundSize: 'cover' };
      }
      return {};
    },
    hotName() {
      const am = this.angleMark;
      if (!am) return '';
      if (!am.angleMarkText && am.label == 2) return '热门';
      return am.angleMarkText;
    },
    inputStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = { ...this.computedStyle.searchIpts };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    // marginArr 依次是 间距 / 上 / 下 / 左右
    marginInfos() {
      const arr = this.searchData.marginArr || ['6px', '0px', '0px', '8px'];
      return {
        temp: `${arr[1]} ${arr[3]} ${arr[2]}`,
        model: { marginBottom: arr[0] },
      };
    },
  },
};
</script>

<style scoped lang="scss">
.diy-course {
  box-sizing: border-box;

  &.three-tem,
  &.four-tem {
    display: flex;
    flex-wrap: wrap;
  }
  &.three-tem .course-style-col {
    width: 32%;
    margin-right: 2%;

    &:nth-child(3n) {
      margin-right: 0;
    }
  }
  &.four-tem .course-style-col {
    width: 23.5%;
    margin-right: 2%;

    &:nth-child(4n) {
      margin-right: 0;
    }
  }
}
.course-style-big,
.course-style-col {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
}
.course-style-list {
  display: flex;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;

  .diy-course-image {
    width: 120px;
    flex-shrink: 0;
  }
}
.diy-course-image {
  position: relative;
}
.course-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 110px;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 24px;
}
.diy-course-hot {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9;
  background: #fd463e;
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 0 0 8px 0;
}
.course-model {
  padding: 6px 8px;
  flex: 1;
  overflow: hidden;
}
.course-title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.course-desc {
  font-size: 12px;
  color: #999ca7;
  line-height: 16px;
  max-height: 32px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.course-bottom {
  display: flex;
  align-items: center;
  padding-top: 4px;
}
.course-price {
  color: #db0505;
  font-size: 12px;

  .price-num {
    font-size: 14px;
  }
}
.course-count {
  font-size: 11px;
  padding-left: 10px;
  color: #999;
}
</style>
