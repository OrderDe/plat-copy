<template>
  <!--边距拉动组件-->
  <div v-if="configData.title !== '图片间距' || (configData.title === '图片间距' && configObj.tabConfig.tabVal !== 0)">
    <div v-if="configData" class="borderPadding">
      <div class="c_row-item">
        <div class="label labelwidth c_label" v-if="configData.title">
          {{ configData.title }}
        </div>
        <div class="slider-box ml22">
          <el-slider
            v-model="configData.val"
            show-input
            @change="sliderChange($event)"
            :min="configData.min"
            :max="configData.max"
          ></el-slider>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'c_slider',
  props: {
    configObj: {
      type: Object,
    },
    configNme: {
      type: String,
    },
  },
  data() {
    return {
      defaults: {},
      sliderWidth: 0,
      configData: {},
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.defaults = this.configObj;
      this.configData = this.configObj[this.configNme];
    });
  },
  watch: {
    configObj: {
      handler(nVal, oVal) {
        this.defaults = nVal;
        this.configData = nVal[this.configNme];
      },
      deep: true,
    },
  },
  methods: {
    sliderChange(e) {},
  },
};
</script>

<style scoped lang="scss">
.c_row-item {
  margin-bottom: 20px;
  .label {
    color: #999;
  }
}
</style>
