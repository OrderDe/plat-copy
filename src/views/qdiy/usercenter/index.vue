<template>
  <div class="divBox">
    <!--
      个人中心的装修总开关：关掉后 App 的个人中心回到原本写死的样式，
      下面配的内容不会生效但也不会丢。和购物车装修那个开关是同一套机制。
    -->
    <el-card class="box-card mb14" shadow="never" :bordered="false">
      <div class="qdiy-switch">
        <span class="qdiy-switch__label">启用个人中心装修</span>
        <el-switch v-model="enabled" :disabled="enableLoading" @change="handleEnableChange" />
        <span class="qdiy-switch__tip">
          {{
            enabled
              ? 'App 的个人中心会按下面配置的内容渲染'
              : '已关闭，App 的个人中心使用原来的样式，下面配置的内容不会生效'
          }}
        </span>
      </div>
    </el-card>

    <el-card v-loading="loading" class="box-card" shadow="never" :bordered="false">
      <div class="uc-wrap">
        <!-- 左：实时预览 -->
        <div class="uc-preview">
          <div class="phone">
            <div class="phone-head" :style="{ background: headerBackground }">
              <div class="user-row">
                <div class="avatar" />
                <div class="user-info">
                  <div class="nickname">淘街用户</div>
                  <div v-if="config.header.showLevel" class="level">普通用户 · 开通会员享会员价</div>
                </div>
                <div v-if="config.header.showLevel" class="vip-btn">开通会员</div>
              </div>
              <div v-if="config.header.showAsset" class="asset-row">
                <div v-for="asset in enabledAssets" :key="asset.key" class="asset-item">
                  <div class="asset-num">0.00</div>
                  <div class="asset-name">{{ asset.name }}</div>
                </div>
                <div v-if="!enabledAssets.length" class="asset-empty">资产项已全部关闭</div>
              </div>
            </div>

            <div class="phone-body">
              <div v-for="section in enabledSections" :key="section.key" class="p-section">
                <div class="p-section-title">{{ section.title }}</div>
                <div class="p-grid">
                  <div v-for="item in enabledItems(section)" :key="item.key" class="p-item">
                    <img v-if="item.icon" :src="item.icon" class="p-icon-img" />
                    <i v-else class="p-icon" :class="item.iconClass" :style="{ color: item.color }" />
                    <div class="p-name">{{ item.name }}</div>
                  </div>
                </div>
              </div>
              <div v-if="!enabledSections.length" class="p-empty">所有区块都关闭了，个人中心会是空白页</div>
            </div>
          </div>
        </div>

        <!-- 右：配置项 -->
        <div class="uc-config">
          <div class="cfg-block">
            <div class="cfg-title">头部资产</div>
            <div class="cfg-row">
              <span class="cfg-label">背景</span>
              <el-radio-group v-model="config.header.bgMode" size="mini">
                <el-radio-button label="theme">跟随主题色</el-radio-button>
                <el-radio-button label="solid">纯色</el-radio-button>
                <el-radio-button label="linear">渐变</el-radio-button>
              </el-radio-group>
            </div>
            <div v-if="config.header.bgMode === 'theme'" class="cfg-hint">
              当前主题色 <i class="color-dot" :style="{ background: themeColor }" />{{ themeColor }}，
              在「全局配置」里修改，全站统一。
            </div>
            <div v-else class="cfg-row cfg-row--color">
              <span class="cfg-label">{{ config.header.bgMode === 'linear' ? '起始色' : '颜色' }}</span>
              <el-color-picker v-model="config.header.bgColor" color-format="hex" :predefine="predefineColors" />
              <template v-if="config.header.bgMode === 'linear'">
                <span class="cfg-label">结束色</span>
                <el-color-picker v-model="config.header.bgColorEnd" color-format="hex" :predefine="predefineColors" />
                <span class="cfg-label">角度</span>
                <el-input-number
                  v-model="config.header.bgAngle"
                  :min="0"
                  :max="360"
                  :step="15"
                  size="mini"
                  controls-position="right"
                  class="angle-input"
                />
              </template>
              <el-button type="text" @click="resetHeaderBg">恢复默认</el-button>
            </div>
            <div class="cfg-row">
              <el-checkbox v-model="config.header.showLevel">显示会员等级与开通入口</el-checkbox>
            </div>
            <div class="cfg-row">
              <el-checkbox v-model="config.header.showAsset">显示资产数据</el-checkbox>
            </div>
            <div v-if="config.header.showAsset" class="cfg-assets">
              <el-checkbox v-for="asset in config.header.assets" :key="asset.key" v-model="asset.enable">
                {{ asset.name }}
              </el-checkbox>
            </div>
          </div>

          <draggable v-model="config.sections" :options="{ animation: 200, handle: '.cfg-section-drag' }">
          <div v-for="section in config.sections" :key="section.key" class="cfg-block">
            <div class="cfg-title">
              <span class="cfg-title-left">
                <i class="el-icon-rank cfg-section-drag" title="拖动排序区块" />
                <el-checkbox v-model="section.enable" />
                <el-input v-model="section.title" size="mini" class="cfg-section-name" maxlength="10" />
              </span>
              <span class="cfg-title-right">
                <span class="cfg-count">{{ enabledItems(section).length }}/{{ section.items.length }}</span>
                <el-button type="text" size="mini" class="cfg-del" @click="removeSection(section)">删除区块</el-button>
              </span>
            </div>
            <draggable v-model="section.items" :options="{ animation: 200, handle: '.cfg-drag' }">
              <div v-for="item in section.items" :key="item.key" class="cfg-item" :class="{ off: !section.enable }">
                <i class="el-icon-rank cfg-drag" title="拖动排序" />
                <el-checkbox v-model="item.enable" :disabled="!section.enable" />
                <el-input v-model="item.name" size="mini" class="cfg-name" maxlength="8" placeholder="名称" />
                <div class="cfg-link" :title="item.link">
                  <el-button type="text" size="mini" @click="openLinkPicker(item)">
                    <i class="el-icon-link" />
                    {{ item.linkName || item.link || '选择链接' }}
                  </el-button>
                </div>
                <div class="cfg-item-ops">
                  <img v-if="item.icon" :src="item.icon" class="cfg-icon" />
                  <i v-else class="cfg-icon-def" :class="item.iconClass" :style="{ color: item.color }" />
                  <el-button type="text" size="mini" @click="openPicker(item)">换图</el-button>
                  <el-button type="text" size="mini" :disabled="!item.icon" @click="resetIcon(item)">默认图</el-button>
                  <el-button type="text" size="mini" class="cfg-del" @click="removeItem(section, item)">删除</el-button>
                </div>
              </div>
            </draggable>
            <div class="cfg-add" @click="addItem(section)"><i class="el-icon-plus" /> 新增功能项</div>
          </div>
          </draggable>

          <div class="cfg-add cfg-add-section" @click="addSection"><i class="el-icon-plus" /> 新增区块</div>
        </div>
      </div>

      <div class="mt20">
        <el-button
          v-hasPermi="['platform:qdiy:setting:save']"
          type="primary"
          size="small"
          :loading="submitLoading"
          @click="handleSave"
        >
          保存
        </el-button>
        <el-button size="small" @click="restoreDefault">全部恢复默认</el-button>
      </div>
    </el-card>

    <el-dialog title="选择图标" :visible.sync="pickerVisible" width="960px" :close-on-click-modal="false">
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="handleGetImage" />
    </el-dialog>

    <linkaddress ref="linkPicker" :is-hot-spot="true" @linkUrl="handleLinkPicked" />
  </div>
