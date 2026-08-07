// 标签页操作插件 - 避免顶层 import 导致循环依赖，懒加载 router 和 store

function closeOpenPage(pathOrObj) {
  // 懒加载以避免循环依赖
  const router = require('@/router').default
  const store = require('@/store').default
  const currentRoute = router.currentRoute
  store.dispatch('tagsView/delView', currentRoute).then(() => {
    if (typeof pathOrObj === 'string') {
      router.push(pathOrObj)
    } else {
      router.push(pathOrObj)
    }
  })
}

function closePage(pathOrObj) {
  const router = require('@/router').default
  const store = require('@/store').default
  const currentRoute = router.currentRoute
  store.dispatch('tagsView/delView', currentRoute)
  if (pathOrObj) {
    if (typeof pathOrObj === 'string') {
      router.push(pathOrObj)
    } else {
      router.push(pathOrObj)
    }
  }
}

function openPage(pathOrObj) {
  const router = require('@/router').default
  if (typeof pathOrObj === 'string') {
    router.push(pathOrObj)
  } else {
    router.push(pathOrObj)
  }
}

export default {
  closeOpenPage,
  closePage,
  openPage,
}
