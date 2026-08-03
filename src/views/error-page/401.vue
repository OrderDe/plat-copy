<template>
  <div class="errPage-container">
    <el-button size="mini" icon="el-icon-arrow-left" class="pan-back-btn" @click="back"> 返回 </el-button>
    <el-row>
      <el-col :span="24">
        <h1 style="margin-top: 20px;" >你没有权限去该页面</h1>
        <router-link style="margin-top: 20px;" to="/dashboard"> 回首页 </router-link>
        <el-button type="text" style="margin-top: 12px; display: block;" @click="handleReLogin">返回重新登录</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'Page401',
  data() {
    return {
    };
  },
  methods: {
    back() {
      if (this.$route.query.noGoBack) {
        this.$router.push({ path: '/dashboard' });
      } else {
        this.$router.go(-1);
      }
    },
    handleReLogin() {
      this.$store.dispatch('user/handleLogout');
    },
  },
};
</script>

<style lang="scss" scoped>
.errPage-container {
  width: 800px;
  max-width: 100%;
  margin: 100px auto;
  .pan-back-btn {
    background: #ff0101;
    width: 100px;
    height: 42px;
    color: #fff;
    border: none !important;
  }
  
  .pan-img {
    display: block;
    margin: 0 auto;
    width: 100%;
  }
  .text-jumbo {
    font-size: 60px;
    font-weight: 700;
    color: #484848;
  }
  
}
</style>
