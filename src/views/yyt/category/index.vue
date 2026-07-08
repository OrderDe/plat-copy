<template>
  <div v-if="checkPermi(['platform:yyt:category:list'])" class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">怡亚通分类管理</span>
      </div>
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="subId"
        border
        size="mini"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        lazy
        :load="loadChildren"
        class="mt10"
      >
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="id" label="分类ID" width="120" />
        <el-table-column prop="level" label="层级" width="80">
          <template slot-scope="{ row }">
            <el-tag :type="row.level === 1 ? 'primary' : row.level === 2 ? 'success' : 'warning'" size="mini">
              {{ row.level === 1 ? '一级' : row.level === 2 ? '二级' : '三级' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="parentName" label="上级分类" min-width="160" /> -->
        <!-- <el-table-column prop="sort" label="排序" width="80" /> -->
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { GetCategoryTree } from '@/api/yytapi';

export default {
  name: 'YytCategory',
  data() {
    return {
      loading: false,
      tableData: [],
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    async getList() {
      this.loading = true;
      try {
        // 只获取一级分类
        const res = await GetCategoryTree({ pid: 0, level: 1 });
        console.log('一级分类', res);
        this.tableData = (res || []).map((item) => ({
          ...item,
          level: 1,
          hasChildren: true, // 标记有子节点，用于懒加载
        }));
      } finally {
        this.loading = false;
      }
    },
    // 懒加载子分类
    async loadChildren(tree, treeNode, resolve) {
      const parentLevel = tree.level + 1;
      try {
        const res = await GetCategoryTree({ pid: tree.subId, level: parentLevel });
        console.log(`加载${parentLevel === 2 ? '二级' : '三级'}分类`, res);
        const children = (res || []).map((item) => ({
          ...item,
          level: parentLevel,
          hasChildren: parentLevel < 3, // 三级以下不再有子节点
        }));
        resolve(children);
      } catch (e) {
        console.error('加载子分类失败', e);
        resolve([]);
      }
    },
  },
};
</script>
