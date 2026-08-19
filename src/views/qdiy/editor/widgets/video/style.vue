<template>
  <div>
    <diy-style-contain title="视频类型">
      <el-radio-group v-model="videoRadio">
        <el-radio :label="1">手动上传</el-radio>
        <el-radio :label="2">视频链接</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="比例">
      <el-radio-group v-model="proportion" @change="onChange">
        <el-radio :label="1">16:9</el-radio>
        <el-radio :label="2">4:3</el-radio>
        <el-radio :label="3">1:1</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <!-- 手动上传 -->
    <diy-style-contain v-if="videoRadio == 1" title="选择视频">
      <div v-if="!uploadVideoUrl" class="card-upload" :style="videoComputed" @click="pickerVisible = true">
        <i class="el-icon-plus" />
      </div>
      <div
        v-else
        class="diy-sty-img"
        :style="videoComputed"
        @mouseover="showIcon = true"
        @mouseleave="showIcon = false"
        @click="pickerVisible = true"
      >
        <video :style="videoComputed" :src="uploadVideoUrl" />
        <div v-show="showIcon" class="diy-upd-img">替换</div>
        <i v-show="showIcon" class="el-icon-close diy-upd-icon" @click.stop="delImg" />
      </div>
    </diy-style-contain>

    <!-- 视频链接 -->
    <diy-style-contain v-else title="视频链接">
      <el-input v-model="uploadVideoUrl" placeholder="请输入第三方视频链接" @change="uploadVideo" />
    </diy-style-contain>

    <diy-style-contain title="选择封面图">
      <diy-img-setting
        :img-infos="imageUrl"
        :def-img-count="1"
        :show-url="false"
        :suggest-site="2"
        suggest-size-text=""
        :img-contain-style="{ padding: 0 }"
        :show-title="false"
        @change="addIconImg"
      />
    </diy-style-contain>

    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />

    <el-dialog title="选择视频" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="onPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 视频 —— 属性面板。迁移自 PHP common/video/style.php
 *
 * com-attachment（type=videos）→ @/components/base/uploadPicture
 */
import uploadPictures from '@/components/base/uploadPicture';
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'VideoStyle',
  components: { uploadPictures },
  mixins: [basicMixins],
  data() {
    return {
      videoRadio: 1,
      // 1 = 16:9，2 = 4:3，3 = 1:1
      proportion: 1,
      imageUrl: [],
      showIcon: false,
      uploadVideoUrl: '',
      pickerVisible: false,
    };
  },
  computed: {
    videoComputed() {
      return { width: '60px', height: '60px' };
    },
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.proportion = this.result.computedStyle.proportion || 1;
      this.imageUrl = [];
      if (this.result.data.imageUrl) {
        this.imageUrl.push({ imgUrl: this.result.data.imageUrl });
      }
      this.uploadVideoUrl = this.result.data.uploadVideoUrl || '';
    },
    isURL(str) {
      return /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/.test(str);
    },
    onPicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url) this.uploadVideo(url);
      this.pickerVisible = false;
    },
    uploadVideo(url) {
      if (url && !this.isURL(url)) {
        this.$message({ message: '请输入合法的URL', type: 'warning' });
        return;
      }
      this.uploadVideoUrl = url;
      this.updataData(url, 'uploadVideoUrl');
    },
    addIconImg(arr) {
      this.imageUrl = arr;
      if (arr && arr[0]) this.updataData(arr[0].imgUrl, 'imageUrl');
    },
    onChange() {
      this.updataResult(this.proportion, 'proportion');
    },
    delImg() {
      this.uploadVideoUrl = '';
      this.updataData('', 'uploadVideoUrl');
    },
  },
};
</script>

<style scoped lang="scss">
.card-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d5d5d5;
  border-radius: 4px;
  cursor: pointer;
  color: #c0c4cc;
}
.diy-sty-img {
  position: relative;
  cursor: pointer;
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
</style>
