<template>
  <div>
    <diy-style-contain title="是否显示用户等级">
      <el-radio-group v-model="isLevel" @change="changesLevel">
        <el-radio :label="1">是</el-radio>
        <el-radio :label="0">否</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="显示评论个数">
      <el-radio-group v-model="commentCount" @change="changes">
        <el-radio v-for="n in [1, 2, 3]" :key="n" :label="n">{{ n }}</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
    <diy-size-setting
      top-name="组件边距"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :size-infos-max="sizeInfosMax"
      @change="updateSize"
    />
  </div>
</template>

<script>
/** 商品评价 —— 属性面板。迁移自 PHP common/goods-comment/style.php */
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'GoodsCommentStyle',
  mixins: [basicMixins],
  data() {
    return {
      commentCount: 1,
      isLevel: 1,
      sizeInfos: ['上边距', '下边距', '左右边距'],
      sizeInfosValue: [10, 0, 0],
      sizeInfosMax: [50, 50, 20],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const data = this.result.data;
      if (data.commentCount) {
        this.commentCount = data.commentCount;
        this.isLevel = data.isLevel === undefined || data.isLevel === null ? 1 : data.isLevel;
      } else {
        this.$set(data, 'commentCount', this.commentCount);
        this.$set(data, 'isLevel', this.isLevel);
        this.$emit('update', this.result);
      }
    },
    changes(e) {
      this.updataData(e, 'commentCount');
    },
    changesLevel(e) {
      this.updataData(e, 'isLevel');
    },
    updateSize(arr) {
      this.sizeInfos = arr;
      if (this.result.data.sizeInfos && this.result.data.sizeInfos.length) {
        this.sizeInfos = this.result.data.sizeInfos;
      } else {
        this.$set(this.result.data, 'sizeInfos', this.sizeInfos);
      }
      const cs = this.result.computedStyle;
      ['marginTop', 'marginBottom', 'aroundMargin'].forEach((key, i) => {
        cs[key] = this.sizeInfos[i].value + this.sizeInfos[i].unit;
      });
      this.$emit('update', this.result);
    },
  },
};
</script>