</template>

<script>
/**
 * 个人中心装修配置
 *
 * 整份配置以 JSON 存进 qdiy_setting（group=user_center，key=config），
 * 后端已有的通用键值接口够用，不需要新建表或新接口。
 */
import draggable from 'vuedraggable';
import uploadPictures from '@/components/base/uploadPicture';
import linkaddress from '@/components/linkaddress';
import {
  qdiySettingInfoApi,
  qdiySettingSaveApi,
  qdiyTemplateEnableInfoApi,
  qdiyTemplateEnableSaveApi,
} from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';
import { buildDefaultConfig } from './defaults';

const GROUP = 'user_center';

export default {
  name: 'QDiyUserCenter',
  components: { draggable, uploadPictures, linkaddress },
  data() {
    return {
      loading: false,
      submitLoading: false,
      enabled: true,
      enableLoading: false,
      pickerVisible: false,
      pickingItem: null,
      linkingItem: null,
      themeColor: '#F54B4A',
      // 与「全局配置」的四套预设主题保持一致，省得两处色板对不上
      predefineColors: ['#F54B4A', '#FF8A3D', '#4985E9', '#36C6D3', '#AA4DF1', '#F178B6', '#1EB83D', '#303133'],
      config: buildDefaultConfig(),
    };
  },
  computed: {
    enabledSections() {
      return this.config.sections.filter((s) => s.enable && this.enabledItems(s).length);
    },
    enabledAssets() {
      return this.config.header.assets.filter((a) => a.enable);
    },
    /**
     * 头部背景。theme 模式回落到全局主题色，保证没配过的老数据表现不变；
     * 移动端渲染时用同样的规则，两边口径要一致。
     */
    headerBackground() {
      const h = this.config.header || {};
      if (h.bgMode === 'solid') return h.bgColor || this.themeColor;
      if (h.bgMode === 'linear') {
        const from = h.bgColor || this.themeColor;
        const to = h.bgColorEnd || from;
        const angle = h.bgAngle == null ? 135 : h.bgAngle;
        return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
      }
      return this.themeColor;
    },
  },
  mounted() {
    if (!checkPermi(['platform:qdiy:setting:info'])) return;
    this.getConfig();
    this.getThemeColor();
    this.getEnabled();
  },
  methods: {
    getEnabled() {
      qdiyTemplateEnableInfoApi(GROUP)
        .then((res) => {
          this.enabled = res === true || res === 'true';
        })
        .catch(() => {});
    },
    handleEnableChange(val) {
      this.enableLoading = true;
      qdiyTemplateEnableSaveApi(GROUP, val)
        .then(() => {
          this.$message.success(val ? '已启用个人中心装修' : '已关闭，个人中心恢复原样式');
        })
        .catch(() => {
          // 保存失败要把开关拨回去，否则界面显示的和实际生效的不一致
          this.enabled = !val;
        })
        .finally(() => {
          this.enableLoading = false;
        });
    },
    enabledItems(section) {
      return section.items.filter((i) => i.enable);
    },
    /** 预览跟着全局配置的主题色走，省得两处各看各的 */
    getThemeColor() {
      qdiySettingInfoApi({ group: 'global' }).then((res) => {
        if (res && res.globalTextColor) this.themeColor = res.globalTextColor;
      });
    },
    getConfig() {
      this.loading = true;
      qdiySettingInfoApi({ group: GROUP })
        .then((res) => {
          const raw = res && res.config;
          if (raw) this.config = this.mergeConfig(raw);
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    /**
     * 已保存的配置就是完整状态：项可以增删改排序，所以要原样吃下来，
     * 不能再拿默认清单去补项 —— 否则运营删掉的功能项下次打开又会冒出来。
     * 默认清单只在「某项缺了展示属性」和「整段配置读不出来」时兜底。
     */
    mergeConfig(raw) {
      let saved;
      try {
        saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        this.$message.warning('个人中心配置解析失败，已按默认配置打开');
        return buildDefaultConfig();
      }
      const base = buildDefaultConfig();
      if (!saved || !Array.isArray(saved.sections) || !saved.sections.length) return base;

      // 默认项按 key 索引，用来补 iconClass / color 这类历史数据里可能没存的展示属性
      const defaultItems = {};
      base.sections.forEach((s) => s.items.forEach((i) => (defaultItems[i.key] = i)));

      const header = saved.header || {};
      const config = {
        header: {
          // 老数据没有这几个字段，回落到 theme 模式 = 保持改动前的表现
          bgMode: header.bgMode || base.header.bgMode,
          bgColor: header.bgColor || base.header.bgColor,
          bgColorEnd: header.bgColorEnd || base.header.bgColorEnd,
          bgAngle: header.bgAngle == null ? base.header.bgAngle : header.bgAngle,
          showAsset: header.showAsset !== false,
          showLevel: header.showLevel !== false,
          assets: (header.assets && header.assets.length ? header.assets : base.header.assets).map((a) => ({
            ...a,
            enable: a.enable !== false,
          })),
        },
        sections: saved.sections.map((section) => ({
          key: section.key,
          title: section.title || '',
          enable: section.enable !== false,
          items: (section.items || []).map((item) => {
            const def = defaultItems[item.key] || {};
            return {
              key: item.key,
              name: item.name || def.name || '',
              iconClass: item.iconClass || def.iconClass || 'el-icon-menu',
              color: item.color || def.color || '#909399',
              link: item.link || '',
              linkName: item.linkName || '',
              icon: item.icon || '',
              enable: item.enable !== false,
              custom: !!item.custom,
            };
          }),
        })),
      };
      return config;
    },
    /** 调花了想退回来时用，不影响其他配置项 */
    resetHeaderBg() {
      const def = buildDefaultConfig().header;
      this.$set(this.config.header, 'bgColor', def.bgColor);
      this.$set(this.config.header, 'bgColorEnd', def.bgColorEnd);
      this.$set(this.config.header, 'bgAngle', def.bgAngle);
    },
    openPicker(item) {
      this.pickingItem = item;
      this.pickerVisible = true;
    },
    handleGetImage(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url && this.pickingItem) this.$set(this.pickingItem, 'icon', url);
      this.pickerVisible = false;
      this.pickingItem = null;
    },
    resetIcon(item) {
      this.$set(item, 'icon', '');
    },
    openLinkPicker(item) {
      this.linkingItem = item;
      this.$refs.linkPicker.dialogVisible = true;
    },
    handleLinkPicked(url, title) {
      if (!url || !this.linkingItem) return;
      this.$set(this.linkingItem, 'link', url);
      this.$set(this.linkingItem, 'linkName', title || url);
      this.linkingItem = null;
    },
    addSection() {
      this.config.sections.push({
        key: `custom_section_${Date.now()}`,
        title: '新区块',
        enable: true,
        // 空区块在预览里不显示，直接给一项省得看不到效果
        items: [
          {
            key: `custom_${Date.now()}`,
            name: '新功能',
            iconClass: 'el-icon-menu',
            color: '#909399',
            link: '',
            linkName: '',
            icon: '',
            enable: true,
            custom: true,
          },
        ],
      });
    },
    removeSection(section) {
      this.$confirm(`确定删除区块「${section.title}」吗？该区块下的功能项会一起删掉。`, '提示', { type: 'warning' })
        .then(() => {
          const index = this.config.sections.indexOf(section);
          if (index > -1) this.config.sections.splice(index, 1);
        })
        .catch(() => {});
    },
    addItem(section) {
      section.items.push({
        // 自定义项的 key 要唯一且稳定，保存后还要能按 key 合并回来
        key: `custom_${Date.now()}`,
        name: '新功能',
        iconClass: 'el-icon-menu',
        color: '#909399',
        link: '',
        linkName: '',
        icon: '',
        enable: true,
        custom: true,
      });
    },
    removeItem(section, item) {
      this.$confirm(`确定删除「${item.name}」吗？`, '提示', { type: 'warning' })
        .then(() => {
          const index = section.items.indexOf(item);
          if (index > -1) section.items.splice(index, 1);
        })
        .catch(() => {});
    },
    restoreDefault() {
      this.$confirm('确定把个人中心恢复成默认配置吗？', '提示', { type: 'warning' })
        .then(() => {
          this.config = buildDefaultConfig();
          this.$message.info('已恢复默认，点击保存后生效');
        })
        .catch(() => {});
    },
    handleSave() {
      this.submitLoading = true;
      qdiySettingSaveApi({ group: GROUP, values: { config: JSON.stringify(this.config) } })
        .then(() => {
          this.submitLoading = false;
          this.$message.success('保存成功');
        })
        .catch(() => {
          this.submitLoading = false;
        });
    },
  },
};
</script>

<style scoped lang="scss">
.mb14 {
  margin-bottom: 14px;
}
.qdiy-switch {
  display: flex;
  align-items: center;

  &__label {
    margin-right: 12px;
    font-size: 14px;
    color: #303133;
  }

  &__tip {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}
.uc-wrap {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.uc-preview {
  flex: none;
}
.phone {
  width: 375px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
}
.phone-head {
  padding: 16px 14px;
  color: #fff;
}
.user-row {
  display: flex;
  align-items: center;
}
.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  margin-right: 10px;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.nickname {
  font-size: 15px;
  font-weight: 600;
}
.level {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}
.vip-btn {
  flex: none;
  font-size: 12px;
  background: #fff;
  color: #8a5a00;
  border-radius: 999px;
  padding: 4px 12px;
}
.asset-row {
  display: flex;
  margin-top: 14px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  padding: 10px 0;
}
.asset-item {
  flex: 1;
  text-align: center;
}
.asset-num {
  font-size: 15px;
  font-weight: 600;
}
.asset-name {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
}
.asset-empty {
  flex: 1;
  text-align: center;
  font-size: 12px;
  opacity: 0.85;
}
.phone-body {
  padding: 10px;
}
.p-section {
  background: #fff;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}
.p-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.p-grid {
  display: flex;
  flex-wrap: wrap;
}
.p-item {
  width: 25%;
  text-align: center;
  margin-bottom: 10px;
}
.p-icon {
  font-size: 22px;
}
.p-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.p-name {
  font-size: 11px;
  color: #606266;
  margin-top: 4px;
}
.p-empty {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  padding: 40px 0;
}

.uc-config {
  flex: 1;
  min-width: 0;
  max-height: 720px;
  overflow-y: auto;
}
.cfg-block {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
.cfg-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cfg-count {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
.cfg-row {
  margin-bottom: 6px;
}
.cfg-row--color {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.cfg-label {
  margin-right: 4px;
  font-size: 13px;
  color: #606266;
}
.cfg-hint {
  margin-bottom: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: #909399;
}
.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin: 0 4px -1px 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}
.angle-input {
  width: 96px;
}
.cfg-assets {
  padding-left: 24px;
  ::v-deep .el-checkbox {
    margin-right: 16px;
  }
}
.cfg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-top: 1px dashed #f2f2f2;
  &.off {
    opacity: 0.5;
  }
}
.cfg-drag {
  color: #c0c4cc;
  cursor: move;
  flex: none;
}
.cfg-name {
  width: 90px;
  flex: none;
}
.cfg-section-name {
  width: 110px;
  margin-left: 6px;
}
.cfg-title-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cfg-title-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cfg-section-drag {
  color: #c0c4cc;
  cursor: move;
}
.cfg-add-section {
  border-color: #a3cdf7;
  font-size: 13px;
  padding: 8px 0;
}
// 链接名长短不一，让它占掉中间的富余宽度并省略，右侧按钮才不会被挤出去
.cfg-link {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.cfg-item-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}
.cfg-del {
  color: #f56c6c;
}
.cfg-add {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: #409eff;
  border: 1px dashed #c6e2ff;
  border-radius: 4px;
  padding: 5px 0;
  cursor: pointer;
}
.cfg-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}
.cfg-icon-def {
  font-size: 18px;
}
.mt20 {
  margin-top: 20px;
}
</style>
