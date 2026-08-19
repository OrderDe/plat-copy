<template>
  <div>
    <div v-if="searchData.isShowSearch == 1" class="search-box" :style="{ background: computedStyle.searchBox }">
      <div class="search-ipt" :style="{ ...inputStyle, height: searchHeight }">
        <i class="el-icon-search" :style="{ color: computedStyle.iconsStyle }" />
        <div class="placeholder" :style="{ color: computedStyle.textStyle }">
          {{ searchData.placeholder || '请输入描述' }}
        </div>
      </div>
    </div>

    <div class="note-list" :class="{ 'three-tem': imgIndex == 2 }" :style="{ background: colorData.bak, padding: marginInfos.temp }">
      <div
        v-for="(item, index) in noteList"
        :key="index"
        :class="modelClass"
        :style="{ background: colorData.nodeBak, ...marginInfos.model, ...inputStyle }"
      >
        <!-- 风格1：标题在上、大图在下 -->
        <template v-if="imgIndex == 0">
          <div class="node-title" :style="{ color: colorData.nodeTitle }">{{ item.title }}</div>
          <div class="node-img"><i class="el-icon-picture-outline" /></div>
        </template>

        <!-- 风格2：左标题右小图 -->
        <div v-else-if="imgIndex == 1" class="node-info-two">
          <div class="node-title" :style="{ color: colorData.nodeTitle }">{{ item.title }}</div>
          <div class="node-img small"><i class="el-icon-picture-outline" /></div>
        </div>

        <!-- 风格3：两列瀑布 -->
        <template v-else>
          <div class="node-img"><i class="el-icon-picture-outline" /></div>
          <div class="node-title" :style="{ color: colorData.nodeTitle }">{{ item.title }}</div>
        </template>

        <div class="node-bottom">
          <div v-if="showKey('1')" class="flex-1" :style="{ color: colorData.time }">{{ item.created_at }}</div>
          <div v-if="showKey('2')" class="node-icon" :style="{ color: colorData.zangCount }">
            <i class="el-icon-view" /><span>{{ item.likes_num }}</span>
          </div>
          <div v-if="showKey('3')" class="node-icon" :style="{ color: colorData.count }">
            <i class="el-icon-thumb" /><span>{{ item.views_num }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 图文文章 —— 画布预览。迁移自 PHP common/notes-articles/preview.php
 *
 * 三种排版风格与显示项开关照搬；封面图与点赞/浏览图标是 PHP 侧的静态资源，
 * 平台端用占位块与 Element 图标替代。
 */
export default {
  name: 'NotesArticlesPreview',
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
    imgIndex() {
      return this.searchData.imgIndex || 0;
    },
    colorData() {
      return this.searchData.colorStyle || {};
    },
    modelClass() {
      return ['node-model-one', 'node-model-two', 'node-model-three'][this.imgIndex];
    },
    noteList() {
      const list = this.searchData.nodeList || [];
      if (!list.length) {
        return new Array(2).fill(null).map(() => ({ title: '标题', created_at: '2024-01-01', likes_num: 123, views_num: 123 }));
      }
      return list.map((it) => ({
        title: it.title || '标题',
        created_at: (it.params && it.params.created_at) || '2024-01-01',
        likes_num: (it.params && it.params.likes_num) || 123,
        views_num: (it.params && it.params.views_num) || 123,
      }));
    },
    searchHeight() {
      const h = this.computedStyle.heightInfos;
      return h && h[0] ? h[0].value + h[0].unit : '30px';
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
      const arr = this.searchData.marginArr || ['6px', '0px', '0px', '0px'];
      const num = (v) => parseFloat(v) || 0;
      return {
        temp: `${arr[1]} ${arr[3]} ${arr[2]}`,
        model: { marginBottom: arr[0] },
        modelVal: num(arr[0]),
        aboutVal: num(arr[3]),
      };
    },
  },
  methods: {
    showKey(key) {
      const arr = this.searchData.selArr || ['1', '2', '3'];
      return arr.indexOf(key) !== -1;
    },
  },
};
</script>

<style scoped lang="scss">
.search-box {
  padding: 8px 12px;
}
.search-ipt {
  display: flex;
  align-items: center;
  background: #f3f3f3;
  border-radius: 15px;
  padding: 0 12px;
  box-sizing: border-box;
}
.placeholder {
  font-size: 12px;
  color: #999;
  padding-left: 8px;
}
.note-list {
  box-sizing: border-box;

  &.three-tem {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
}
.node-model-one,
.node-model-two {
  background: #fff;
  border-radius: 6px;
  padding: 10px;
  box-sizing: border-box;
}
.node-model-three {
  width: 49%;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-sizing: border-box;
}
.node-title {
  font-size: 13px;
  line-height: 18px;
  max-height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  padding: 4px 0;
}
.node-info-two {
  display: flex;
  justify-content: space-between;

  .node-title {
    flex: 1;
    padding-right: 8px;
  }
}
.node-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 22px;
  border-radius: 4px;

  &.small {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }
}
.node-bottom {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #999;
  padding: 6px 8px;
}
.flex-1 {
  flex: 1;
}
.node-icon {
  display: flex;
  align-items: center;
  padding-left: 8px;

  i {
    margin-right: 2px;
  }
}
</style>
