<template>
  <div>
    <el-dialog title="商品列表" :visible.sync="visible" width="896px" :before-close="handleClose" class="dialog-bottom">
      <good-list
        v-if="visible"
        @getStoreItem="getStoreItem"
        :handleNum="handleNum"
        :checked="checked"
        @closeDialog="closeDialog"
      ></good-list>
    </el-dialog>
  </div>
</template>

<script>
import goodList from '@/components/goodList/index.vue';
export default {
  name: 'GoodListFrom',
  components: { goodList },
  data() {
    return {
      handleNum: '',
      visible: false,
      callback: function () {},
      checked: [],
    };
  },
  methods: {
    closeDialog() {
      this.visible = false;
    },
    handleClose() {
      this.visible = false;
    },
    getStoreItem(img) {
      this.callback(img);
      this.visible = false;
    },
  },
};
</script>

<style scoped></style>
