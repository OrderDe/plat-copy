<template>
  <div>
    <diy-style-contain title="组件位置">
      <el-radio-group v-model="locationValue" @change="locationChange">
        <el-radio :label="1">左上角</el-radio>
        <el-radio :label="2">右上角</el-radio>
        <el-radio :label="3">左下角</el-radio>
        <el-radio :label="4">右下角</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="播放设置">
      <el-radio-group v-model="autoplay" @change="autoplayChange">
        <el-radio :label="false">点击播放</el-radio>
        <el-radio :label="true">自动播放</el-radio>
      </el-radio-group>
      <div class="bm-tip">
        浏览器与微信都禁止未经交互的音频自动播放，选「自动播放」时会在用户第一次
        点屏幕后开始播；iOS 上表现更严格，可能仍需点一下音乐按钮。
      </div>
    </diy-style-contain>

    <diy-style-contain title="数据设置">
      <div class="bg-music-row">
        <div class="leabl">上传方式</div>
        <div>
          <el-radio-group v-model="uploadType" @change="tabsChange">
            <el-radio :label="1">手动上传</el-radio>
            <el-radio :label="2">音频链接</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 手动上传 -->
      <div v-if="uploadType == 1" class="bg-music-row">
        <div class="leabl">选择音频</div>
        <div>
          <div v-if="!voicesUrl" class="card-upload" :style="voicesComputed" @click="pickerVisible = true">
            <i class="el-icon-plus" />
          </div>
          <div
            v-else
            class="diy-sty-img"
            :style="voicesComputed"
            @mouseover="showIcon = true"
            @mouseleave="showIcon = false"
            @click="pickerVisible = true"
          >
            <i class="el-icon-service voices-icon" />
            <div v-show="showIcon" class="diy-upd-img">替换</div>
            <i v-show="showIcon" class="el-icon-close diy-upd-icon" @click.stop="delImg" />
          </div>
        </div>
      </div>

      <!-- 音频链接 -->
      <div v-else class="bg-music-row">
        <div class="leabl">音频链接</div>
        <div style="flex: 1">
          <el-input v-model="voicesUrl" placeholder="请输入音频链接" @change="uploadVoices" />
        </div>
      </div>
    </diy-style-contain>

    <diy-size-setting
      top-name="位置"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :max-value="100"
      @change="positionSliderChange"
    />

    <el-dialog title="选择音频" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="onPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 背景音乐 —— 属性面板。迁移自 PHP common/bg-music/style.php
 *
 * com-attachment（type=voices）→ @/components/base/uploadPicture
 * 位置滑块的两项名称随「组件位置」联动（上/下 + 左/右）。
 */
import uploadPictures from '@/components/base/uploadPicture';
import basicMixins from '../../controls/basicMixins';
import floatPositionMixins from '../../controls/floatPositionMixins';

export default {
  name: 'BgMusicStyle',
  components: { uploadPictures },
  mixins: [basicMixins, floatPositionMixins],
  data() {
    return {
      uploadType: 1,
      autoplay: false,
      voicesUrl: '',
      showIcon: false,
      pickerVisible: false,
      voicesComputed: { width: '60px', height: '60px' },
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const data = this.result.data;
      this.uploadType = data.uploadType || this.uploadType;
      this.autoplay = !!data.autoplay;
      this.voicesUrl = data.voicesUrl || '';
      // PHP 侧 bg-music 默认在右上角
      this.initFloatPosition(2);
    },
    isURL(str) {
      return /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/.test(str);
    },
    onPicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url) this.uploadVoices(url);
      this.pickerVisible = false;
    },
    uploadVoices(url) {
      if (url && !this.isURL(url)) {
        this.$message({ message: '请输入合法的URL', type: 'warning' });
        return;
      }
      this.voicesUrl = url && url.trim();
      this.updataData(this.voicesUrl, 'voicesUrl');
    },
    autoplayChange(val) {
      this.updataData(val, 'autoplay');
    },
    tabsChange() {
      this.updataData(this.uploadType, 'uploadType');
    },
    delImg() {
      this.voicesUrl = '';
      this.updataData('', 'voicesUrl');
    },
  },
};
</script>

<style scoped lang="scss">
.bm-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: #999;
}
.bg-music-row {
  display: flex;
  padding-bottom: 15px;

  .leabl {
    width: 60px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 8px;
    color: #999;
    margin-right: 15px;
  }
}
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
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;

  .voices-icon {
    font-size: 24px;
    color: #909399;
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
</style>
