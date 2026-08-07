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

// ==================== 货架 ====================
export const shelfApi = {
  page: (data) => request({ url: '/api/warehouse/shelf/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/shelf/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/shelf/add', method: 'post', data, baseURL }),
  edit: (data) => request({ url: '/api/warehouse/shelf/edit', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/shelf/delete/${id}`, method: 'post', baseURL }),
  batchGenerate: (data) => request({ url: '/api/warehouse/shelf/batchGenerate', method: 'post', data, baseURL }),
};

// ==================== 库位 ====================
export const locationApi = {
  list: (shelfId) => request({ url: '/api/warehouse/location/list', method: 'get', params: { shelfId }, baseURL }),
  add: (data) => request({ url: '/api/warehouse/location/add', method: 'post', data, baseURL }),
  edit: (data) => request({ url: '/api/warehouse/location/edit', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/location/delete/${id}`, method: 'post', baseURL }),
  batchGenerate: (data) => request({ url: '/api/warehouse/location/batchGenerate', method: 'post', data, baseURL }),
  updateStatus: (id, status) => request({ url: '/api/warehouse/location/updateStatus', method: 'post', params: { id, status }, baseURL }),
};

// ==================== 批次 ====================
export const batchApi = {
  page: (data) => request({ url: '/api/warehouse/batch/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/batch/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/batch/add', method: 'post', data, baseURL }),
  edit: (data) => request({ url: '/api/warehouse/batch/edit', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/batch/delete/${id}`, method: 'post', baseURL }),
  freeze: (id) => request({ url: `/api/warehouse/batch/freeze/${id}`, method: 'post', baseURL }),
  unfreeze: (id) => request({ url: `/api/warehouse/batch/unfreeze/${id}`, method: 'post', baseURL }),
  fifo: (params) => request({ url: '/api/warehouse/batch/fifo', method: 'get', params, baseURL }),
  fefo: (params) => request({ url: '/api/warehouse/batch/fefo', method: 'get', params, baseURL }),
  expiryWarning: (params) => request({ url: '/api/warehouse/batch/expiryWarning', method: 'get', params, baseURL }),
};

// ==================== 上架 / 移库 / 补货 ====================
export const relocateApi = {
  page: (data) => request({ url: '/api/warehouse/relocate/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/relocate/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/relocate/add', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/relocate/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/relocate/cancel/${id}`, method: 'post', baseURL }),
};

// ==================== 质检 ====================
export const inspectApi = {
  page: (data) => request({ url: '/api/warehouse/inspect/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/inspect/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/inspect/add', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/inspect/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/inspect/cancel/${id}`, method: 'post', baseURL }),
  createFromInbound: (inboundId, params) => request({ url: `/api/warehouse/inspect/createFromInbound/${inboundId}`, method: 'post', params, baseURL }),
};

// ==================== 波次 ====================
export const waveApi = {
  page: (data) => request({ url: '/api/warehouse/wave/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/wave/detail/${id}`, method: 'get', baseURL }),
  build: (data) => request({ url: '/api/warehouse/wave/build', method: 'post', data, baseURL }),
  release: (id) => request({ url: `/api/warehouse/wave/release/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/wave/cancel/${id}`, method: 'post', baseURL }),
  autoBuild: (params) => request({ url: '/api/warehouse/wave/autoBuild', method: 'post', params, baseURL }),
  batchPick: (waveId) => request({ url: `/api/warehouse/wave/batchPick/${waveId}`, method: 'get', baseURL }),
};

