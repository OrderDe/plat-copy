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

// ==================== 字典 ====================
// 单据类型等枚举统一由 wms_dict 维护，前端不再硬编码
export const dictApi = {
  items: (dictType) => request({ url: '/api/warehouse/dict/items', method: 'get', params: { dictType }, baseURL }),
  page: (data) => request({ url: '/api/warehouse/dict/page', method: 'post', data, baseURL }),
  save: (data) => request({ url: '/api/warehouse/dict/save', method: 'post', data, baseURL }),
  del: (id) => request({ url: `/api/warehouse/dict/delete/${id}`, method: 'post', baseURL }),
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
  /** 按仓库列出启用中的库位：拣货时货没上架、库存分布没库位时兜底给拣货员挑 */
  listByWarehouse: (warehouseId) => request({ url: '/api/warehouse/location/listByWarehouse', method: 'get', params: { warehouseId }, baseURL }),
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
  unbatchedNum: (params) => request({ url: '/api/warehouse/batch/unbatchedNum', method: 'get', params, baseURL }),
  inboundSum: (params) => request({ url: '/api/warehouse/batch/inboundSum', method: 'get', params, baseURL }),
  fifo: (params) => request({ url: '/api/warehouse/batch/fifo', method: 'get', params, baseURL }),
  fefo: (params) => request({ url: '/api/warehouse/batch/fefo', method: 'get', params, baseURL }),
  leastRemain: (params) => request({ url: '/api/warehouse/batch/leastRemain', method: 'get', params, baseURL }),
  // 建出库单选批次用，支持 minShelfLifeDays 过滤剩余效期
  pickable: (params) => request({ url: '/api/warehouse/batch/pickable', method: 'get', params, baseURL }),
  expiryWarning: (params) => request({ url: '/api/warehouse/batch/expiryWarning', method: 'get', params, baseURL }),
};

