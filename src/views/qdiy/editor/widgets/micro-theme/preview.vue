<template>
  <div class="micro-theme-preview" :style="{ background: computedStyle.bgColor }">
    <div class="list-content" :style="{ ...computedStyle.spaceStyle }">
      <div v-for="(item, index) in catList" :key="index">
        <div v-if="item.showTwo" class="item-cont" :style="{ background: computedStyle.titleBgColor }">
          <!-- 二级标题行 -->
          <div class="menu tab-contain">
            <div class="w-9000" :class="{ 'tab-flex': item.catList && item.catList.length <= 5 }">
              <div
                v-for="(item2, index2) in item.catList"
                :key="index2"
                class="tab-item tab-float ellipsis"
                :style="{ color: computedStyle.titleColor }"
              >
                {{ item2.title }}
              </div>
            </div>
          </div>

          <div class="detail">
            <div class="three-menu tab-contain">
              <!-- 三级标题行，只画第一组 -->
              <template v-if="item.showThree && firstCat(item)">
                <div class="three-w">
                  <div class="pos" :style="{ background: computedStyle.titleBgColor }">
                    <div class="w-9000 overflow-hidden" :class="{ 'tab-flex': thirdList(item).length <= 4 }">
                      <div
                        v-for="(item3, index3) in thirdList(item)"
                        :key="index3"
                        class="tab-item tab-float ellipsis"
                        :style="{ color: computedStyle.titleColor }"
                      >
                        {{ item3.title }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 图片：显示三级时取三级首图，否则取二级首图 -->
              <div>
                <el-image
                  v-if="item.showThree && thirdImg(item)"
                  fit="contain"
                  :src="thirdImg(item)"
                  style="width: 100%"
                  :style="[imgRadius]"
                />
                <el-image
                  v-else-if="item.showTwo && !item.showThree && secondImg(item)"
                  fit="contain"
                  :src="secondImg(item)"
                  style="width: 100%"
                  :style="[imgRadius]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 微主题 —— 画布预览
 * 迁移自 PHP common/micro-theme/preview.php
 *
 * 原模板在同一元素上混用 v-for 与 v-if（`v-if="index2==0"`）只为取首项，
 * 这在 Vue 里是反模式，这里改成用计算方法直接取首项，渲染结果一致。
 */
export default {
  name: 'MicroThemePreview',
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
    catList() {
      return (this.activeItem.data && this.activeItem.data.catList) || [];
    },
    imgRadius() {
      const s = this.computedStyle.searchIpts;
      if (!s) return {};
      return {
        'border-top-left-radius': s['border-top-left-radius'],
        'border-top-right-radius': s['border-top-right-radius'],
        'border-bottom-left-radius': s['border-bottom-left-radius'],
        'border-bottom-right-radius': s['border-bottom-right-radius'],
      };
    },
  },
  methods: {
    firstCat(item) {
      return item.catList && item.catList[0];
    },
    thirdList(item) {
      const first = this.firstCat(item);
      return (first && first.catList) || [];
    },
    thirdImg(item) {
      const third = this.thirdList(item)[0];
      return third && third.catImg ? third.catImg.imgUrl : '';
    },
    secondImg(item) {
      const first = this.firstCat(item);
      return first && first.catImg ? first.catImg.imgUrl : '';
    },
  },
};
</script>

<style scoped lang="scss">
.list-content {
  overflow: hidden;
  width: 100%;
  .item-cont {
    overflow: hidden;
    padding: 10px;
    border-radius: 10px;
    .menu {
      overflow: hidden;
      margin: 0;
    }
    .detail {
      position: relative;
      .three-menu {
        width: 100%;
        position: relative;
        .three-w {
          border-radius: 10px;
          position: absolute;
          height: 25px;
          width: 100%;
          margin: 0 auto;
          line-height: 25px;
          z-index: 1;
          top: 10px;
          .pos {
            margin: 0 auto;
            width: 80%;
            border-radius: 30px;
          }
        }
      }
    }
  }
}
.w-9000 {
  width: 90000px;
}
.overflow-hidden {
  overflow: hidden;
}
.tab-contain {
  overflow: hidden;
  border-radius: 0;
  background: none;
  margin: 0;
}
.tab-flex {
  display: flex;
  width: 100%;
}
.tab-float {
  float: left;
}
.tab-item {
  position: relative;
  padding: 0 20px;
  text-align: center;
  flex: 1;
}
.ellipsis {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
