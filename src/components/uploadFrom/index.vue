<template>
  <div>
    <!--    此处 特殊需求 title 不显示的 自己额外用icon 实现关闭事件-->
    <el-dialog
      title="上传图片"
      :visible.sync="visible"
      width="950px"
      :append-to-body="true"
      :modal-append-to-body="true"
      :before-close="handleClose"
    >
      <el-button
        class="selfDialogClose"
        type="text"
        icon="el-icon-close"
        circle
        @click="handleClose"
        size="medium"
      ></el-button>
      <upload-picture v-if="visible" :multiple="multiple" :modelName="modelName" @getImage="getImage"></upload-picture>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'UploadFroms',
  data() {
    return {
      visible: false,
      callback: function () {},
      multiple: false,
      modelName: '',
      ISmodal: false,
      booleanVal: true,
    };
  },
  watch: {
    // show() {
    //   this.visible = this.show
    // }
  },
  methods: {
    handleClose() {
      this.visible = false;
    },
    getImage(img) {
      this.callback(img);
      this.visible = false;
    },
  },
};
</script>

<style scoped>
/* 统一组件中的特殊组件 */
::v-deep .el-dialog__header {
  display: none !important;
}
::v-deep .el-dialog__body {
  padding: 2px 20px 0 20px !important;
}
.selfDialogClose {
  display: inline-block;
  position: absolute;
  right: 0;
  top: 3px;
  pointer-events: auto;
  z-index: 999;
  font-size: 20px;
  color: #363f4d;
}
</style>
