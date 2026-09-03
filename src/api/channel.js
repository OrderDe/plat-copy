import request from '@/utils/request';

// 第三方私域渠道
export function channelListApi(params) {
  return request({ url: '/admin/platform/channel/list', method: 'get', params });
}

export function channelDetailApi(id) {
  return request({ url: `/admin/platform/channel/detail/${id}`, method: 'get' });
}

export function channelSaveApi(data) {
  return request({ url: '/admin/platform/channel/save', method: 'post', data });
}

export function channelAdminListApi(channelId) {
  return request({ url: `/admin/platform/channel/admin/list/${channelId}`, method: 'get' });
}

export function channelDeleteApi(id) {
  return request({ url: `/admin/platform/channel/delete/${id}`, method: 'post' });
}

export function channelOrderListApi(params) {
  return request({ url: '/admin/platform/channel/order/list', method: 'get', params });
}

export function channelOrderDetailApi(orderNo) {
  return request({ url: `/admin/platform/channel/order/detail/${encodeURIComponent(orderNo)}`, method: 'get' });
}

export function channelOrderTemplateApi() {
  return request({ url: '/admin/platform/channel/order/template', method: 'get', responseType: 'blob' });
}

export function channelOrderImportApi(data) {
  return request({ url: '/admin/platform/channel/order/import', method: 'post', data });
}

export function channelImportRecordApi(params) {
  return request({ url: '/admin/platform/channel/order/import/record', method: 'get', params });
}

export function channelAssignWarehouseApi(params) {
  return request({ url: '/admin/platform/channel/order/warehouse/assign', method: 'post', params });
}

export function channelPushWarehouseApi(params) {
  return request({ url: '/admin/platform/channel/order/warehouse/push', method: 'post', params });
}

export function channelShipApi(data) {
  return request({ url: '/admin/platform/channel/order/ship', method: 'post', data });
}

export function channelCancelApi(params) {
  return request({ url: '/admin/platform/channel/order/cancel', method: 'post', params });
}
