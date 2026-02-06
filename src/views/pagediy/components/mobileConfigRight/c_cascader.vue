<template>
  <!--级联下拉框-->
  <div class="borderPadding mb20">
    <div class="c_row-item" v-if="configData && configData.isShow === 1">
      <div class="label labelwidth c_label">
        {{ configData.title }}
      </div>
      <div class="slider-box ml22">
        <el-cascader
          style="width: 100%"
          :options="configData.list"
          :placeholder="configData.all? configData.all : `请选择${configData.title}`"
          v-model="configData.activeValue"
          filterable
          :props="props"
          clearable
          :show-all-levels="false"
          @change="sliderChange"
        ></el-cascader>
      </div>
    </div>
  </div>
</template>

<script>
 
export default {
  name: 'c_cascader',
  props: {
    configObj: {
      type: Object,
    },
    configNme: {
      type: String,
    },
    number: {
      type: null,
    },
  },
  data() {
    return {
      props: {
        value: 'id',
        label: 'name',
        children: 'childList',
        expandTrigger: 'hover',
        checkStrictly: false,
        multiple: true,
        emitPath: false,
      },
      defaults: {},
      configData: {},
      timeStamp: '',
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
    number(nVal) {
      this.timeStamp = nVal;
    },
  },
  methods: {
    sliderChange(e) {
      this.configData.activeValue = e
      let storage = window.localStorage;
     // this.configData.activeValue = e ? e : storage.getItem(this.timeStamp);
      this.$emit('getConfig', { name: 'cascader', values: e });
    },
  },
};
</script>

<style scoped lang="scss">
.label {
  font-size: 12px;
  color: #999;
}
</style>
