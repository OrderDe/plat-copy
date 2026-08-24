<template>
  <DiyStyleContain
    class="diy-img-setting"
    :title="topName"
    :show-title="showTitle"
    :contain-style="imgContainStyle"
    :style="{ 'border-top': showTitle ? '' : 'none' }"
  >
    <div v-if="suggestSite == 1 && suggestSizeText" class="suggest">{{ suggestSizeText }}</div>

    <div class="diy-img-models">
      <div
        v-for="(item, index) in newImgInfos"
        :key="index"
        class="diy-img-model"
        :style="{ marginBottom: '10px', padding: showHotZone ? '0' : '' }"
        @mouseover="selModelIndex = index"
        @mouseleave="selModelIndex = -1"
      >
        <div class="model-row">
          <div :style="{ width: showHotZone ? '100%' : '' }">
            <div
              v-if="!item.imgUrl || !item.imgUrl.length"
              class="card-upload img-upload-bor"
              :style="{ width: showHotZone ? '' : imgPopSize[0] + 'px', height: showHotZone ? '' : imgPopSize[1] + 'px' }"
              @click="openPicker(index)"
            >
              <i class="el-icon-plus" />
            </div>
            <div
              v-else
              class="diy-sty-img"
              :class="{ 'diy-img-hot-zone': showHotZone }"
              :style="{ width: showHotZone ? '' : imgPopSize[0] + 'px', height: showHotZone ? '' : imgPopSize[1] + 'px' }"
              @mouseover="selImgIndex = index"
              @mouseleave="selImgIndex = -1"
              @click="handleImageClick(index)"
            >
              <el-image class="diy-sty-img-u" :src="item.imgUrl" />
              <div v-show="!showHotZone && index === selImgIndex" class="diy-upd-img">替换</div>
              <i
                v-show="!showHotZone && index === selImgIndex"
                class="el-icon-close diy-upd-icon"
                @click.stop="delImg(index)"
              />
              <div v-if="showHotZone" class="img-hot-model" @click.stop="updatedHotZone(index)">
                <div
                  v-for="(hot, hotIndex) in item.hotZone"
                  :key="hotIndex"
                  class="img-hot-zone-model"
                  :style="{
                    height: hot.heightPer * 100 + '%',
                    width: hot.widthPer * 100 + '%',
                    left: hot.leftPer * 100 + '%',
                    top: hot.topPer * 100 + '%',
                  }"
                >
                  {{ hot.urlName || '暂无链接' }}
                </div>
              </div>
              <div v-if="showHotZone" class="hot-zone-actions">
                <button type="button" class="hot-zone-action" title="更换图片" @mousedown.stop @click.stop="openPicker(index)">
                  <i class="el-icon-picture-outline" />
                  <span>替换图片</span>
                </button>
                <button
                  type="button"
                  class="hot-zone-action hot-zone-action-primary"
                  title="编辑图片热区"
                  @mousedown.stop
                  @click.stop="updatedHotZone(index)"
                >
                  <i class="el-icon-edit-outline" />
                  <span>编辑热区</span>
                </button>
              </div>
            </div>
          </div>

          <DiyUrl v-if="showUrl" :text="item.urlName" style="margin-left: 10px" @add="addUrl(index)" />

          <!-- 小程序跳转参数 -->
          <div v-if="showInput" class="applet-inputs">
            <div class="applet-row">
              <div class="applet-label">小程序原始ID：</div>
              <el-input
                v-model="item.app_appid"
                placeholder="请输入小程序原始ID"
                maxlength="50"
                size="small"
                show-word-limit
                @input="changImg"
              />
            </div>
            <div class="applet-row">
              <div class="applet-label">小程序AppID：</div>
              <el-input
                v-model="item.wx_appid"
                placeholder="请输入小程序AppID"
                maxlength="50"
                size="small"
                show-word-limit
                @input="changImg"
              />
            </div>
            <div class="applet-row">
              <div class="applet-label">小程序路径：</div>
              <el-input
                v-model="item.wx_url"
                placeholder="请输入小程序路径"
                maxlength="50"
                size="small"
                show-word-limit
                @input="changImg"
              />
            </div>
          </div>

          <div v-show="newImgInfos.length > 1 && (selModelIndex === index || item.visible)" class="diy-img-del-model">
            <el-popover v-model="item.visible" placement="bottom" width="120">
              <p class="diy-del-text">确定删除吗？</p>
              <div class="popover-btns">
                <el-button class="diy-del-btn" size="mini" plain @click="delModel(index)">删除</el-button>
                <el-button size="mini" plain @click="item.visible = false">取消</el-button>
              </div>
              <i slot="reference" class="el-icon-close" style="color: #999" />
            </el-popover>
          </div>
        </div>

        <div v-if="suggestSite == 2 && suggestSizeText" class="img_button_text">{{ suggestSizeText }}</div>
      </div>

      <div v-if="openAddImg" class="diy-add-img" @click="addModel">
        +添加 {{ maxImgLength >= 999 ? '' : newImgInfos.length + '/' + maxImgLength }}
      </div>
    </div>

    <el-dialog
      width="900px"
      title="热区编辑器"
      append-to-body
      :close-on-click-modal="false"
      :visible.sync="hotZonePop"
    >
      <HotZoneEditor
        v-if="hotZonePop"
        :image="selHotZoneImg.imgUrl"
        :value="selHotZoneImg.hotZone || []"
        @replace-image="openHotZoneImagePicker"
        @save="getSave"
        @cancel="hotZonePop = false"
      />
    </el-dialog>

    <!-- 自定义链接输入（对应原实现的 xun-ai 分支） -->
    <el-dialog
      width="50%"
      title="添加链接"
      append-to-body
      :visible.sync="xunaiPop"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
    >
      <el-input v-model="xunaiUrl" placeholder="请输入链接" style="width: 100%" />
      <span slot="footer">
        <el-button @click="xunaiPop = false">取 消</el-button>
        <el-button type="primary" @click="getXunaiUrl">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="选择图片" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="onPicked" />
    </el-dialog>
  </DiyStyleContain>
