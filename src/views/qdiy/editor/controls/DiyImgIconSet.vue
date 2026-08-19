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
              <el-image style="width: 100%; height: 100%; border-radius: 8px" :src="item.img" />
              <div class="img-replace">替换</div>
              <div class="icon-close" @click.stop="delPic(item)"><i class="el-icon-close" /></div>
            </div>
            <div v-if="suggestText" class="tips-text">{{ suggestText }}</div>
          </div>
        </div>

        <!-- 文字 -->
        <div v-if="setStyle !== 'image'" class="icon-set-items">
          <div class="icon-set-list-name">文字</div>
          <div class="icon-set-list-content">
            <el-input
              v-model="item.btnText"
              size="small"
              placeholder="请输入内容"
              maxlength="5"
              show-word-limit
              @input="changes"
            />
          </div>
        </div>

        <!-- 提示文字 -->
        <div v-if="setStyle !== 'image'" class="icon-set-items">
          <div class="icon-set-list-name">提示文字</div>
          <div class="icon-set-list-content">
            <el-input
              v-model="item.btnTips"
              size="small"
              placeholder="请输入内容"
              maxlength="6"
              show-word-limit
              @input="changes"
            />
          </div>
        </div>

        <!-- 链接 -->
        <div v-if="showLink" class="icon-set-items">
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
 * 图标 / 图片按钮组配置控件
 * 迁移自 PHP diy-img-icon-set.php
 *
 * list 项结构：
 *   { title, img, icon, is_show_tag, tags, tagsBgColor, tagsTextColor, btnText, btnTips, link_params }
 *
 * 两处依赖已换成平台端等价组件：
 *   com-attachment → @/components/base/uploadPicture
 *   com-pick-link  → 由使用方监听 pick-link 事件接入（平台端可用 @/components/linkaddress）
 *
 * 原实现中标签相关的几行在 PHP 里已被注释掉，这里不迁移，但数据结构保留了对应字段。
 */
import uploadPictures from '@/components/base/uploadPicture';
import DiyStyleContain from './DiyStyleContain';
import DiyConfirmPopup from './DiyConfirmPopup';
import DiyUrl from './DiyUrl';

export default {
  name: 'DiyImgIconSet',
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
    showLink: {
      type: Boolean,
      default: false,
    },
    // 1 图片 / 2 图标
    type: {
      type: Number,
      default: 1,
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
    // 新增项时的默认图片
    imgUrl: {
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
    closeHandle(i) {
      // 只剩一项时不允许再删
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
      // 选链接弹窗由使用方接入
      this.$emit('pick-link', index, this.iconList[index]);
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
        btnTips: '按钮提示',
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
