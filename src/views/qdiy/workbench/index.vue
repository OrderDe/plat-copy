<template>
  <div class="divBox qdiy-workbench">
    <!--
      装修入口原本是六个平级菜单，每个点进去交互还都不一样，
      用的人很难建立「App 哪些地方能装修、现在生效的是哪套」的整体印象。
      这里做一个总览：一屏列出所有可装修的位置 + 各自的机制和状态。
    -->
    <el-card class="box-card mb14" shadow="never" :bordered="false">
      <div class="wb-intro">
        <div class="wb-intro-title">App 里可以装修的位置都在这里</div>
        <div class="wb-intro-body">
          不同位置的装修方式不一样，这不是设计不统一，是页面本身的结构决定的：
          <b>自由页面</b>整页都能拖；<b>固定槽位页</b>的主体（分类树、购物车列表）是写死的功能区，
          只能在它上下加内容；<b>开关式</b>的页面结构固定，只能控制显示哪些区块。
        </div>
      </div>
    </el-card>

    <el-card
      v-for="group in groups"
      :key="group.name"
      class="box-card mb14"
      shadow="never"
      :bordered="false"
    >
      <div class="wb-group-title">{{ group.name }}</div>
      <div class="wb-group-tip">{{ group.tip }}</div>

      <div class="wb-grid">
        <div
          v-for="entry in group.entries"
          :key="entry.path"
          class="wb-card"
          @click="go(entry)"
        >
          <div class="wb-card-head">
            <i :class="['wb-icon', entry.icon]" />
            <span class="wb-card-title">{{ entry.title }}</span>
            <el-tag v-if="statusOf(entry)" :type="statusOf(entry).type" size="mini">
              {{ statusOf(entry).text }}
            </el-tag>
          </div>
          <div class="wb-card-desc">{{ entry.desc }}</div>
          <div class="wb-card-foot">
            <span class="wb-card-mode">{{ entry.mode }}</span>
            <span class="wb-card-go">进入 <i class="el-icon-arrow-right" /></span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
/**
 * 装修工作台 —— 所有装修入口的总览页
 *
 * 只做导航和状态展示，不改动任何已有页面的实现：各入口点进去还是原来那些页面。
 * 商品分类 / 购物车有独立的装修总开关（关掉后 App 回到原生样式），
 * 这个状态最容易被忘掉——配了一堆东西却没生效——所以在卡片上直接标出来。
 */
import { qdiyTemplateEnableInfoApi } from '@/api/qdiy';

export default {
  name: 'QDiyWorkbench',
  data() {
    return {
      // template -> true/false，仅固定槽位页有
      enableMap: {},
      groups: [
        {
          name: '页面',
          tip: 'App 各个页面的装修内容',
          entries: [
            {
              title: '页面装修',
              path: '/qdiy/page',
              icon: 'el-icon-files',
              mode: '自由页面 · 整页可拖拽',
              desc: '首页和自建页面，可以新建多个页面、整页自由拖拽组件，其中一个标记为首页。',
            },
            {
              title: '商品分类',
              path: '/qdiy/goods-cate',
              template: 'goods_cate',
              icon: 'el-icon-menu',
              mode: '固定槽位 · 主体上下可加内容',
              desc: '分类树和商品列表是固定的，装修内容加在它的上下两侧。可配多套方案，只有「生效中」的那套会用。',
            },
            {
              title: '购物车',
              path: '/qdiy/shopping-cart',
              template: 'shopping_cart',
              icon: 'el-icon-shopping-cart-2',
              mode: '固定槽位 · 主体上下可加内容',
              desc: '购物车列表和结算栏是固定的，装修内容加在它的上下两侧。同样可配多套方案。',
            },
            {
              title: '个人中心',
              path: '/qdiy/usercenter',
              icon: 'el-icon-user',
              mode: '开关式 · 控制显示哪些区块',
              desc: '头像区、资产行、订单入口这些位置是固定结构，配置的是显示哪些区块和入口、以及顶部配色。',
            },
          ],
        },
        {
          name: '全局',
          tip: '影响所有页面的设置',
          entries: [
            {
              title: '底部导航',
              path: '/qdiy/bottomnav',
              icon: 'el-icon-s-grid',
              mode: '开关式 · 图标与跳转',
              desc: 'App 底部那排 tab 的图标、文字和跳转目标，可恢复默认。',
            },
            {
              title: '全局配置',
              path: '/qdiy/setting',
              icon: 'el-icon-setting',
              mode: '开关式 · 主题与全局样式',
              desc: '主题色等全局样式，所有装修页面都会跟着变。',
            },
          ],
        },
        {
          name: '素材与模板',
          tip: '装修时用到的资源，不直接影响 App 显示',
          entries: [
            {
              title: '海报列表',
              path: '/qdiy/poster',
              icon: 'el-icon-picture',
              mode: '资源',
              desc: '分享海报的样式配置。',
            },
            {
              title: '素材管理',
              path: '/qdiy/material',
              icon: 'el-icon-folder-opened',
              mode: '资源',
              desc: '装修用到的图片素材。',
            },
            {
              title: '我的模板',
              path: '/qdiy/mytemplate',
              icon: 'el-icon-collection',
              mode: '资源',
              desc: '保存下来的装修方案，可以套用到其他页面。',
            },
            {
              title: '模板市场',
              path: '/qdiy/market',
              icon: 'el-icon-shopping-bag-2',
              mode: '资源',
              desc: '平台维护的公共模板，商户可以直接取用。',
            },
          ],
        },
      ],
    };
  },
  created() {
    this.loadEnableStatus();
  },
  methods: {
    /** 拉固定槽位页的装修总开关。取不到就不显示状态，不影响进入 */
    loadEnableStatus() {
      const templates = [];
      this.groups.forEach((g) => g.entries.forEach((e) => e.template && templates.push(e.template)));
      templates.forEach((t) => {
        qdiyTemplateEnableInfoApi(t)
          .then((res) => {
            this.$set(this.enableMap, t, res === true || res === 'true');
          })
          .catch(() => {});
      });
    },
    statusOf(entry) {
      if (!entry.template) return null;
      const val = this.enableMap[entry.template];
      if (val === undefined) return null;
      return val
        ? { type: 'success', text: '已启用' }
        : { type: 'info', text: '未启用' };
    },
    go(entry) {
      this.$router.push(entry.path);
    },
  },
};
</script>

<style scoped lang="scss">
.wb-intro-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}
.wb-intro-body {
  font-size: 13px;
  line-height: 22px;
  color: #5c6b75;
}

.wb-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.wb-group-tip {
  margin: 4px 0 14px;
  font-size: 12px;
  color: #909399;
}

.wb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.wb-card {
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.12);
    transform: translateY(-1px);
  }
}
.wb-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wb-icon {
  font-size: 16px;
  color: #409eff;
}
.wb-card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.wb-card-desc {
  margin: 8px 0 12px;
  font-size: 12px;
  line-height: 20px;
  color: #86909c;
  min-height: 40px;
}
.wb-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}
.wb-card-mode {
  color: #c0c4cc;
}
.wb-card-go {
  color: #409eff;
}
</style>
