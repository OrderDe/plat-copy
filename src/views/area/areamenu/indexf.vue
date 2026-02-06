<template>
  <div class="divBox">
    <!-- 使用封装的区域菜单组件，传递systemType为parent -->
    <AreaMenuComponent system-type="parent" />
  </div>
</template>

<script>
 
import AreaMenuComponent from './AreaMenuComponent.vue';

export default {
  name: 'AreaMenu',
  components: {
    AreaMenuComponent
  }
};
</script>
<style lang="scss" scoped>
/* 样式已移至组件内部 */
</style>
