import request from '@/utils/request';

const base = '/api/admin/logistics/jdl';

export const jdlLogisticsApi = {
  waybillInfo: (waybillCode) => request({ url: `${base}/waybill/info`, method: 'get', params: { waybillCode } }),
  waybillAttachment: (waybillCode) => request({ url: `${base}/waybill/attachment`, method: 'get', params: { waybillCode } }),
  orderStatus: (params) => request({ url: `${base}/order/status`, method: 'get', params }),
  trace: (waybillCode) => request({ url: `${base}/waybill/trace`, method: 'get', params: { waybillCode } }),
  location: (waybillCode) => request({ url: `${base}/waybill/location`, method: 'get', params: { waybillCode } }),
  deliveryTime: (waybillCode) => request({ url: `${base}/waybill/delivery-time`, method: 'get', params: { waybillCode } }),
  verifyReceiver: (data) => request({ url: `${base}/receiver/verify`, method: 'post', data }),
  nearbySites: (params) => request({ url: `${base}/sites/nearby`, method: 'get', params }),
  freight: (data) => request({ url: `${base}/freight/query`, method: 'post', data }),
  actualFreight: (waybillCode) => request({ url: `${base}/freight/actual`, method: 'get', params: { waybillCode } }),
  removeIntercept: (data) => request({ url: `${base}/order/intercept/cancel`, method: 'post', data }),
  cancelOrder: (data) => request({ url: `${base}/order/cancel`, method: 'post', data }),
};

