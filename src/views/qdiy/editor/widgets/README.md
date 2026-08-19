# QDiy 业务组件目录（P5 / P6）

编辑器的组件注册中心（`../registry.js`）会用 `require.context` 扫描本目录，
因此本目录**必须存在**，否则 webpack 构建期就会报错。

## 目录约定

每个业务组件一个文件夹，文件夹名 = `eb_qdiy_components.code`，下面固定两个文件：

```
widgets/
  carousel-img/
    preview.vue   → 自动注册为全局组件 carousel-img-preview（中间画布预览）
    style.vue     → 自动注册为全局组件 carousel-img-style（右侧属性面板）
```

## 组件契约

两个文件都接收同样两个 prop：

| prop | 说明 |
|---|---|
| `item` | 画布项，结构 `{identify, site, data, computedStyle, params}`，**直接修改即可**，编辑器会自动记录撤销历史 |
| `component` | 该组件在 `eb_qdiy_components` 中的注册信息（title / icon / count / isTop / permission 等） |

业务配置写入 `item.data`，需要后端补数据的查询条件写入 `item.params`。
`item.computedStyle` 由编辑器右侧「样式」tab 统一管理，组件内一般不需要动。

## 未迁移时的行为

目录里没有对应 `code` 的组件时，编辑器自动回退到
`../components/FallbackPreview.vue` 与 `../components/FallbackStyle.vue`，
组件仍可添加、排序、保存，只是没有专属预览与配置面板。

因此 P6 可以分批迁移，每加一个文件夹就自动生效，不需要改动编辑器代码。
