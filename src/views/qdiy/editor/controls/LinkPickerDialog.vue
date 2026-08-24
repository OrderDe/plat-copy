<template>
  <!-- is-hot-spot 只控制回传时是否带链接名称，开着才能在按钮上显示「商城首页」而不是路径 -->
  <linkaddress ref="picker" :is-hot-spot="true" @linkUrl="onLinkUrl" />
</template>

<script>
/**
 * 链接选择弹窗
 *
 * 各 diy 控件（diy-img-setting / diy-icon-set / …）的「链接选择」只 emit pick-link，
 * 弹窗按原 PHP 实现放在使用方。这里把「弹窗 + 回传格式」收敛成一个组件，
 * 配合 linkPickerMixins 使用，属性面板里只需要挂一行。
 *
 * 注意：linkaddress 自带 el-dialog，靠自身的 dialogVisible 开关，
 * 外面不能再套一层 el-dialog —— 那样只会渲染出一个空白弹窗。
 *
 * linkaddress 回传 (url, title)，统一转成各控件 setUrl 约定的
 * { title, open_type, params } 结构；params.route 保留是为了 diy-icon-set
 * 能按路径反查默认图标。
 */
import linkaddress from '@/components/linkaddress';

export default {
  name: 'LinkPickerDialog',
  components: { linkaddress },
  methods: {
    open() {
      this.$refs.picker.dialogVisible = true;
    },
    onLinkUrl(url, title) {
      if (!url) return;
      this.$emit('picked', {
        title: title || url,
        open_type: 'link',
        params: { url, route: url },
      });
    },
  },
};
</script>