// ==================== 上架 / 移库 / 补货 ====================
export const relocateApi = {
  page: (data) => request({ url: '/api/warehouse/relocate/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/relocate/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/relocate/add', method: 'post', data, baseURL }),
  update: (data) => request({ url: '/api/warehouse/relocate/update', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/relocate/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/relocate/cancel/${id}`, method: 'post', baseURL }),
};

// ==================== 质检 ====================
export const inspectApi = {
  page: (data) => request({ url: '/api/warehouse/inspect/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/inspect/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/inspect/add', method: 'post', data, baseURL }),
  update: (data) => request({ url: '/api/warehouse/inspect/update', method: 'post', data, baseURL }),
  submit: (id, params) => request({ url: `/api/warehouse/inspect/submit/${id}`, method: 'post', params, baseURL }),
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
  confirm: (id, pickedMap, params) => request({ url: `/api/warehouse/pick/confirm/${id}`, method: 'post', data: pickedMap, params, baseURL }),
  /** 保存拣货库位选择：{ pickItemId: locationId }，值为 null 表示改回通用池 */
  saveLocations: (id, locationMap) => request({ url: `/api/warehouse/pick/locations/${id}`, method: 'post', data: locationMap, baseURL }),
  /** 缺货终止：整单拣不到货，作废拣货单并记录原因 */
  shortage: (id, reason, params) => request({ url: `/api/warehouse/pick/shortage/${id}`, method: 'post', params: { reason, ...params }, baseURL }),
};

// ==================== 复核 ====================
export const reviewApi = {
  page: (data) => request({ url: '/api/warehouse/review/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/review/detail/${id}`, method: 'get', baseURL }),
  createFromPick: (pickOrderId, params) => request({ url: `/api/warehouse/review/createFromPick/${pickOrderId}`, method: 'post', params, baseURL }),
  confirm: (id, reviewedMap, params) => request({ url: `/api/warehouse/review/confirm/${id}`, method: 'post', data: reviewedMap, params, baseURL }),
  reject: (id, reason) => request({ url: `/api/warehouse/review/reject/${id}`, method: 'post', params: { reason }, baseURL }),
  /** 复核通过后取号的结果：出库单号 + 承运商 + 运单号，用于给操作员一个明确回执 */
  shipInfo: (id) => request({ url: `/api/warehouse/review/shipInfo/${id}`, method: 'get', baseURL }),
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
// 流程：新增(草稿) → 生成明细(待反馈) → 打印线下盘 → 录入反馈(已反馈)
//      → 提交审批(审批中，发起 flowable 流程 wms_stockCheck)
//      → 审批回调：通过(已归档，联动库存) / 驳回(已驳回，可改反馈后重提)
export const stockCheckApi = {
  page: (data) => request({ url: '/api/warehouse/stockCheck/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/stockCheck/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/stockCheck/add', method: 'post', data, baseURL }),
  /** 按仓库+品类+货架从库存自动展开应盘明细 */
  generate: (data) => request({ url: '/api/warehouse/stockCheck/generate', method: 'post', data, baseURL }),
  /** 打印数据：不含金额，盲盘不含账面数 */
  printData: (id) => request({ url: `/api/warehouse/stockCheck/printData/${id}`, method: 'get', baseURL }),
  /** 保存反馈；data.submit=true 时保存后直接提交审核 */
  feedback: (data) => request({ url: '/api/warehouse/stockCheck/feedback', method: 'post', data, baseURL }),
  /** 某条明细可关联的报损单：同仓、含该 SKU、未驳回未作废 */
  damageOptions: (detailId) => request({ url: `/api/warehouse/stockCheck/damageOptions/${detailId}`, method: 'get', baseURL }),
  /** 提交审批：以盘点人身份发起 flowable 审批流，回填 approvalInstanceId */
  submitAudit: (id, submitUser) => request({ url: `/api/warehouse/stockCheck/submitAudit/${id}`, method: 'post', params: { submitUser }, baseURL }),
  /** 人工兜底审核入口 { checkId, pass, comment, auditUser }，正常流程走审批中心 */
  audit: (data) => request({ url: '/api/warehouse/stockCheck/audit', method: 'post', data, baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/stockCheck/cancel/${id}`, method: 'post', baseURL }),
};

// ==================== 入库 ====================
export const inboundApi = {
  page: (data) => request({ url: '/api/warehouse/inbound/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/inbound/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/inbound/add', method: 'post', data, baseURL }),
  update: (data) => request({ url: '/api/warehouse/inbound/update', method: 'post', data, baseURL }),
  submit: (id) => request({ url: `/api/warehouse/inbound/submit/${id}`, method: 'post', baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/inbound/cancel/${id}`, method: 'post', baseURL }),
  /** 退货入库可关联的售后单（已排除建过入库单的） */
  refundOptions: (params) => request({ url: '/api/warehouse/inbound/refundOptions', method: 'get', params, baseURL }),
  transferOptions: (params) => request({ url: '/api/warehouse/inbound/transferOptions', method: 'get', params, baseURL }),
};

// ==================== 出库 ====================
export const outboundApi = {
  page: (data) => request({ url: '/api/warehouse/outbound/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/outbound/detail/${id}`, method: 'get', baseURL }),
  add: (data) => request({ url: '/api/warehouse/outbound/add', method: 'post', data, baseURL }),
  cancel: (id) => request({ url: `/api/warehouse/outbound/cancel/${id}`, method: 'post', baseURL }),
  /** 可关联的源单（1调拨/2报损/3领用）：审批通过且未被占用，含带出的明细 */
  sourceOptions: (type, warehouseId) => request({ url: '/api/warehouse/outbound/sourceOptions', method: 'get', params: { type, warehouseId }, baseURL }),
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

// ==================== 库存流水 ====================
export const stockRecordApi = {
  page: (data) => request({ url: '/api/warehouse/stockRecord/page', method: 'post', data, baseURL }),
};

// ==================== 出库交接（快递员取件确认） ====================
export const handoverApi = {
  // 待交接：已生效但还没登记交接的出库单
  pending: (params) => request({ url: '/api/warehouse/handover/pending', method: 'get', params, baseURL }),
  create: (data) => request({ url: '/api/warehouse/handover/create', method: 'post', data, baseURL }),
  page: (data) => request({ url: '/api/warehouse/handover/page', method: 'post', data, baseURL }),
  detail: (id) => request({ url: `/api/warehouse/handover/detail/${id}`, method: 'get', baseURL }),
  // 交接与承运商揽收状态对不上的异常清单
  exceptionPage: (data) => request({ url: '/api/warehouse/handover/exception/page', method: 'post', data, baseURL }),
  exceptionPendingCount: (params) => request({ url: '/api/warehouse/handover/exception/pendingCount', method: 'get', params, baseURL }),
  exceptionHandle: (params) => request({ url: '/api/warehouse/handover/exception/handle', method: 'post', params, baseURL }),
  exceptionScan: () => request({ url: '/api/warehouse/handover/exception/scan', method: 'post', baseURL }),
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


// ==================== 仓储同步异常 ====================
// 注意 baseURL：这些记录存在商城主库(eb_warehouse_sync_fail)、由 tjMall-admin 提供，
// 不走仓储服务(baseURL3)，所以这里用默认 baseURL。
export const syncFailApi = {
  page: (params) => request({ url: '/admin/platform/warehouse/sync-fail/list', method: 'get', params }),
  retry: (id, operator) => request({ url: `/admin/platform/warehouse/sync-fail/retry/${id}`, method: 'post', params: { operator } }),
  handle: (id, status, remark, operator) => request({ url: `/admin/platform/warehouse/sync-fail/handle/${id}`, method: 'post', params: { status, remark, operator } }),
  /** 发货异常一键整单退款：仅 ORDER_SHIP 待处理记录可用，退款成功后自动标记已处理 */
  refund: (id, operator) => request({ url: `/admin/platform/warehouse/sync-fail/refund/${id}`, method: 'post', params: { operator } }),
  // 复用定时任务的兜底触发入口，批量重试行为与自动补偿完全一致
  retryAll: () => request({ url: '/admin/warehouse/refund-inbound/retry-once', method: 'post' }),
};
