<template>
  <div class="divBox">
    <!--头部-->
    <template v-if="isPlatform">
      <!--小方块-->
      <grid-menu v-if="(info && info.type === 6) || (info && info.type === 3)" class="mb14" />
    </template>
    <base-info
      ref="baseInfo"
      v-if="
        checkPermi([
          'platform:statistics:home:index',
          'circle:statistics:home:index',
        ]) && info
      "
    />
    <!-- 经营数据、用户渠道 -->
    <user-overview></user-overview>
  </div>
</template>
<script>
 
import baseInfo from './components/baseInfo';
import gridMenu from './components/gridMenu';
import userOverview from './components/userOverview';
import areaDataOverview from './components/areaDataOverview';
import { checkPermi } from '@/utils/permission'; // 权限判断函数
import { isPlatform } from '@/utils/settingMer';
import { mapGetters } from 'vuex';
export default {
  name: 'Dashboard',
  components: { baseInfo, gridMenu, userOverview, areaDataOverview },
  computed: {
    ...mapGetters(['userInfo', 'circleUserInfo']),
  },
  data() {
    return {
      isPlatform,
      info: undefined,
    };
  },
  mounted() {
    if (isPlatform) {
      this.info = this.userInfo;
    } else {
      this.info = this.circleUserInfo;
    }
  },
  methods: {
    checkPermi,
  },
};
</script>
