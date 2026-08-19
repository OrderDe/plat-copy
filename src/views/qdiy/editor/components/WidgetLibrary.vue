<template>
  <div class="widget-library">
    <div class="panel-title">
      <div class="title-copy">
        <span>组件库</span>
        <small>点击组件添加到页面</small>
      </div>
      <span class="component-total">{{ totalComponents }}</span>
    </div>
    <el-collapse v-model="activeGroups" class="group-collapse">
      <el-collapse-item v-for="group in groups" :key="group.group" :name="group.group">
        <template slot="title">
          <div class="group-title">
            <span class="group-mark" />
            <span>{{ group.title }}</span>
            <span class="group-count">{{ (group.list || []).length }}</span>
          </div>
        </template>
        <div class="widget-grid">
          <div
            v-for="item in group.list || []"
            :key="item.code"
            class="widget-item"
            :class="{ disabled: reachLimit(item) }"
            :tabindex="reachLimit(item) ? -1 : 0"
            :title="reachLimit(item) ? `${item.title}已达添加上限` : `添加${item.title}`"
            @click="handleAdd(item)"
            @keyup.enter="handleAdd(item)"
          >
            <div class="icon-shell" :class="{ 'rich-icon-shell': !item.icon && isRichIcon(item.code) }">
              <img
                v-if="item.icon && !brokenIcons[item.code]"
                :src="item.icon"
                class="icon"
                @error="handleIconError(item.code)"
              />
              <i v-else class="icon-font" :class="iconClass(item.code)" />
            </div>
            <div class="name">{{ item.title }}</div>
            <div v-if="reachLimit(item)" class="status-badge limit">已达上限</div>
            <div v-else-if="!isRegistered(item.code)" class="status-badge todo">待完善</div>
            <i v-else class="add-icon el-icon-plus" />
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import { isRegistered } from '../registry';

export default {
  name: 'WidgetLibrary',
  props: {
    // 后端返回的分组组件树
    groups: {
      type: Array,
      default: () => [],
    },
    // 画布当前已放置的组件列表，用于数量上限判断
    list: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      activeGroups: [],
      brokenIcons: {},
    };
  },
  computed: {
    totalComponents() {
      return this.groups.reduce((total, group) => total + (group.list || []).length, 0);
    },
  },
  watch: {
    groups: {
      immediate: true,
      handler(val) {
        // 默认展开全部分组
        this.activeGroups = (val || []).map((e) => e.group);
      },
    },
  },
  methods: {
    isRegistered,
    iconClass(code) {
      const iconMap = {
        nav: 't-icon-zujian-daohangzu',
        'auxiliary-blank': 't-icon-zujian-fuzhukongbai',
        'auxiliary-line': 't-icon-zujian-fuzhuxian',
        'button-group': 't-icon-zujian-xuanxiangka',
        'graphic-details': 't-icon-zujian-wenzhangliebiao',
        'img-ad': 't-icon-zujian-lunbotu',
        placard: 't-icon-zujian-xinwenbobao',
        'rubik-cube': 't-icon-zujian-tupianmofang',
        search: 't-icon-zujian-sousuokuang',
        'title-block': 't-icon-zujian-biaoti',
        video: 't-icon-zujian-shipin',
        'carousel-img': 't-icon-zujian-lunbotu',
        'order-broadcast': 't-icon-zujian-xinwenbobao',
        'img-button-group': 't-icon-zujian-zuhezujian',
        'img-ad-swiper': 't-icon-zujian-lunbotu',
        'bg-music': 't-icon-zujian-xiaochengxuzhibo',
        'order-multi-broadcast': 't-icon-zujian-xinwenbobao',
        'smart-form': 't-icon-zujian-fuwenben',
        template: 't-icon-zujian-fuwenben',
        'secondary-card': 't-icon-zujian-tupianmofang',
        'score-secondary-card': 't-icon-zujian-jifenshangcheng',
        'scroll-nav': 't-icon-zujian-daohangzu',
        'nav-location': 't-icon-zujian-shangpinfenlei',
        'member-info': 't-icon-zujian-dianpujie',
        'merchant-info': 't-icon-zujian-dianpujie',
        'commission-info': 't-icon-zujian-jifenshangcheng',
        'follow-official': 't-icon-zujian-xiaochengxuzhibo',
        position: 't-icon-zujian-shangpinfenlei',
      };
      if (iconMap[code]) return ['t-icon', iconMap[code]];
      if (/goods|commodity|mch/.test(code)) return ['t-icon', 't-icon-zujian-shangpinliebiao'];
      if (/order/.test(code)) return ['t-icon', 't-icon-zujian-xinwenbobao'];
      if (/gift|lucky|blindbox/.test(code)) return ['t-icon', 't-icon-zujian-pintuan'];
      if (/course|notes|form/.test(code)) return ['t-icon', 't-icon-zujian-fuwenben'];
      if (/car/.test(code)) return ['t-icon', 't-icon-zujian-shangpinfenlei'];
      return ['t-icon', 't-icon-zujian-zuhezujian'];
    },
    isRichIcon(code) {
      const classes = this.iconClass(code);
      return Array.isArray(classes) && classes.indexOf('t-icon') !== -1;
    },
    handleIconError(code) {
      this.$set(this.brokenIcons, code, true);
    },
    // 组件注册表的 count 字段表示页面内最多可添加数量，0 或空表示不限
    reachLimit(component) {
      const max = Number(component.count) || 0;
      if (max <= 0) return false;
      const used = this.list.filter((e) => e.identify === component.code).length;
      return used >= max;
    },
    handleAdd(component) {
      if (this.reachLimit(component)) {
        this.$message.warning(`「${component.title}」最多添加 ${component.count} 个`);
        return;
      }
      this.$emit('add', component);
    },
  },
};
</script>

