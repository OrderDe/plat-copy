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

export function qdiyPageDeleteApi(id) {
  return request({ url: `/admin/platform/qdiy/page/delete/${id}`, method: 'get' });
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