// ==================== 拣货 ====================
export const pickApi = {
  page: (data) => request({ url: '/api/warehouse/pick/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/pick/detail/${id}`, method: 'get', baseURL }),
  assign: (id, pickerId, pickerName) => request({ url: `/api/warehouse/pick/assign/${id}`, method: 'post', params: { pickerId, pickerName }, baseURL }),
  confirm: (id, pickedMap) => request({ url: `/api/warehouse/pick/confirm/${id}`, method: 'post', data: pickedMap, baseURL }),
};

// ==================== 复核 ====================
export const reviewApi = {
  page: (data) => request({ url: '/api/warehouse/review/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/review/detail/${id}`, method: 'get', baseURL }),
  createFromPick: (pickOrderId, params) => request({ url: `/api/warehouse/review/createFromPick/${pickOrderId}`, method: 'post', params, baseURL }),
  confirm: (id, reviewedMap) => request({ url: `/api/warehouse/review/confirm/${id}`, method: 'post', data: reviewedMap, baseURL }),
  reject: (id, reason) => request({ url: `/api/warehouse/review/reject/${id}`, method: 'post', params: { reason }, baseURL }),
};

// ==================== 库存 ====================
export const stockApi = {
  page: (data) => request({ url: '/api/warehouse/stock/page', method: 'post', data, baseURL }),
  pageAgg: (data) => request({ url: '/api/warehouse/stock/pageAgg', method: 'post', data, baseURL }),
  distribution: (params) => request({ url: '/api/warehouse/stock/distribution', method: 'get', params, baseURL }),
  adjust: (params) => request({ url: '/api/warehouse/stock/adjust', method: 'post', params, baseURL }),
  updateWarn: (id, warnNum) => request({ url: `/api/warehouse/stock/update/warn/${id}`, method: 'post', params: { warnNum }, baseURL }),
  freeze: (params) => request({ url: '/api/warehouse/stock/freeze', method: 'post', params, baseURL }),
  unfreeze: (params) => request({ url: '/api/warehouse/stock/unfreeze', method: 'post', params, baseURL }),
  occupy: (params) => request({ url: '/api/warehouse/stock/occupy', method: 'post', params, baseURL }),
  releaseOccupy: (params) => request({ url: '/api/warehouse/stock/releaseOccupy', method: 'post', params, baseURL }),
};

// ==================== 盘点单 ====================
export const stockCheckApi = {
  page: (data) => request({ url: '/api/warehouse/stockCheck/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/stockCheck/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/stockCheck/add', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/stockCheck/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/stockCheck/cancel/${id}`, method: 'post', baseURL }),
  approve: (id, operator) => request({ url: `/api/warehouse/stockCheck/approve/${id}`, method: 'post', params: { operator }, baseURL }),
};

// ==================== 循环盘点计划 ====================
export const stockCheckPlanApi = {
  page: (data) => request({ url: '/api/warehouse/stockCheckPlan/page', method: 'post', data, baseURL }),
  add: (data) => request({ url: '/api/warehouse/stockCheckPlan/add', method: 'post', data, baseURL }),
  edit: (data) => request({ url: '/api/warehouse/stockCheckPlan/edit', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/stockCheckPlan/delete/${id}`, method: 'post', baseURL }),
  runOnce: (id, operator) => request({ url: `/api/warehouse/stockCheckPlan/runOnce/${id}`, method: 'post', params: { operator }, baseURL }),
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
export const returnApi = approvalOps('return');

// 调拨单：在通用审批操作基础上增加三阶段物流
export const transferApi = {
  ...approvalOps('transfer'),
  ship: (id, params) => request({ url: `/api/warehouse/transfer/ship/${id}`, method: 'post', params, baseURL }),
  receive: (id, operator) => request({ url: `/api/warehouse/transfer/receive/${id}`, method: 'post', params: { operator }, baseURL }),
  cancelShip: (id) => request({ url: `/api/warehouse/transfer/cancelShip/${id}`, method: 'post', baseURL }),
};

// ==================== 智能分仓 ====================
export const allocateApi = {
  preview: (data) => request({ url: '/api/warehouse/allocate/preview', method: 'post', data, baseURL }),
  createOutbounds: (data, operator) => request({ url: '/api/warehouse/allocate/createOutbounds', method: 'post', data, params: { operator }, baseURL }),
};

// ==================== 库存流水 ====================
export const stockRecordApi = {
  page: (data) => request({ url: '/api/warehouse/stockRecord/page', method: 'post', data, baseURL }),
};

// ==================== 装箱管理 ====================
export const packageApi = {
  page: (data) => request({ url: '/api/warehouse/package/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/package/detail/${id}`, method: 'get', baseURL }),
  save: (data) => request({ url: '/api/warehouse/package/save', method: 'post', data, baseURL }),
  seal: (id, operator) => request({ url: `/api/warehouse/package/seal/${id}`, method: 'post', params: { operator }, baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/package/cancel/${id}`, method: 'post', baseURL }),
  listByOutbound: (outboundId) => request({ url: '/api/warehouse/package/listByOutbound', method: 'get', params: { outboundId }, baseURL }),
  progress: (outboundId) => request({ url: '/api/warehouse/package/progress', method: 'get', params: { outboundId }, baseURL }),
  quickPack: (outboundId, operator) => request({ url: '/api/warehouse/package/quickPack', method: 'post', params: { outboundId, operator }, baseURL }),
  createFromReview: (reviewId, operator) => request({ url: `/api/warehouse/package/createFromReview/${reviewId}`, method: 'post', params: { operator }, baseURL }),
  deliver: (id, params) => request({ url: `/api/warehouse/package/deliver/${id}`, method: 'post', params, baseURL }),
  deliverByOutbound: (params) => request({ url: '/api/warehouse/package/deliverByOutbound', method: 'post', params, baseURL }),
};

// ==================== 智能补货 ====================
export const replenishApi = {
  rulePage: (params) => request({ url: '/api/warehouse/replenish/rule/page', method: 'get', params, baseURL }),
  ruleSave: (data) => request({ url: '/api/warehouse/replenish/rule/save', method: 'post', data, baseURL }),
  ruleDel: (id) => request({ url: `/api/warehouse/replenish/rule/delete/${id}`, method: 'post', baseURL }),
  suggestionPage: (params) => request({ url: '/api/warehouse/replenish/suggestion/page', method: 'get', params, baseURL }),
  scan: (params) => request({ url: '/api/warehouse/replenish/scan', method: 'post', params, baseURL }),
  convert: (ids, operator) => request({ url: '/api/warehouse/replenish/convert', method: 'post', data: ids, params: { operator }, baseURL }),
  ignore: (ids) => request({ url: '/api/warehouse/replenish/ignore', method: 'post', data: ids, baseURL }),
};

// ==================== 打印中心 ====================
export const printApi = {
  page: (params) => request({ url: '/api/warehouse/print/template/page', method: 'get', params, baseURL }),
  add: (data) => request({ url: '/api/warehouse/print/template/add', method: 'post', data, baseURL }),
  edit: (data) => request({ url: '/api/warehouse/print/template/edit', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/print/template/delete/${id}`, method: 'post', baseURL }),
  getDefault: (bizType) => request({ url: '/api/warehouse/print/template/default', method: 'get', params: { bizType }, baseURL }),
  data: (bizType, docId) => request({ url: '/api/warehouse/print/data', method: 'get', params: { bizType, docId }, baseURL }),
  render: (templateId, docId) => request({ url: '/api/warehouse/print/render', method: 'get', params: { templateId, docId }, baseURL }),
};

// ==================== 单据编号规则 ====================
export const noRuleApi = {
  page: (params) => request({ url: '/api/warehouse/noRule/page', method: 'get', params, baseURL }),
  add: (data) => request({ url: '/api/warehouse/noRule/add', method: 'post', data, baseURL }),
  edit: (data) => request({ url: '/api/warehouse/noRule/edit', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/noRule/delete/${id}`, method: 'post', baseURL }),
  preview: (bizType) => request({ url: '/api/warehouse/noRule/preview', method: 'get', params: { bizType }, baseURL }),
};

// ==================== 成本核算 ====================
export const costApi = {
  report: (params) => request({ url: '/api/warehouse/cost/report', method: 'get', params, baseURL }),
  summary: (warehouseId) => request({ url: '/api/warehouse/cost/summary', method: 'get', params: { warehouseId }, baseURL }),
  avgCost: (params) => request({ url: '/api/warehouse/cost/avgCost', method: 'get', params, baseURL }),
  adjust: (params) => request({ url: '/api/warehouse/cost/adjust', method: 'post', params, baseURL }),
};

// ==================== 报表 ====================
export const reportApi = {
  dashboard: (params) => request({ url: '/api/warehouse/report/dashboard', method: 'get', params, baseURL }),
  aging: (params) => request({ url: '/api/warehouse/report/aging', method: 'get', params, baseURL }),
  slowMoving: (params) => request({ url: '/api/warehouse/report/slowMoving', method: 'get', params, baseURL }),
  turnover: (params) => request({ url: '/api/warehouse/report/turnover', method: 'get', params, baseURL }),
};

