/**
 * 仓储物流 API — 对应 tjMall-warehouse 服务
 */
import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const baseURL = SettingMer.apiBaseURL3;

// ==================== 仓库 ====================
export const warehouseApi = {
  page: (data) => request({ url: '/api/warehouse/warehouse/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/warehouse/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/warehouse/add', method: 'post', data, baseURL }),
  edit: (data) => request({ url: '/api/warehouse/warehouse/edit', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/warehouse/delete/${id}`, method: 'post', baseURL }),
};

// ==================== 库存 ====================
export const stockApi = {
  page: (data) => request({ url: '/api/warehouse/stock/page', method: 'post', data, baseURL }),
  // params: warehouseId, productId, platformType, delta
  adjust: (params) => request({ url: '/api/warehouse/stock/adjust', method: 'post', params, baseURL }),
  updateWarn: (id, warnNum) => request({ url: `/api/warehouse/stock/update/warn/${id}`, method: 'post', params: { warnNum }, baseURL }),
};

// ==================== 物料 (复用商品库) ====================
export const materialApi = {
  page: (params) => request({ url: '/api/warehouse/material/page', method: 'get', params, baseURL }),
};

// ==================== 盘点单 ====================
export const stockCheckApi = {
  page: (data) => request({ url: '/api/warehouse/stockCheck/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/stockCheck/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/stockCheck/add', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/stockCheck/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/stockCheck/cancel/${id}`, method: 'post', baseURL }),
};

// ==================== 入库 ====================
export const inboundApi = {
  page: (data) => request({ url: '/api/warehouse/inbound/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/inbound/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/inbound/add', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/inbound/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/inbound/cancel/${id}`, method: 'post', baseURL }),
};

// ==================== 出库 ====================
export const outboundApi = {
  page: (data) => request({ url: '/api/warehouse/outbound/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/outbound/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/outbound/add', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/outbound/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/outbound/cancel/${id}`, method: 'post', baseURL }),
};

// ==================== 采购发货单 ====================
export const deliverApi = {
  page: (data) => request({ url: '/api/warehouse/deliver/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/deliver/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/deliver/add', method: 'post', data, baseURL }),
  deliver: (id, params) => request({ url: `/api/warehouse/deliver/deliver/${id}`, method: 'post', params, baseURL }),
  generateInbound: (id) => request({ url: `/api/warehouse/deliver/generateInbound/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/deliver/cancel/${id}`, method: 'post', baseURL }),
};

// ==================== 4 类审批单 (报损 / 领用 / 调拨 / 退库) ====================
const approvalOps = (path) => ({
  page: (data) => request({ url: `/api/warehouse/${path}/page`, method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/${path}/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: `/api/warehouse/${path}/add`, method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/${path}/submit/${id}`, method: 'post', baseURL }),
});
export const damageApi = approvalOps('damage');
export const receiveApi = approvalOps('receive');
export const transferApi = approvalOps('transfer');
export const returnApi = approvalOps('return');

// ==================== 库存流水 ====================
export const stockRecordApi = {
  page: (data) => request({ url: '/api/warehouse/stockRecord/page', method: 'post', data, baseURL }),
};

// ==================== 效期预警 / 购销存 / 统计 ====================
export const expiryApi = {
  warning: (params) => request({ url: '/api/warehouse/expiry/warning', method: 'get', params, baseURL }),
};

export const pssApi = {
  report: (params) => request({ url: '/api/warehouse/pss/report', method: 'get', params, baseURL }),
};

export const statsApi = {
  summary: () => request({ url: '/api/warehouse/stats/summary', method: 'get', baseURL }),
  trend: (days = 7) => request({ url: '/api/warehouse/stats/trend', method: 'get', params: { days }, baseURL }),
  warehouseStock: () => request({ url: '/api/warehouse/stats/warehouse/stock', method: 'get', baseURL }),
};
