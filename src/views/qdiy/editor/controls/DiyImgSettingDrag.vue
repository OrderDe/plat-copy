<template>
  <DiyStyleContain
    class="diy-img-setting-drag"
    :title="topName"
    :show-title="showTitle"
    :contain-style="imgContainStyle"
    :style="{ 'border-top': showTitle ? '' : 'none' }"
  >
    <div v-if="suggestSite == 1 && suggestSizeText" class="suggest">{{ suggestSizeText }}</div>

    <div class="diy-img-models">
      <draggable v-if="newImgInfos.length" v-model="newImgInfos" :options="{ animation: 200 }" @update="handleDragUpdate">
        <div
          v-for="(item, index) in newImgInfos"
          :key="index"
          class="diy-img-model"
          :style="{ marginBottom: '10px', padding: showHotZone ? '0' : '' }"
        >
          <div class="model-row">
            <div :style="{ width: showHotZone ? '100%' : '' }">
              <div
                v-if="!item.imgUrl || !item.imgUrl.length"
                class="card-upload img-upload-bor"
                :style="boxSize"
                @click="openPicker(index, 'image')"
              >
                <i class="el-icon-plus" />
              </div>
              <div v-else class="diy-sty-img" :class="{ 'diy-img-hot-zone': showHotZone }" :style="boxSize" @click="openPicker(index, 'image')">
                <el-image class="diy-sty-img-u" :src="item.imgUrl" />
                <div class="diy-upd-img" :class="{ 'diy-upd-hot': showHotZone }">替换</div>
                <i class="el-icon-close diy-upd-icon" @click.stop="delImg(index)" />
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
              </div>
            </div>

            <!-- 视频项不允许配链接，这里用样式屏蔽掉交互，与原实现一致 -->
            <div class="url-wrap" :style="getVideoUrlStyle(item.selectType)">
              <DiyUrl v-if="showUrl" :text="item.urlName" style="margin-left: 10px" @add="addUrl(index)" />
            </div>

            <div v-show="newImgInfos.length > 1" class="diy-img-del-model">
              <el-popover v-model="item.visible" placement="bottom" width="120">
                <p class="diy-del-text">确定删除吗？</p>
                <div class="popover-btns">
                  <el-button class="diy-del-btn" size="mini" plain @click.stop="delModel(index)">删除</el-button>
                  <el-button size="mini" plain @click.stop="item.visible = false">取消</el-button>
                </div>
                <i slot="reference" class="el-icon-close" style="color: #999" />
              </el-popover>
            </div>
          </div>

          <!-- 视频项 -->
          <div v-if="item.selectType == 2" class="video-row">
            <div class="video-label">上传视频</div>
            <div class="video-box">
              <div v-if="!item.videoUrl" class="card-upload img-upload-bor" :style="boxSize" @click="openPicker(index, 'video')">
                <i class="el-icon-plus" />
              </div>
              <div v-else class="diy-sty-img" :style="boxSize" @click="openPicker(index, 'video')">
                <video class="video-preview" :src="item.videoUrl" />
                <i class="el-icon-close diy-upd-icon" @click.stop="delVideoUrl(index)" />
              </div>
            </div>
          </div>

          <div v-if="suggestSite == 2 && suggestSizeText" class="img_button_text">{{ suggestSizeText }}</div>
        </div>
      </draggable>

      <!-- 添加：可选图片或视频 -->
      <el-popover v-if="openAddImg" v-model="popoverVisible" placement="top" width="160" trigger="click">
        <div class="select-type-box">
          <div class="select-type-item" @click="changePopoverVisible(1)">添加图片</div>
          <div class="select-type-item" @click="changePopoverVisible(2)">添加视频</div>
        </div>
        <div slot="reference" class="diy-add-img">
          +添加 {{ maxImgLength >= 999 ? '' : newImgInfos.length + '/' + maxImgLength }}
        </div>
      </el-popover>
    </div>

    <el-dialog width="50%" title="热区编辑器" append-to-body :visible.sync="hotZonePop">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="热区编辑器尚未迁移"
        description="PHP 侧的 HotZone 组件（772 行）不在本轮 21 个基础控件范围内，已有热区数据仍可正常读写与预览。"
      />
    </el-dialog>

    <el-dialog
      :title="pickingType === 'video' ? '选择视频' : '选择图片'"
      :visible.sync="pickerVisible"
      width="960px"
      append-to-body
      :close-on-click-modal="false"
    >
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="onPicked" />
    </el-dialog>
  </DiyStyleContain>
</template>

<script>
/**
 * 可拖拽排序的图片设置控件
 * 迁移自 PHP diy-img-setting-drag.php
 *
 * 与 DiyImgSetting 的差异（原 PHP 两个文件也是这么分的）：
 *   1. 列表支持拖拽排序
 *   2. 每项有 selectType（1 图片 / 2 视频），视频项额外有 videoUrl 且不允许配链接
 *   3. 没有小程序参数输入（showInput）那几项
 *
 * 依赖替换与遗留同 DiyImgSetting。
 */
