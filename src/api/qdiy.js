import request from '@/utils/request';

/**
 * QDiy 装修模块接口封装
 * 与现有 pagediy 体系完全隔离，所有接口走 /admin/platform/qdiy 前缀
 */

/** ---------------- 页面装修 ---------------- */

export function qdiyPageListApi(params) {
  return request({ url: '/admin/platform/qdiy/page/list', method: 'get', params });
}

export function qdiyPageInfoApi(id) {
  return request({ url: `/admin/platform/qdiy/page/info/${id}`, method: 'get' });
}

export function qdiyPageSaveApi(data) {
  return request({ url: '/admin/platform/qdiy/page/save', method: 'post', data });
}

export function qdiyPageUpdateApi(data) {
  return request({ url: '/admin/platform/qdiy/page/update', method: 'post', data });
}

/** 只改名称/底部导航等基础信息，不会覆盖装修内容（列表页编辑用） */
export function qdiyPageUpdateBaseApi(data) {
  return request({ url: '/admin/platform/qdiy/page/updateBase', method: 'post', data });
}

export function qdiyPageDeleteApi(id) {
  return request({ url: `/admin/platform/qdiy/page/delete/${id}`, method: 'get' });
}

/**
 * 指定页面类型的装修开关（商品分类 / 购物车）。
 * 关掉后 App 该页面回到原本写死的样式；平台总开关关掉时这里也一律为 false。
 */
export function qdiyTemplateEnableInfoApi(template) {
  return request({ url: `/admin/platform/qdiy/setting/template-enable/${template}`, method: 'get' });
}

export function qdiyTemplateEnableSaveApi(template, enable) {
  return request({
    url: `/admin/platform/qdiy/setting/template-enable/${template}`,
    method: 'post',
    params: { enable },
  });
}

/** 设为同类型下当前生效的方案（分类页、购物车可配多套，App 只用生效的那套） */
export function qdiyPageSetActiveApi(id) {
  return request({ url: `/admin/platform/qdiy/page/setactive/${id}`, method: 'get' });
}

export function qdiyPageCopyApi(id) {
  return request({ url: `/admin/platform/qdiy/page/copy/${id}`, method: 'get' });
}

export function qdiyPageSetHomeApi(id) {
  return request({ url: `/admin/platform/qdiy/page/sethome/${id}`, method: 'get' });
}

export function qdiyPageSetShowNavApi(params) {
  return request({ url: '/admin/platform/qdiy/page/setshownav', method: 'get', params });
}

/** ---------------- 组件注册表 ---------------- */

export function qdiyComponentsListApi(params) {
  return request({ url: '/admin/platform/qdiy/components/list', method: 'get', params });
}

/** ---------------- 底部导航 ---------------- */

export function qdiyNavListApi() {
  return request({ url: '/admin/platform/qdiy/nav/list', method: 'get' });
}

export function qdiyNavSaveApi(data) {
  return request({ url: '/admin/platform/qdiy/nav/save', method: 'post', data });
}

export function qdiyNavDeleteApi(id) {
  return request({ url: `/admin/platform/qdiy/nav/delete/${id}`, method: 'get' });
}

/** ---------------- 全局配置 ---------------- */

export function qdiySettingInfoApi(params) {
  return request({ url: '/admin/platform/qdiy/setting/info', method: 'get', params });
}

export function qdiySettingSaveApi(data) {
  return request({ url: '/admin/platform/qdiy/setting/save', method: 'post', data });
}

/** 平台是否启用新版装修(qdiy)，关闭后 App 首页走老版 pagediy */
export function qdiyEnableInfoApi() {
  return request({ url: '/admin/platform/qdiy/setting/qdiy-enable', method: 'get' });
}

export function qdiyEnableSaveApi(enable) {
  return request({ url: '/admin/platform/qdiy/setting/qdiy-enable', method: 'post', params: { enable } });
}

/** ---------------- 海报 ---------------- */