<style scoped lang="scss">
.widget-library {
  width: 260px;
  flex: 0 0 260px;
  border-right: 1px solid #e8edf5;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f8fafc;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: #d8dee9;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}
.panel-title {
  min-height: 64px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #edf0f5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title-copy {
  display: flex;
  flex-direction: column;
  color: #1f2937;
  line-height: 20px;

  small {
    color: #a0a8b5;
    font-size: 11px;
    font-weight: 400;
  }
}
.component-total {
  min-width: 28px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  color: #4b78ff;
  background: #eef3ff;
  font-size: 11px;
  font-weight: 600;
  line-height: 22px;
  text-align: center;
}
.group-collapse {
  border: 0;

  ::v-deep .el-collapse-item__header {
    height: 48px;
    padding: 0 14px;
    border-bottom-color: #edf0f5;
    background: #f8fafc;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
  }
  ::v-deep .el-collapse-item__arrow {
    color: #98a2b3;
    font-weight: 600;
  }
  ::v-deep .el-collapse-item__wrap {
    border-bottom-color: #edf0f5;
    background: #f8fafc;
  }
  ::v-deep .el-collapse-item__content {
    padding-bottom: 0;
  }
}
.group-title {
  flex: 1;
  display: flex;
  align-items: center;
}
.group-mark {
  width: 4px;
  height: 14px;
  margin-right: 8px;
  border-radius: 4px;
  background: linear-gradient(180deg, #5b8cff 0%, #6d5dfc 100%);
}
.group-count {
  min-width: 20px;
  height: 18px;
  margin-left: 7px;
  padding: 0 5px;
  border-radius: 9px;
  color: #98a2b3;
  background: #edf1f7;
  font-size: 10px;
  font-weight: 500;
  line-height: 18px;
  text-align: center;
}
.widget-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 14px 18px;
}
.widget-item {
  --tone-color: #ff4d5a;
  --tone-bg: #fff0f2;
  --tone-border: #ffadb4;
  --tone-shadow: rgba(255, 77, 90, 0.22);
  min-width: 0;
  min-height: 88px;
  padding: 12px 6px 10px;
  text-align: center;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  background: #fff;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.025);
  outline: none;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  .icon-shell {
    width: 42px;
    height: 42px;
    margin: 0 auto;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--tone-color);
    background: var(--tone-bg);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &.rich-icon-shell {
      background: transparent;
      box-shadow: none;
    }
  }
  &:hover {
    z-index: 1;
    border-color: var(--tone-border);
    box-shadow: 0 8px 20px rgba(35, 66, 148, 0.12);
    transform: translateY(-2px);

    .icon-shell {
      box-shadow: 0 5px 12px var(--tone-shadow);
      transform: scale(1.05);
    }
    .icon-shell.rich-icon-shell {
      box-shadow: none;
    }
    .name {
      color: var(--tone-color);
    }
    .add-icon {
      opacity: 1;
      transform: scale(1);
    }
  }
  &:focus-visible {
    border-color: var(--tone-border);
    box-shadow: 0 0 0 3px var(--tone-bg);
  }
  &.disabled {
    cursor: not-allowed;
    opacity: 0.58;
    &:hover {
      border-color: #edf0f5;
      color: inherit;
      box-shadow: 0 2px 8px rgba(17, 24, 39, 0.025);
      transform: none;

      .icon-shell {
        box-shadow: none;
        transform: none;
      }
    }
  }
  .icon {
    width: 38px;
    height: 38px;
    object-fit: contain;
  }
  .icon-font {
    font-size: 20px;

    &.t-icon {
      width: 38px;
      height: 38px;
      font-size: 0;
      filter: hue-rotate(145deg) saturate(1.3) drop-shadow(0 3px 3px rgba(255, 77, 90, 0.13));
      transition: filter 0.2s ease, transform 0.2s ease;
    }
  }
  .name {
    margin-top: 8px;
    color: #374151;
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.2s ease;
  }
  .status-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    height: 16px;
    padding: 0 5px;
    border-radius: 8px;
    font-size: 9px;
    line-height: 16px;
  }
  .limit {
    color: #f56c6c;
    background: #fff0f0;
  }
  .todo {
    color: #d99016;
    background: #fff7e6;
  }
  .add-icon {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: #fff;
    background: var(--tone-color);
    font-size: 10px;
    line-height: 16px;
    opacity: 0;
    transform: scale(0.65);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

}
</style>
