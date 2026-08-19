<template>
  <DiyStyleContain :title="title" :show-title="showTitle" :contain-style="containStyle">
    <div v-for="(item, index) in iconList" :key="index" :style="[iconSetStyle]" @click="closePop">
      <div v-if="item.title" class="icon-set-title">{{ item.title }}</div>
      <div class="icon-set-list">
        <div v-if="showClose" class="icon-set-close" @click.stop="closeHandle(index)">
          <i class="el-icon-close" />
        </div>

        <DiyConfirmPopup
          :title="popTitle"
          :show="cardIndex === index && visible"
          confirm-text="删除"
          :show-confirm-btn="showConfirmBtn"
          @close="closePop"
          @confirm="delCards(index)"
        />

        <div v-if="item.slot">
          <slot :name="item.slot" :item="item" :index="index" />
        </div>

        <!-- 图片 / 图标 -->
        <div v-if="setStyle !== 'text'" class="icon-set-items">
          <div class="icon-set-list-name">{{ type === 1 ? '图片' : '图标' }}</div>
          <div class="icon-set-list-content">
            <div
              v-if="!item.img"
              class="content-upload"
              :style="{ width: widthImg + 'px', height: heightImg + 'px' }"
              @click="openPicker(item)"
            >
              <i class="el-icon-plus" />
            </div>
            <div
              v-else
              class="content-img"
              :style="{ width: widthImg + 'px', height: heightImg + 'px' }"
              @click="openPicker(item)"
            >
              <el-image style="width: 100%; height: 100%; border-radius: 8px" :src="imgToUrl(item.img)" />
              <div class="img-replace">替换</div>
              <div class="icon-close" @click.stop="delPic(item)"><i class="el-icon-close" /></div>
            </div>
            <div v-if="suggestText" class="tips-text">{{ suggestText }}</div>
          </div>
        </div>

        <!-- 标签相关，需要 tagSwitch 开启 -->
        <div v-if="setStyle !== 'text' && type === 1 && tagSwitch" class="icon-set-items">
          <div class="icon-set-list-name">标签</div>
          <div class="icon-set-list-content tag-row">
            <el-switch v-model="item.is_show_tag" active-color="#2D8CF0" inactive-color="#999999" @change="changes" />
            <span class="tag-switch-text">{{ item.is_show_tag ? '开启' : '关闭' }}</span>
          </div>
        </div>
        <div v-if="item.is_show_tag && setStyle !== 'text' && type === 1 && tagSwitch" class="icon-set-items">
          <div class="icon-set-list-name">标签内容</div>
          <div class="icon-set-list-content">
            <el-input v-model="item.tags" size="small" placeholder="请输入内容" maxlength="2" show-word-limit @input="changes" />
          </div>
        </div>
        <div v-if="item.is_show_tag && setStyle !== 'text' && type === 1 && tagSwitch" class="icon-set-items">
          <div class="icon-set-list-name">标签背景</div>
          <div class="icon-set-list-content">
            <el-color-picker v-model="item.tagsBgColor" :show-alpha="showAlpha" @change="changes" />
          </div>
        </div>
        <div v-if="item.is_show_tag && setStyle !== 'text' && type === 1 && tagSwitch" class="icon-set-items">
          <div class="icon-set-list-name">标签文字</div>
          <div class="icon-set-list-content">
            <el-color-picker v-model="item.tagsTextColor" :show-alpha="showAlpha" @change="changes" />
          </div>
        </div>

        <!-- 文字 -->
        <div v-if="setStyle !== 'image'" class="icon-set-items">
          <div class="icon-set-list-name">文字</div>
          <div class="icon-set-list-content">
            <el-input v-model="item.btnText" size="small" placeholder="请输入内容" maxlength="5" show-word-limit @input="changes" />
          </div>
        </div>

        <!-- 链接 / 门店链接 -->
        <div v-if="showLink || showStoreLink" class="icon-set-items">
          <div class="icon-set-list-name">链接</div>
          <div class="icon-set-list-content">
            <DiyUrl
              :text="item.link_params && (item.link_params.title || item.link_params.open_type)"
              @add="addUrl(index)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddBtn && iconList.length < maxIconLength" class="add-btns" @click="addClick">
      + 添加<span v-if="maxIconLength">{{ iconList.length }}/{{ maxIconLength }}</span>
    </div>

    <el-dialog title="选择图片" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="onPicked" />
    </el-dialog>
  </DiyStyleContain>
</template>

<script>
/**
 * 图标设置控件（带默认图标库）
 * 迁移自 PHP diy-icon-set.php
 *
 * 与 DiyImgIconSet 的差异（PHP 侧也是两个独立文件）：
 *   1. 支持标签配置（tagSwitch），DiyImgIconSet 里这几行在 PHP 中已被注释掉
 *   2. 多了 showStoreLink（门店 o2o 链接），原实现走的是另一组 defaultTabs
 *   3. 选链接后会按 route 到 defaultIconList 里反查，自动补图标与文字
 *
 * 依赖替换：
 *   com-attachment → @/components/base/uploadPicture
 *   com-pick-link  → 触发 pick-link 事件交给使用方，选完后调用 setUrl(item, urlInfo) 写回
 * 原实现的静态图前缀来自 Yii 的 @attachurl，改为 staticImgPrefix 由使用方注入。
 */
import uploadPictures from '@/components/base/uploadPicture';
import DiyStyleContain from './DiyStyleContain';
import DiyConfirmPopup from './DiyConfirmPopup';
import DiyUrl from './DiyUrl';
import { defaultIconList } from './iconSetDefaults';

