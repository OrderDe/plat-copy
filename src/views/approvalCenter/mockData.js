// 待办 / 详情 / 抄送 / 我发起 / 已办 假数据 (后端接口就绪后可删)
export const MOCK_APPROVALS = [
  {
    id: 101, bizType: '商品上架审核', title: '有机蓝莓 500g',
    submitter: '田家小铺', submitTime: '2026-08-03 09:12',
    status: 'processing', currentNode: '复审', amount: 12800, canApprove: true,
    bizData: { 商品名称: '有机蓝莓 500g', 分类: '生鲜/水果', 价格: '¥ 39.9', 库存: 320, 供应商: '田家有机农场', 生产日期: '2026-08-01' },
    steps: [
      { name: '商户提交', user: '田家小铺', time: '08-03 09:12', status: 'done', comment: '提交上架申请' },
      { name: '初审 (或签)', user: '张三', time: '08-03 10:30', status: 'done', comment: '商品资质齐全,同意' },
      { name: '复审 (会签)', user: '李四(我) / 赵六', time: '', status: 'active', comment: '赵六已通过,等待我审批' },
      { name: '终审', user: '王五', time: '', status: 'wait' },
    ],
  },
  {
    id: 102, bizType: '店铺信息变更', title: '山货优选 - 修改店铺Logo',
    submitter: '山货优选', submitTime: '2026-08-03 08:45',
    status: 'processing', currentNode: '审核', canApprove: true,
    bizData: { 店铺名称: '山货优选', 变更项: 'Logo', 变更原因: '品牌升级' },
    steps: [
      { name: '商户提交', user: '山货优选', time: '08-03 08:45', status: 'done' },
      { name: '审核', user: '李四(我)', time: '', status: 'active' },
    ],
  },
  {
    id: 103, bizType: '提现审核', title: '田家小铺 - 提现 ¥ 5,600',
    submitter: '田家小铺', submitTime: '2026-08-03 07:20',
    status: 'processing', currentNode: '主管复核', canApprove: true,
    bizData: { 提现金额: '¥ 5,600', 收款账户: '****6789 (工商银行)', 可提现余额: '¥ 8,320' },
    steps: [
      { name: '商户提交', user: '田家小铺', time: '08-03 07:20', status: 'done' },
      { name: '财务审核', user: '陈七', time: '08-03 08:00', status: 'done', comment: '金额无异常' },
      { name: '主管复核', user: '李四(我)', time: '', status: 'active' },
    ],
  },
];

export const MOCK_MINE = [
  { id: 201, bizType: '商品上架', title: '手工红糖 250g', status: 'processing', currentNode: '复审 - 李四', submitTime: '2026-08-03 06:15', waitHours: 3 },
  { id: 202, bizType: '商品上架', title: '五常大米 5kg', status: 'rejected', rejectNode: '初审', rejectReason: '商品图片不清晰,请重新上传', submitTime: '2026-08-02 15:20' },
  { id: 203, bizType: '店铺装修', title: '店铺装修变更', status: 'approved', submitTime: '2026-07-30 10:00', finishTime: '2026-08-01 16:20' },
];

export const MOCK_DONE = [
  { id: 301, bizType: '商品上架', title: '云南普洱茶 357g', submitter: '茶山优品', myRole: '复审', result: 'approved', finishTime: '2026-08-02 16:45' },
  { id: 302, bizType: '店铺入驻', title: '优鲜果园 入驻申请', submitter: '优鲜果园', myRole: '审核', result: 'rejected', finishTime: '2026-07-30 14:00' },
  { id: 303, bizType: '提现审核', title: '茶山优品 提现 ¥ 12,000', submitter: '茶山优品', myRole: '复核', result: 'approved', finishTime: '2026-07-29 11:20' },
];

export const MOCK_CC = [
  { id: 401, bizType: '商品下架', title: '临期食品礼包', from: '张三', time: '2026-08-03 08:30', read: false },
  { id: 402, bizType: '提现审核', title: '田家小铺 - 提现 ¥ 5,600', from: '系统', time: '2026-08-03 07:20', read: true },
];