</template>

<script>
/**
 * 图片设置控件 —— 图片 + 链接的列表配置，P6 图文类组件的主力
 * 迁移自 PHP diy-img-setting.php
 *
 * imgInfos 项结构：
 *   { url, urlName, urlType, imgUrl, visible, app_appid, wx_appid, wx_url, hotZone: [...] }
 *
 * 依赖替换与遗留：
 *   com-attachment → @/components/base/uploadPicture
 *   com-pick-link  → 触发 pick-link 事件交给使用方，选完后调用本组件的 setUrl(urlInfo) 写回
 *   HotZone        → ./HotZoneEditor.vue，坐标沿用原实现的百分比结构
 */
import uploadPictures from '@/components/base/uploadPicture';
import DiyStyleContain from './DiyStyleContain';
import DiyUrl from './DiyUrl';
import HotZoneEditor from './HotZoneEditor';
import { getOtherUrlName } from './utils';

export default {
  name: 'DiyImgSetting',
  components: { uploadPictures, DiyStyleContain, DiyUrl, HotZoneEditor },
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    imgContainStyle: {
      type: Object,
      default: () => ({}),
    },
    // 开启热区时应关闭 showUrl
    showHotZone: {
      type: Boolean,
      default: false,
    },
    showUrl: {
      type: Boolean,
      default: true,
    },
    showInput: {
      type: Boolean,
      default: false,
    },
    // 1 建议尺寸在顶部 / 2 在图片下方
    suggestSite: {
      type: [Number, String],
      default: 1,
    },
    suggestSizeText: {
      type: String,
      default: '建议图片宽为750，高度420',
    },
    openAddImg: {
      type: Boolean,
      default: false,
    },
    topName: {
      type: String,
      default: '图片设置',
    },
    imgPopSize: {
      type: Array,
      default: () => ['60', '60'],
    },
    defImgUrl: {
      type: String,
      default: '',
    },
    maxImgLength: {
      type: [String, Number],
      default: 5,
    },
    defImgCount: {
      type: [String, Number],
      default: 1,
    },
    imgInfos: {
      type: Array,
      default: () => [],
    },
    // 'xun-ai' 时链接改走自定义链接输入弹窗
    type: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      newImgInfos: [],
      selModelIndex: -1,
      selImgIndex: -1,
      hotZonePop: false,
      selHotZoneImg: {},
      urlIndex: -1,
      // -1 表示当前设置的是图片链接，否则是第 n 个热区的链接
      hotZoneIndex: -1,
      xunaiPop: false,
      xunaiUrl: '',
      pickerVisible: false,
      pickingIndex: -1,
    };
  },
  watch: {
    imgInfos: {
      deep: true,
      immediate: true,
      handler(val) {
        this.newImgInfos = [];
        if (!val || val.length === 0) {
          this.addModel();
        } else {
          this.newImgInfos = val;
        }
      },
    },
  },
  methods: {
    changImg() {
      this.$emit('change', this.newImgInfos);
    },
    addModel() {
      if (this.newImgInfos.length >= this.maxImgLength) {
        this.$notify({ title: '', message: `最多添加${this.maxImgLength}个`, type: 'warning' });
        return;
      }
      const obj = {
        url: '',
        imgUrl: this.defImgUrl || '',
        visible: false,
        urlName: '',
        urlType: '',
        app_appid: '',
        wx_appid: '',
        wx_url: '',
        hotZone: [{ leftPer: 0, topPer: 0, widthPer: 0.3, heightPer: 0.3, url: '', urlName: '', urlType: '' }],
      };
      if (this.newImgInfos.length === 0) {
        this.newImgInfos = [];
        for (let i = 0; i < Number(this.defImgCount); i++) {
          this.newImgInfos.push(JSON.parse(JSON.stringify(obj)));
        }
      } else {
        this.newImgInfos.push(obj);
      }
      this.changImg();
    },
    delModel(index) {
      if (this.newImgInfos.length === 1) {
        this.newImgInfos[index].visible = false;
        this.$notify({ title: '', message: '最少保留一个', type: 'warning' });
        return;
      }
      this.newImgInfos.splice(index, 1);
      this.changImg();
    },
    openPicker(index) {
      this.pickingIndex = index;
      this.pickerVisible = true;
    },
    handleImageClick(index) {
      if (!this.showHotZone) this.openPicker(index);
    },
    openHotZoneImagePicker() {
      this.openPicker(this.urlIndex);
    },
    onPicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url && this.pickingIndex > -1) {
        this.$set(this.newImgInfos[this.pickingIndex], 'imgUrl', url);
        if (this.hotZonePop && this.pickingIndex === this.urlIndex) {
          this.$set(this.selHotZoneImg, 'imgUrl', url);
        }
        this.changImg();
      }
      this.pickerVisible = false;
    },
    delImg(index) {
      this.$set(this.newImgInfos[index], 'imgUrl', '');
      this.changImg();
    },
    updatedHotZone(index) {
      this.hotZonePop = true;
      this.selHotZoneImg = JSON.parse(JSON.stringify(this.newImgInfos[index]));
      this.urlIndex = index;
    },
    // 热区编辑器保存回调
    getSave(val) {
      this.$set(this.newImgInfos[this.urlIndex], 'hotZone', val);
      this.hotZonePop = false;
      this.changImg();
    },
    addUrl(index) {
      this.urlIndex = index;
      this.hotZoneIndex = -1;
      if (this.type === 'xun-ai') {
        const cur = this.newImgInfos[this.urlIndex];
        this.xunaiUrl = cur && cur.url ? cur.url.link : '';
        this.xunaiPop = true;
      } else {
        this.$emit('pick-link', index, this.newImgInfos[index]);
      }
    },
    /**
     * 供使用方在选完链接后写回，urlInfo 结构与 PHP com-pick-link 的回传一致：
     * { title, open_type, params }
     */
    setUrl(urlInfo) {
      if (!urlInfo) return;
      if (this.hotZoneIndex === -1) {
        const target = this.newImgInfos[this.urlIndex];
        if (!target) return;
        this.$set(target, 'urlName', getOtherUrlName(urlInfo.open_type) || urlInfo.title);
        this.$set(target, 'url', urlInfo.params);
        this.$set(target, 'urlType', urlInfo.open_type);
        this.urlIndex = -1;
      } else {
        const hot = this.selHotZoneImg.hotZone[this.hotZoneIndex];
        hot.urlName = getOtherUrlName(urlInfo.open_type) || urlInfo.title;
        hot.url = urlInfo.params;
        hot.urlType = urlInfo.open_type;
      }
      this.changImg();
    },
    getXunaiUrl() {
      if (!this.xunaiUrl) return;
      const params = { link: this.xunaiUrl, open_type: 'web' };
      if (this.hotZoneIndex === -1) {
        this.$set(this.newImgInfos[this.urlIndex], 'url', params);
        this.$set(this.newImgInfos[this.urlIndex], 'urlName', '寻艾页面链接：自定义链接');
        this.urlIndex = -1;
      } else {
        const hot = this.selHotZoneImg.hotZone[this.hotZoneIndex];
        hot.urlName = '寻艾页面链接：自定义链接';
        hot.url = params;
      }
      this.changImg();
      this.xunaiUrl = '';
      this.xunaiPop = false;
    },
  },
};
</script>

