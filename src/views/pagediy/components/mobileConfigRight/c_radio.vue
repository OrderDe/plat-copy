<template>
  <!--单选框组-->
  <div class="txt_tab borderPadding" v-if="configData && configData.isShow === 1">
    <div class="radio_row-item">
      <el-row class="c_label">
        <span class="labelwidth">{{ configData.title }}</span>
        <!-- <span class="labelml">{{ configData.list[configData.tabVal].val }}</span> -->
      </el-row>
      <el-row class="">
        <el-radio-group v-model="configData.tabVal" type="button" @change="radioChange($event)">
          <el-radio :label="key" v-for="(radio, key) in configData.list" :key="key">
            <span class="iconfont-diy iconfont" :class="radio.icon" v-if="radio.icon"></span>
            <span v-else>{{ radio.val }}</span>
          </el-radio>
        </el-radio-group>
      </el-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'c_radio',
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
      configData: {},
    };
  },
  created() {
    this.defaults = this.configObj;
    this.configData = this.configObj[this.configNme];
  },
  watch: {
    configObj: {
      handler(nVal, oVal) {
        this.defaults = nVal;
        this.configData = nVal[this.configNme];
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    radioChange(e) {
      this.$emit('getConfig', { name: 'radio', values: e });
    },
  },
};
</script>

<style scoped lang="scss">
.radio_row-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.iconfont {
  font-size: 24px;
}

.color-box {
  position: relative;
  max-width: 100%;
  min-height: 1px;
}
</style>