export function qdiyPosterListApi(params) {
  return request({ url: '/admin/platform/qdiy/poster/list', method: 'get', params });
}

export function qdiyPosterInfoApi(id) {
  return request({ url: `/admin/platform/qdiy/poster/info/${id}`, method: 'get' });
}

export function qdiyPosterSaveApi(data) {
  return request({ url: '/admin/platform/qdiy/poster/save', method: 'post', data });
}

export function qdiyPosterUpdateApi(data) {
  return request({ url: '/admin/platform/qdiy/poster/update', method: 'post', data });
}

export function qdiyPosterSetDefaultApi(id) {
  return request({ url: `/admin/platform/qdiy/poster/setdefault/${id}`, method: 'get' });
}

export function qdiyPosterDeleteApi(id) {
  return request({ url: `/admin/platform/qdiy/poster/delete/${id}`, method: 'get' });
}

/** ---------------- 素材管理 ---------------- */

export function qdiyMaterialGroupListApi() {
  return request({ url: '/admin/platform/qdiy/material/group/list', method: 'get' });
}

export function qdiyMaterialListApi(params) {
  return request({ url: '/admin/platform/qdiy/material/list', method: 'get', params });
}

export function qdiyMaterialSaveApi(data) {
  return request({ url: '/admin/platform/qdiy/material/save', method: 'post', data });
}

export function qdiyMaterialUpdateApi(data) {
  return request({ url: '/admin/platform/qdiy/material/update', method: 'post', data });
}

export function qdiyMaterialMoveApi(pid, idList) {
  return request({ url: '/admin/platform/qdiy/material/move', method: 'post', params: { pid }, data: idList });
}

export function qdiyMaterialDeleteApi(idList) {
  return request({ url: '/admin/platform/qdiy/material/delete', method: 'post', data: idList });
}

/** ---------------- 模板市场 ---------------- */

export function qdiyMarketListApi(params) {
  return request({ url: '/admin/platform/qdiy/market/list', method: 'get', params });
}

export function qdiyMarketInfoApi(id) {
  return request({ url: `/admin/platform/qdiy/market/info/${id}`, method: 'get' });
}

export function qdiyMarketReceiveApi(id) {
  return request({ url: `/admin/platform/qdiy/market/receive/${id}`, method: 'get' });
}

/** 后台维护用的模板详情：未上架也能取到，用于编辑回填 */
export function qdiyMarketDetailApi(id) {
  return request({ url: `/admin/platform/qdiy/market/detail/${id}`, method: 'get' });
}

export function qdiyMarketSaveApi(data) {
  return request({ url: '/admin/platform/qdiy/market/save', method: 'post', data });
}

export function qdiyMarketUpdateApi(data) {
  return request({ url: '/admin/platform/qdiy/market/update', method: 'post', data });
}

export function qdiyMarketOnSaleApi(params) {
  return request({ url: '/admin/platform/qdiy/market/onsale', method: 'get', params });
}

export function qdiyMarketDeleteApi(id) {
  return request({ url: `/admin/platform/qdiy/market/delete/${id}`, method: 'get' });
}

export function qdiyMarketOrderListApi(params) {
  return request({ url: '/admin/platform/qdiy/market/order/list', method: 'get', params });
}

/** ---------------- 我的模板 ---------------- */

export function qdiyMyTemplateListApi(params) {
  return request({ url: '/admin/platform/qdiy/mytemplate/list', method: 'get', params });
}

export function qdiyMyTemplateInfoApi(id) {
  return request({ url: `/admin/platform/qdiy/mytemplate/info/${id}`, method: 'get' });
}

export function qdiyMyTemplateUseApi(params) {
  return request({ url: '/admin/platform/qdiy/mytemplate/use', method: 'get', params });
}

export function qdiyMyTemplateDeleteApi(id) {
  return request({ url: `/admin/platform/qdiy/mytemplate/delete/${id}`, method: 'get' });
}
