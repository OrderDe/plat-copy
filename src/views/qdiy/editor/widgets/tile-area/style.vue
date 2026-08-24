<template>
  <div>
    <diy-style-contain title="每行数量">
      <el-radio-group v-model="colCount" @change="updataData($event, 'colCount')">
        <el-radio v-for="n in [1, 2, 3, 4]" :key="n" :label="n">{{ n }}个</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="瓷片高度">
      <!-- 高相对宽的百分比：100 就是正方形，60 是常见的横幅比例 -->
      <el-slider v-model="ratio" :min="30" :max="150" show-input @change="updataData($event, 'ratio')" />
      <div class="ta-tip">高度相对宽度的百分比，100% 为正方形</div>
    </diy-style-contain>

    <diy-style-contain title="瓷片内容">
      <div v-for="(tile, index) in tiles" :key="index" class="ta-item">
        <div class="ta-item-head">
          <span class="ta-item-no">瓷片 {{ index + 1 }}</span>
          <i class="el-icon-delete ta-item-del" title="删除" @click="removeTile(index)" />
        </div>

        <div class="ta-row">
          <div class="ta-label">背景图</div>
          <div class="ta-img-box" @click="pickImage(index)">
            <img v-if="tile.img" :src="tile.img" alt="" />
            <i v-else class="el-icon-plus" />
          </div>
          <el-button v-if="tile.img" type="text" size="mini" @click="clearImage(index)">清除</el-button>
        </div>

        <div class="ta-row">
          <div class="ta-label">主标题</div>
          <el-input v-model="tile.title" size="mini" maxlength="12" show-word-limit @input="emitTiles" />
        </div>
        <div class="ta-row">
          <div class="ta-label">副标题</div>
          <el-input v-model="tile.subTitle" size="mini" maxlength="16" show-word-limit @input="emitTiles" />
        </div>
        <div class="ta-row">
          <div class="ta-label">背景色</div>
          <el-color-picker v-model="tile.bgColor" size="mini" show-alpha @change="emitTiles" />
          <span class="ta-tip ta-tip--inline">配了背景图时以图为准</span>
        </div>
        <div class="ta-row">
          <div class="ta-label">文字色</div>
          <el-color-picker v-model="tile.fontColor" size="mini" @change="emitTiles" />
        </div>
        <div class="ta-row">
          <div class="ta-label">链接</div>
          <div class="ta-link" @click="openLink(index)">
            <span :class="{ 'ta-link--empty': !linkTextOf(tile) }">{{ linkTextOf(tile) || '选择链接' }}</span>
            <i class="el-icon-arrow-right" />
          </div>
        </div>
      </div>

      <el-button v-if="tiles.length < 8" size="mini" icon="el-icon-plus" class="ta-add" @click="addTile">
        添加瓷片
      </el-button>
    </diy-style-contain>

    <diy-color top-name="颜色" :color-infos="defaultForm.colorInfos" @change="onColorChange" />

    <diy-style-contain title="瓷片间距">
      <el-slider v-model="gap" :min="0" :max="30" show-input @change="updataResult($event, 'gap')" />
    </diy-style-contain>
    <diy-style-contain title="瓷片圆角">
      <el-slider v-model="tileRadius" :min="0" :max="30" show-input @change="updataResult($event, 'tileRadius')" />
    </diy-style-contain>

    <diy-size-setting top-name="内边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="onSpaceChange" />

    <!-- 图片选择与链接选择 -->
    <el-dialog title="选择图片" :visible.sync="imgVisible" width="960px" append-to-body :close-on-click-modal="false">
      <uploadPictures v-if="imgVisible" :multiple="false" @getImage="onImagePicked" />
    </el-dialog>
    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 瓷片区 —— 属性面板
 *
 * 一行 N 块的图文瓷片，每块单独配背景图、背景色、主副标题、文字色和链接。
 * 字段与 App 端 components/qdiy/widgets/qdiyTileArea.vue 对齐，见 preview.vue 的说明。
 *
 * 链接沿用项目里通用的 link_params 结构（与图标组、分类展示一致），
 * App 端用 resolveLink + withMerId 解析，店铺页里会自动带上本店 merId。
 */
import uploadPictures from '@/components/base/uploadPicture';
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';
import LinkPickerDialog from '../../controls/LinkPickerDialog';

const newTile = () => ({ img: '', title: '', subTitle: '', bgColor: '', fontColor: '#333333', link_params: null });

