/**
 * 个人中心默认配置
 *
 * 分区与功能项参照现有商城个人中心页的结构；每项都能单独开关、换图标、排序。
 * icon 留空时前端用 iconClass 的内置图标兜底 —— 平台端没有原商城那批图标资源，
 * 与其挂一堆加载不出来的图片地址，不如内置图标 + 需要时自己传图。
 */
export const USER_CENTER_SECTIONS = [
  {
    key: 'header',
    title: '头部区域',
    items: [
      { key: 'sign', name: '签到', iconClass: 'el-icon-date', color: '#FF9F1C', link: '/pages/user/signIn/index' },
      { key: 'setting', name: '设置', iconClass: 'el-icon-setting', color: '#8E9AAF', link: '/pages/user/setting/index' },
    ],
  },
  {
    key: 'member',
    title: '会员专区',
    items: [
      { key: 'member', name: '会员', iconClass: 'el-icon-medal', color: '#E8B339', link: '/pages/user/vip/index' },
      { key: 'coupon', name: '我的券包', iconClass: 'el-icon-tickets', color: '#F56C6C', link: '/pages/user/coupon/index' },
      { key: 'balance', name: '储值卡', iconClass: 'el-icon-bank-card', color: '#409EFF', link: '/pages/user/balance/index' },
    ],
  },
  {
    key: 'order',
    title: '订单模块',
    items: [
      { key: 'unpaid', name: '待付款', iconClass: 'el-icon-wallet', color: '#F56C6C', link: '/pages/order/list?status=0' },
      { key: 'undelivered', name: '待发货', iconClass: 'el-icon-box', color: '#E6A23C', link: '/pages/order/list?status=1' },
      { key: 'unreceived', name: '待收货', iconClass: 'el-icon-truck', color: '#409EFF', link: '/pages/order/list?status=2' },
      { key: 'refund', name: '退换货', iconClass: 'el-icon-refresh-left', color: '#909399', link: '/pages/order/refund' },
    ],
  },
  {
    key: 'distribution',
    title: '分销功能',
    items: [
      { key: 'experience', name: '体验官', iconClass: 'el-icon-position', color: '#F56C6C', link: '/pages/distribution/index' },
      { key: 'channel', name: '渠道中心', iconClass: 'el-icon-user', color: '#409EFF', link: '/pages/distribution/channel' },
      { key: 'team', name: '团队收益', iconClass: 'el-icon-s-custom', color: '#67C23A', link: '/pages/distribution/team' },
    ],
  },
  {
    key: 'marketing',
    title: '营销功能',
    items: [
      { key: 'group', name: '拼团活动', iconClass: 'el-icon-s-flag', color: '#F56C6C', link: '/pages/activity/group' },
      { key: 'bargain', name: '我的砍价', iconClass: 'el-icon-price-tag', color: '#E6A23C', link: '/pages/activity/bargain' },
      { key: 'seckill', name: '限时限购', iconClass: 'el-icon-alarm-clock', color: '#FF7A45', link: '/pages/activity/seckill' },
      { key: 'integral', name: '积分商城', iconClass: 'el-icon-coin', color: '#E8B339', link: '/pages/integral/index' },
      { key: 'lottery', name: '大转盘', iconClass: 'el-icon-refresh', color: '#AA4DF1', link: '/pages/activity/lottery' },
      { key: 'record', name: '中奖记录', iconClass: 'el-icon-trophy', color: '#F5A623', link: '/pages/activity/record' },
    ],
  },
  {
    key: 'service',
    title: '其他功能',
    items: [
      { key: 'address', name: '收货地址', iconClass: 'el-icon-location-outline', color: '#409EFF', link: '/pages/user/address/index' },
      { key: 'collect', name: '我的收藏', iconClass: 'el-icon-star-off', color: '#F56C6C', link: '/pages/user/collect/index' },
      { key: 'service', name: '联系客服', iconClass: 'el-icon-service', color: '#67C23A', link: '/pages/user/service/index' },
      { key: 'feedback', name: '意见反馈', iconClass: 'el-icon-edit-outline', color: '#909399', link: '/pages/user/feedback/index' },
    ],
  },
];

/** 头部展示项：余额、积分这些数字块 */
export const USER_CENTER_HEADER = {
  /**
   * 头部背景：
   *   theme  = 跟随全局配置的主题色（默认，与改动前行为一致）
   *   solid  = 自定义纯色
   *   linear = 自定义渐变，从 bgColor 到 bgColorEnd
   */
  bgMode: 'theme',
  bgColor: '#F54B4A',
  bgColorEnd: '#FF8A3D',
  /** 渐变角度，0=从上到下，90=从左到右 */
  bgAngle: 135,
  showAsset: true,
  showLevel: true,
  assets: [
    { key: 'integral', name: '积分', enable: true },
    { key: 'redPacket', name: '红包', enable: true },
    { key: 'balance', name: '储值余额', enable: true },
    { key: 'income', name: '累计收益', enable: true },
  ],
};

/** 深拷贝一份默认配置，避免默认对象被就地改掉 */
export function buildDefaultConfig() {
  return {
    header: JSON.parse(JSON.stringify(USER_CENTER_HEADER)),
    sections: USER_CENTER_SECTIONS.map((section) => ({
      key: section.key,
      title: section.title,
      enable: true,
      items: section.items.map((item) => ({ ...item, enable: true, icon: '' })),
    })),
  };
}