export default {
  name: 'DiyIconSet',
  components: { uploadPictures, DiyStyleContain, DiyConfirmPopup, DiyUrl },
  props: {
    title: {
      type: String,
      default: '',
    },
    containStyle: {
      type: Object,
      default: () => ({}),
    },
    list: {
      type: Array,
      default: () => [],
    },
    widthImg: {
      type: Number,
      default: 50,
    },
    heightImg: {
      type: Number,
      default: 50,
    },
    showClose: {
      type: Boolean,
      default: true,
    },
    tagSwitch: {
      type: Boolean,
      default: false,
    },
    showLink: {
      type: Boolean,
      default: false,
    },
    showStoreLink: {
      type: Boolean,
      default: false,
    },
    // 1 图片 / 2 图标
    type: {
      type: Number,
      default: 1,
    },
    showAlpha: {
      type: Boolean,
      default: false,
    },
    // 1 图片+文字 / 2 仅图片 / 3 仅文字
    btnStyle: {
      type: Number,
      default: 1,
    },
    maxIconLength: {
      type: Number,
      default: 0,
    },
    showAddBtn: {
      type: Boolean,
      default: false,
    },
    suggestText: {
      type: String,
      default: '',
    },
    iconSetStyle: {
      type: Object,
      default: () => ({}),
    },
    imgUrl: {
      type: String,
      default: '',
    },
    staticImgPrefix: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      visible: false,
      cardIndex: 0,
      iconList: [],
      popTitle: '确定删除吗',
      showConfirmBtn: true,
      urlIndex: -1,
      pickerVisible: false,
      pickingItem: null,
    };
  },
  computed: {
    setStyle() {
      if (this.btnStyle === 1) return 'image_text';
      return this.btnStyle === 2 ? 'image' : 'text';
    },
    showTitle() {
      return !!this.title;
    },
  },
  watch: {
    list: {
      deep: true,
      immediate: true,
      handler(val) {
        this.iconList = val;
        this.changes();
      },
    },
  },
  methods: {
    changes() {
      this.$emit('change', this.iconList);
    },
    imgToUrl(url) {
      if (url && url.indexOf('http') === -1 && url.indexOf('resources/img') === -1) {
        return this.staticImgPrefix + url;
      }
      return url;
    },
    closeHandle(i) {
      if (this.iconList.length === 1) {
        this.popTitle = '至少保留1个';
        this.showConfirmBtn = false;
      } else {
        this.popTitle = '确定删除吗';
        this.showConfirmBtn = true;
      }
      this.cardIndex = i;
      this.visible = true;
    },
    closePop() {
      this.visible = false;
    },
    delCards(i) {
      this.visible = false;
      this.iconList.splice(i, 1);
      this.changes();
    },
    openPicker(item) {
      this.pickingItem = item;
      this.pickerVisible = true;
    },
    onPicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url && this.pickingItem) {
        this.$set(this.pickingItem, 'img', url);
        this.changes();
      }
      this.pickerVisible = false;
    },
    delPic(item) {
      this.$set(item, 'img', '');
      this.changes();
    },
    addUrl(index) {
      this.urlIndex = index;
      this.$emit('pick-link', index, this.iconList[index]);
    },
    /**
     * 供使用方选完链接后写回。
     * 沿用原实现的便利逻辑：图标或文字还是默认值时，按 route 从默认图标库反查补齐。
     */
    setUrl(item, urlInfo) {
      if (!item || !urlInfo) return;
      const isDefaultImg = !item.img || item.img.indexOf('user_fun_chat.png') !== -1;
      if (isDefaultImg || item.btnText === '按钮文字') {
        const route = urlInfo.params && urlInfo.params.route;
        const found = defaultIconList.find((e) => e.route === route);
        if (found) {
          if (isDefaultImg) this.$set(item, 'img', found.img);
          if (item.btnText === '按钮文字') this.$set(item, 'btnText', found.title);
        }
      }
      this.$set(item, 'link_params', urlInfo);
      this.changes();
    },
    addClick() {
      if (this.iconList.length >= this.maxIconLength) return;
      this.iconList.push({
        img: this.imgUrl,
        icon: 'el-icon-setting',
        is_show_tag: false,
        tags: '热门',
        tagsBgColor: '#f83287',
        tagsTextColor: '#ffffff',
        btnText: '按钮文字',
        link_params: null,
      });
      this.changes();
    },
  },
};
</script>

<style scoped lang="scss">
.icon-set-list {
  position: relative;
  border-radius: 8px;
  background-color: #f4f3f7;
  padding: 15px 30px 15px 12px;
  margin-bottom: 20px;
  &:hover .icon-set-close {
    display: flex;
  }
}
.icon-set-title {
  line-height: 1;
  color: #47565d;
  font-weight: bolder;
  margin-bottom: 20px;
}
.icon-set-close {
  display: none;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 10px;
  right: 0;
  width: 30px;
  height: 30px;
  color: #999;
  cursor: pointer;
  z-index: 2;
}
.icon-set-items {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
}
.icon-set-list-name {
  width: 60px;
  text-align: right;
  padding-right: 8px;
  margin-right: 15px;
  color: #999;
  flex-shrink: 0;
}
.icon-set-list-content {
  flex: 1;
}
.tag-row {
  display: flex;
  align-items: center;
}
.tag-switch-text {
  padding-left: 7px;
  font-weight: 500;
  color: #999;
}
.content-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  background-color: #e3e3e3;
  color: #fff;
}
.content-img {
  position: relative;
  border-radius: 8px;
  cursor: pointer;
  &:hover .icon-close,
  &:hover .img-replace {
    display: block;
  }
}
.icon-close {
  display: none;
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  text-align: center;
}
.img-replace {
  display: none;
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  text-align: center;
  font-size: 12px;
  padding: 2px 0;
}
.tips-text {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
}
.add-btns {
  border: 1px dashed #707070;
  line-height: 32px;
  height: 34px;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  color: #999;
}
</style>
