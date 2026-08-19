<template>
  <div>
    <div class="headers-box">
      <div
        v-if="activeItem && activeItem.funcListItem"
        class="header-tab-lists"
        :class="{ activeName: current === 0 }"
        @click="current = 0"
      >
        <div class="header-tab-img"><i class="el-icon-setting" /></div>
        <div class="header-tab-title">{{ activeItem.funcListItem.title }}</div>
      </div>
      <div
        v-if="activeItem && activeItem.is_show_permission"
        class="header-tab-lists"
        :class="{ activeName: current === 1 }"
        @click="current = 1"
      >
        <div class="header-tab-img"><i class="el-icon-lock" /></div>
        <div class="header-tab-title">权限</div>
      </div>
    </div>

    <div v-if="current === 0">
      <slot />
    </div>
    <div v-else>
      <DiyStyleContain :show-title="false">
        <div v-for="(item, index) in permission" :key="index" class="func-box">
          <div class="func-title">{{ item.title }}</div>
          <div v-if="item.list && item.list.length" class="func-checkbox-boxs">
            <el-checkbox
              v-for="(it, i) in item.list"
              :key="i"
              v-model="it.checked"
              class="func-checkbox-item"
              @change="funcChange($event, it)"
            >
              {{ it.name }}
            </el-checkbox>
          </div>
        </div>
      </DiyStyleContain>
    </div>
  </div>
</template>

<script>
/**
 * 属性面板头部 —— 在「配置」与「权限」两个 tab 间切换
 * 迁移自 PHP diy-header.php
 *
 * 原实现的 tab 图标来自 resources/img/decorate/ 下的 png，Java 平台端没有这批资源，
 * 改用 Element 图标。权限勾选逻辑与原实现一致：
 * 已有 permission 时按 name + level 与 allPermission 对齐，否则全选并回抛一次初始值。
 */
import DiyStyleContain from './DiyStyleContain';
import { deepClone, getObjValue } from './utils';

export default {
  name: 'DiyHeader',
  components: { DiyStyleContain },
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
    allPermission: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      current: 0,
      permission: [],
    };
  },
  created() {
    const has = this.activeItem && this.activeItem.permission && this.activeItem.permission.length;
    if (has) {
      // 有初始值：按 name + level 对齐已存的勾选状态，不回抛
      const newList = deepClone(this.allPermission);
      const oldList = deepClone(this.activeItem.permission);
      this.permission = this.setChecked(
        newList.map((item, index) =>
          Object.assign(item, {
            list: item.list.map((item1, index1) => {
              let checked = true;
              const it = getObjValue(oldList, [index]);
              const it1 = getObjValue(oldList, [index, 'list', index1]);
              if (it1 && it && it.name === item.name && it1.level === item1.level) {
                checked = it1.checked;
              }
              return Object.assign(item1, { checked });
            }),
          }),
        ),
      );
    } else {
      // 初始化：默认全选，并回抛一次，只会走这一次
      this.permission = deepClone(this.setChecked(this.allPermission));
      if (this.activeItem) {
        this.$emit('permis-change', this.permission);
      }
    }
  },
  methods: {
    setChecked(list) {
      return list.map((item) =>
        Object.assign(item, {
          list: item.list.map((item1) => Object.assign({ checked: true }, item1)),
        }),
      );
    },
    funcChange(e, it) {
      it.checked = e;
      this.$emit('permis-change', this.permission);
    },
  },
};
</script>

<style scoped lang="scss">
.headers-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 53px;
  padding: 0 20px;
}
.header-tab-lists {
  display: flex;
  align-items: center;
  width: 50%;
  cursor: pointer;
}
.header-tab-title {
  font-size: 14px;
  font-weight: 700;
  color: #999;
}
.activeName .header-tab-title,
.activeName .header-tab-img i {
  color: #409eff;
}
.header-tab-img {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 53px;
  i {
    font-size: 18px;
    color: #999;
  }
}
.func-box {
  padding-bottom: 20px;
}
.func-title {
  font-size: 14px;
  color: #999;
  font-weight: 700;
  padding-bottom: 15px;
}
.func-checkbox-item {
  padding-bottom: 13px;
}
</style>