<style scoped lang="scss">
.suggest {
  margin: 20px 0 12px;
  background: #eaf3fe;
  border: 1px solid #2d8cf0;
  border-radius: 3px;
  padding: 14px 17px;
  font-size: 12px;
  font-weight: bold;
  color: #999;
}
.diy-img-models {
  margin-bottom: 6px;
}
.diy-img-model {
  padding: 12px 9px 7px;
  background: #f6f5f8;
  position: relative;
  border-radius: 4px;
}
.model-row {
  display: flex;
  align-items: center;
}
.card-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c0c4cc;
  background: #fff;
}
.img-upload-bor {
  position: relative;
  border: 1px dashed #d5d5d5;
}
.diy-sty-img {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  .diy-sty-img-u {
    width: 100%;
    height: 100%;
  }
  .diy-upd-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 18px;
    line-height: 18px;
    text-align: center;
    font-size: 12px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    // 热区遮罩铺满整张图且在它之后渲染，不抬层级的话「替换」点不到，底图就换不了
    z-index: 2;
  }
  .diy-upd-icon {
    position: absolute;
    top: -6px;
    right: -6px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    font-size: 12px;
  }
}
.diy-img-hot-zone {
  width: 100%;
}
.img-hot-model {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.img-hot-zone-model {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(45, 140, 240, 0.35);
  border: 1px solid #2d8cf0;
  font-size: 12px;
  color: #fff;
}
.hot-zone-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 32px;
  gap: 1px;
  background: rgba(255, 255, 255, 0.7);
}
.hot-zone-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 0 8px;
  border: 0;
  color: #303133;
  background: rgba(255, 255, 255, 0.94);
  font-size: 12px;
  line-height: 32px;
  cursor: pointer;
  &:hover {
    color: #2d8cf0;
    background: #fff;
  }
}
.hot-zone-action-primary {
  color: #fff;
  background: #2d8cf0;
  &:hover {
    color: #fff;
    background: #57a3f3;
  }
}
.applet-inputs {
  flex: 1;
  margin-left: 4px;
}
.applet-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.applet-label {
  width: 100px;
  text-align: right;
  margin-right: 4px;
  flex-shrink: 0;
  font-size: 12px;
  color: #999;
}
.diy-img-del-model {
  position: absolute;
  top: 4px;
  right: 6px;
  cursor: pointer;
}
.popover-btns {
  display: flex;
  align-items: center;
}
.diy-add-img {
  border: 1px dashed #707070;
  line-height: 32px;
  height: 34px;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  color: #999;
}
.img_button_text {
  font-size: 12px;
  color: #c0c4cc;
  padding-top: 6px;
}
</style>