export default {
  name: 'TileAreaStyle',
  components: { uploadPictures, LinkPickerDialog },
  mixins: [basicMixins],
  data() {
    return {
      colCount: 2,
      ratio: 60,
      gap: 8,
      tileRadius: 8,
      tiles: [newTile(), newTile()],
      imgVisible: false,
      // 当前正在编辑图片/链接的瓷片下标
      editingIndex: -1,
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;

      this.colCount = [1, 2, 3, 4].indexOf(Number(d.colCount)) > -1 ? Number(d.colCount) : 2;
      this.ratio = Number(d.ratio) > 0 ? Number(d.ratio) : 60;
      this.gap = Number(getObjValue(this.result, ['computedStyle', 'gap'], 8)) || 0;
      this.tileRadius = Number(getObjValue(this.result, ['computedStyle', 'tileRadius'], 8)) || 0;

      // 已配过就用配好的，没配过写两块默认的进去，免得面板里空着无从下手
      if (d.tiles && d.tiles.length) {
        this.tiles = d.tiles;
      } else {
        this.$set(this.result.data, 'tiles', this.tiles);
      }

      this.defaultForm.colorInfos = [
        {
          name: '组件背景',
          color: getObjValue(this.result, ['computedStyle', 'iptBg'], 'transparent'),
          showAlpha: true,
        },
      ];

      const space = getObjValue(this.result, ['computedStyle', 'spaceStyle'], {}) || {};
      this.defaultForm.sizeInfos = [
        { name: '上边距', value: this.pxOf(space.paddingTop, 0), unit: 'px', disabled: false, maxValue: 50 },
        { name: '下边距', value: this.pxOf(space.paddingBottom, 0), unit: 'px', disabled: false, maxValue: 50 },
        { name: '左右边距', value: this.pxOf(space.paddingLeft, 12), unit: 'px', disabled: false, maxValue: 50 },
      ];
    },
    pxOf(value, def) {
      const n = parseFloat(value);
      return Number.isFinite(n) ? n : def;
    },
    emitTiles() {
      this.$set(this.result.data, 'tiles', this.tiles);
      this.$emit('update', this.result);
    },
    addTile() {
      this.tiles.push(newTile());
      this.emitTiles();
    },
    removeTile(index) {
      this.tiles.splice(index, 1);
      this.emitTiles();
    },
    pickImage(index) {
      this.editingIndex = index;
      this.imgVisible = true;
    },
    onImagePicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url && this.tiles[this.editingIndex]) {
        this.$set(this.tiles[this.editingIndex], 'img', url);
        this.emitTiles();
      }
      this.imgVisible = false;
    },
    clearImage(index) {
      this.$set(this.tiles[index], 'img', '');
      this.emitTiles();
    },
    openLink(index) {
      this.editingIndex = index;
      if (this.$refs.linkPicker) this.$refs.linkPicker.open();
    },
    onLinkPicked(urlInfo) {
      const tile = this.tiles[this.editingIndex];
      if (!tile) return;
      // 与项目里其它组件同一套结构，App 端 resolveLink 直接认
      this.$set(tile, 'link_params', urlInfo);
      this.emitTiles();
    },
    linkTextOf(tile) {
      const p = tile && tile.link_params;
      if (!p) return '';
      return p.name || p.title || (p.params && p.params.url) || p.url || '已配置';
    },
    onColorChange(infos) {
      this.$set(this.result.computedStyle, 'iptBg', infos[0] && infos[0].color);
      this.$emit('update', this.result);
    },
    onSpaceChange(arr) {
      const val = (item) => (item ? item.value + item.unit : undefined);
      const lr = val(arr[2]);
      this.updataResult(
        Object.assign({}, getObjValue(this.result, ['computedStyle', 'spaceStyle'], {}), {
          paddingTop: val(arr[0]),
          paddingBottom: val(arr[1]),
          paddingLeft: lr,
          paddingRight: lr,
        }),
        'spaceStyle'
      );
    },
  },
};
</script>

<style scoped lang="scss">
.ta-item {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.ta-item-head {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.ta-item-no {
  font-size: 12px;
  color: #909399;
}
.ta-item-del {
  margin-left: auto;
  color: #f56c6c;
  cursor: pointer;
}
.ta-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.ta-label {
  width: 56px;
  flex-shrink: 0;
  font-size: 12px;
  color: #606266;
}
.ta-img-box {
  width: 48px;
  height: 48px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  color: #c0c4cc;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.ta-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  height: 28px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
}
.ta-link--empty {
  color: #c0c4cc;
}
.ta-add {
  width: 100%;
}
.ta-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #c0c4cc;
}
.ta-tip--inline {
  margin: 0 0 0 8px;
}
</style>
