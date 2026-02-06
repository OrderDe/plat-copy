<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false" :body-style="{ padding: '0 20px' }">
      <upload-picture :pictureType="pictureType" modelName="imagesAndVideos"></upload-picture>
    </el-card>
  </div>
</template>

<script>
 
export default {
  name: 'index',
  data() {
    return {
      pictureType: 'maintain',
    };
  },
};
</script>