import draggable from 'vuedraggable';
import uploadPictures from '@/components/base/uploadPicture';
import DiyStyleContain from './DiyStyleContain';
import DiyUrl from './DiyUrl';
import { getOtherUrlName } from './utils';

export default {
  name: 'DiyImgSettingDrag',
  components: { draggable, uploadPictures, DiyStyleContain, DiyUrl },
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    imgContainStyle: {
      type: Object,
      default: () => ({}),
    },
    showHotZone: {
      type: Boolean,
      default: false,
    },
    showUrl: {
      type: Boolean,
      default: true,
    },
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
  },
  data() {
    return {
      newImgInfos: [],
      hotZonePop: false,
      selHotZoneImg: {},
      urlIndex: -1,
      hotZoneIndex: -1,
      // 新增项时选择的类型：1 图片 2 视频
      selectType: 1,
      popoverVisible: false,
      pickerVisible: false,
      pickingIndex: -1,
      pickingType: 'image',
    };
  },
  computed: {
    boxSize() {
      return {
        width: this.showHotZone ? '' : `${this.imgPopSize[0]}px`,
        height: this.showHotZone ? '' : `${this.imgPopSize[1]}px`,
      };
    },
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
    changImg(type = null) {
      this.$emit('change', this.newImgInfos, type);
    },
    changePopoverVisible(selectType) {
      this.selectType = selectType;
      this.popoverVisible = false;
      this.addModel();
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
        urlName: this.selectType === 1 ? '' : '视频无需配置链接',
        urlType: '',
        hotZone: [{ leftPer: 0, topPer: 0, widthPer: 0.3, heightPer: 0.3, url: '', urlName: '', urlType: '' }],
        selectType: this.selectType,
        videoUrl: '',
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
    openPicker(index, type) {
      this.pickingIndex = index;
      this.pickingType = type;
      this.pickerVisible = true;
    },
    onPicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url && this.pickingIndex > -1) {
        const field = this.pickingType === 'video' ? 'videoUrl' : 'imgUrl';
        this.$set(this.newImgInfos[this.pickingIndex], field, url);
        this.changImg();
      }
      this.pickerVisible = false;
    },
    delImg(index) {
      this.$set(this.newImgInfos[index], 'imgUrl', '');
      this.changImg();
    },
    delVideoUrl(index) {
      this.$set(this.newImgInfos[index], 'videoUrl', '');
      this.changImg();
    },
    updatedHotZone(index) {
      this.hotZonePop = true;
      this.selHotZoneImg = JSON.parse(JSON.stringify(this.newImgInfos[index]));
      this.urlIndex = index;
    },
    getSave(val) {
      this.newImgInfos[this.urlIndex].hotZone = val;
      this.hotZonePop = false;
      this.changImg();
    },
    addUrl(index) {
      this.urlIndex = index;
      this.hotZoneIndex = -1;
      this.$emit('pick-link', index, this.newImgInfos[index]);
    },
    /** 供使用方选完链接后写回，与 DiyImgSetting 一致 */
    setUrl(urlInfo) {
      if (!urlInfo) return;
      const target = this.newImgInfos[this.urlIndex];
      if (!target) return;
      this.$set(target, 'urlName', getOtherUrlName(urlInfo.open_type) || urlInfo.title);
      this.$set(target, 'url', urlInfo.params);
      this.$set(target, 'urlType', urlInfo.open_type);
      this.urlIndex = -1;
      this.changImg();
    },
    // draggable 的 update 事件只给下标，这里按原实现重排后整体回抛
    handleDragUpdate(e) {
      const list = JSON.parse(JSON.stringify(this.newImgInfos));
      const currentItem = list.splice(e.oldIndex, 1);
      list.splice(e.newIndex, 0, currentItem[0]);
      this.newImgInfos = [];
      this.$nextTick(() => {
        list.forEach((v, k) => this.$set(this.newImgInfos, k, v));
        this.changImg(this.newImgInfos);
      });
    },
    getVideoUrlStyle(selectType) {
      if (Number(selectType) === 2) {
        return { cursor: 'not-allowed', 'pointer-events': 'none' };
      }
      return {};
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
  cursor: move;
}
.model-row {
  display: flex;
  align-items: center;
  padding-bottom: 10px;
}
.url-wrap {
  flex: 1;
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
.video-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 3px solid #fff;
  padding-top: 10px;
}
.video-label {
  width: 160px;
  font-size: 13px;
  color: #999;
}
.video-preview {
  width: 60px;
  height: 30px;
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
.select-type-box {
  .select-type-item {
    line-height: 32px;
    text-align: center;
    cursor: pointer;
    &:hover {
      color: #409eff;
    }
  }
}
.img_button_text {
  font-size: 12px;
  color: #c0c4cc;
  padding-top: 6px;
}
</style>
