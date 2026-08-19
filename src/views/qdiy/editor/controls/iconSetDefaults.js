/**
 * diy-icon-set 的默认图标列表
 * 原样迁移自 PHP diy-icon-set.php（该文件里这段内联数据约 960 行）
 *
 * ⚠️ 两点需要按实际情况校准，本轮未改动，保持与 PHP 侧一致：
 *   1. img 是 PHP 商城 /diy/icon-set/ 下的图标资源，Java 平台端没有这批图片，
 *      使用前需要把图标传到素材库并替换路径，或给 DiyIconSet 传 staticImgPrefix。
 *   2. route 是 PHP 商城的页面路径，需与 TJ-UniAPP 的实际路由对齐后才能跳通。
 */
export const defaultIconList = [
        // 基础页面
        {
            img: "/diy/icon-set/mall-index.png",
            title: "商城首页",
            route: "/pages/index/index"
        },
        {
            img: "/diy/icon-set/all-menu.png",
            title: "全部分类",
            route: "/pages/menu/index"
        },
        {
            img: "/diy/icon-set/cart.png",
            title: "购物车",
            route: "/pages/cart/index"
        },
        {
            img: "/diy/icon-set/my-client.png",
            title: "我的客户",
            route: "plugins/public/promotion/client"
        },
        {
            img: "/diy/icon-set/all-menu.png",
            title: "全部分类2",
            route: "/plugins3/menu/index"
        },

        {
            img: "/diy/icon-set/my-order.png",
            title: "我的订单",
            route: "/plugins/pages/order/list?tabIndex=0"
        },
        {
            img: "/diy/icon-set/order-1.png",
            title: "待付款订单",
            route: "/plugins/pages/order/list?tabIndex=1"
        },
        {
            img: "/diy/icon-set/order-2.png",
            title: "待发货订单",
            route: "/plugins/pages/order/list?tabIndex=2"
        },
        {
            img: "/diy/icon-set/order-3.png",
            title: "待收货订单",
            route: "/plugins/pages/order/list?tabIndex=3"
        },
        {
            img: "/diy/icon-set/order-4.png",
            title: "待评价",
            route: "/plugins/pages/order/list?tabIndex=4"
        },
        {
            img: "/diy/icon-set/order-5.png",
            title: "退换货",
            route: "/plugins/pages/refund/list"
        },

        {
            img: "/diy/icon-set/my-order.png",
            title: "会员中心",
            route: "/pages/user/index"
        },
        {
            img: "/diy/icon-set/collect.png",
            title: "我的收藏",
            route: "/plugins/pages/center/keep"
        },
        {
            img: "/diy/icon-set/user-recharge.png",
            title: "会员充值",
            route: "/plugins/pages/center/recharge/recharge"
        },
        {
            img: "/diy/icon-set/balance-index.png",
            title: "余额明细",
            route: "/plugins/pages/assets/balance/index"
        },
        {
            img: "/diy/icon-set/currency-index.png",
            title: "积分明细",
            route: "/plugins/pages/assets/currency/index"
        },
        {
            img: "/diy/icon-set/withdraw-edit.png",
            title: "余额提现",
            route: "/plugins/pages/assets/withdraw/edit?from=2"
        },
        {
            img: "/diy/icon-set/user-info.png",
            title: "我的资料",
            route: "/plugins/pages/settings/userInfo"
        },
        {
            img: "/diy/icon-set/address.png",
            title: "收货地址",
            route: "/plugins/pages/settings/address"
        },
        {
            img: "/diy/icon-set/qr-code.png",
            title: "推广二维码",
            route: "/plugins/poster/index"
        },
        {
            img: "/diy/icon-set/promotion.png",
            title: "推广中心",
            route: "/plugins/public/promotion/index"
        },
        {
            img: "/diy/icon-set/transfer-money.png",
            title: "积分赠送",
            route: "/plugins/pages/assets/balance/transferMoney?modal_type=score"
        },
        {
            img: "/diy/icon-set/write-off.png",
            title: "核销",
            route: "/plugins4/WriteOff/index"
        },
        {
            img: "/diy/icon-set/merchant-promotion.png",
            title: "推广商家",
            route: "/plugins/public/merchantAuth/index?isEdit=1"
        },
        {
            img: "/diy/icon-set/marketing-language.png",
            title: "营销话术",
            route: "/plugins2/BusinessCard/MarketingLanguage/index"
        },
        {
            img: "/diy/icon-set/score-bonus.png",
            title: "积分分红",
            route: "/plugins/public/ScoreBonus/index"
        },
        {
            img: "/diy/icon-set/channel-store-supplement.png",
            title: "渠道分红店补收益",
            route: "/plugins/ChannelStoreSupplement/index"
        },

        //插件工具
        {
            img: "/diy/icon-set/coupon.png",
            title: "我的优惠券",
            route: "/plugins/pages/coupon/index"
        },
        {
            img: "/diy/icon-set/coupon.png",
            title: "领券中心",
            route: "/plugins/pages/coupon/center"
        },

        {
            img: "/diy/icon-set/distribution.png",
            title: "分销分红",
            route: "/plugins/distribution/index"
        },
        {
            img: "/diy/icon-set/premium-distribution.png",
            title: "特级分销",
            route: "/plugins/premiumDistribution/index"
        },
        {
            img: "/diy/icon-set/equity.png",
            title: "权益中心",
            route: "/plugins/public/promotion/rights?type=distribution"
        },
        {
            img: "/diy/icon-set/partner-index.png",
            title: "股东分红",
            route: "/plugins/partner/index"
        },
        {
            img: "/diy/icon-set/equity.png",
            title: "权益中心",
            route: "/plugins/public/promotion/rights?type=partner"
        },
        {
            "img": "/diy/icon-set/agent-index.png",
            title: "渠道中心",
            route: "/plugins3/agent/index"
        },
        {
            "img": "/diy/icon-set/equity.png",
            title: "权益中心",
            route: "/plugins/public/promotion/rights?type=agent"
        },
        {
            "img": "/diy/icon-set/little-red-book.png",
            "route": "/plugins/littleRedBook/index",
            "title": "小红书"
        },
        {
            "img": "/diy/icon-set/sign-in.png",
            "route": "/plugins3/sign_in/index",
            "title": "每日签到"
        },
        {
            "img": "/diy/icon-set/my-area.png",
            "route": "/plugins/area/my-area",
            "title": "区域管理"
        },
        {
            "img": "/diy/icon-set/audit-list.png",
            "route": "/plugins/area/audit-list",
            "title": "申请记录"
        },
        {
            "img": "/diy/icon-set/group-buy.png",
            title: "拼团首页",
            route: "/plugins2/GroupBuyCopy/index"
        },
        {
            "img": "/diy/icon-set/group-buy-list.png",
            title: "拼团订单",
            route: "/plugins2/GroupBuyCopy/orderList"
        },
        {
            "img": "/diy/icon-set/material.png",
            "route": "/plugins/material/index",
            "title": "素材中心"
        },
        {
            "img": "/diy/icon-set/sudoku.png",
            "route": "/plugins/sudoku/index",
            "title": "九宫格"
        },
        {
            "img": "/diy/icon-set/bargain.png",
            "route": "/plugins/bargain/index",
            "title": "美丽天天砍"
        },
        {
            "img": "/diy/icon-set/points-mall.png",
            "route": "/plugins/score_mall/index",
            "title": "积分商城"
        },
        {
            "img": "/diy/icon-set/live-streaming.png",
            "route": "/plugins/wechat_live/index",
            "title": "直播列表"
        },
        {
            "img": "/diy/icon-set/smart-card.png",
            "route": "/plugins/IntellectCard/index",
            "title": "智能名片"
        },
        {
            "img": "/diy/icon-set/mutual-push.png",
            "route": "/plugins/rebate/index",
            "title": "推三返一"
        },
        {
            "img": "/diy/icon-set/servebonus .png",
            "route": "/plugins/servebonus/index",
            "title": "服务商分红"
        },
        {
            "img": "/diy/icon-set/equity.png",
            "route": "/plugins/public/promotion/rights?type=servebonus",
            "title": "权益中心"
        },
        {
            "img": "/diy/icon-set/album.png",
            "route": "/plugins/album/index",
            "title": "智能画册"
        },
        {
            "img": "/diy/icon-set/operating-note.png",
            "route": "/plugins/operating_note/index",
            "title": "运营笔记"
        },
        {
            "img": "/diy/icon-set/cloud-storage.png",
            "route": "/plugins/CloudStock/index",
            "title": "云库存"
        },
        {
            "img": "/diy/icon-set/cloud-storage.png",
            "route": "/plugins/CloudStock/goods/list",
            "title": "云库存礼包"
        },
        {
            "img": "/diy/icon-set/cloud-storage.png",
            "route": "/plugins/CloudStock/myInventory",
            "title": "我的库存"
        },
        {
            "img": "/diy/icon-set/withdrawal.png",
            "route": "/plugins/Achievement/index",
            "title": "业绩奖励"
        },
        {
            "img": "/diy/icon-set/course.png",
            "route": "/plugins/course/index",
            "title": "课程首页"
        },
        {
            "img": "/diy/icon-set/my-course.png",
            title: "我的课程",
            route: "/plugins/course/order/myCourse"
        },
        {
            "img": "/diy/icon-set/activity-course.png",
            title: "活动课程",
            route: "/plugins/course/activity/activity"
        },
        {
            "img": "/diy/icon-set/short-video.png",
            "route": "/plugins/short_video/index",
            "title": "短视频"
        },
        {
            "img": "/diy/icon-set/lucky-group.png",
            "route": "/plugins/LuckyGroup/home",
            "title": "幸运拼团"
        },
        {
            "img": "/diy/icon-set/lucky-group.png",
            "route": "/plugins/LuckyGroup/index",
            "title": "幸运拼团首页"
        },
        {
            "img": "/diy/icon-set/redpack-list.png",
            title: "红包拓客",
            route: "/plugins/Redpack/redpackList"
        },
        {
            "img": "/diy/icon-set/red-envelope.png",
            "route": "/plugins/Redpack/redEnvelopes",
            "title": "红包"
        },
        {
            "img": "/diy/icon-set/link-motion.png",
            "route": "/plugins/BossBonus/index",
            "title": "链动2+1"
        },
        // {
        //     "img": "/diy/icon-set/link-motion.png",
        //     "route": "/plugins/BossBonus/index",
        //     "title": "消费分红"
        // },
        {
            "img": "/diy/icon-set/sudoku-crack.png",
            title: "数独解题器",
            route: "/plugins/sudoku_crack/index"
        },
        {
            "img": "/diy/icon-set/scratch.png",
            "route": "/plugins/Scratch/index",
            "title": "刮刮卡"
        },
        {
            "img": "/diy/icon-set/store-index.png",
            "route": "/plugins2/Store/store/storeindex",
            "title": "O2O门店"
        },
        {
            "img": "/diy/icon-set/join-in.png",
            "route": "/plugins2/Store/index",
            "title": "入驻申请"
        },
        {
            "img": "/diy/icon-set/store-clerk.png",
            "route": "/plugins2/Store/writeoff/index",
            "title": "核销入口"
        },
        {
            "img": "/diy/icon-set/shop-manage.png",
            "route": "/plugins2/Store/shopManage/index",
            "title": "店铺管理"
        },
        {
            "img": "/diy/icon-set/welfare.png",
            "route": "/plugins2/Store/shopManage/videoplay",
            "title": "福利"
        },
        {
            "img": "/diy/icon-set/store-seller.png",
            "route": "/plugins2/Store/orderSales/list",
            "title": "门店卖家"
        },
        {
            "img": "/diy/icon-set/mobile-device.png",
            "route": "/plugins2/Store/admin/store",
            "title": "门店移动端"
        },
        {
            "img": "/diy/icon-set/store-cart.png",
            "route": "/plugins2/Store/cart/index",
            "title": "门店购物车"
        },
        {
            "img": "/diy/icon-set/deal-payment.png",
            "route": "/plugins2/Store/dealPayment/index",
            "title": "收款码"
        },
        {
            "img": "/diy/icon-set/order-sales.png",
            "route": "/plugins2/Store/orderSales/assets/index",
            "title": "交易钱包"
        },
        {
            "img": "/diy/icon-set/coupon.png",
            title: "门店核销券",
            route: "/plugins4/StoreWriteCoupons/index"
        },
        {
            "img": "/diy/icon-set/credit-order.png",
            title: "待还款",
            route: "/plugins/pages/order/creditOrder"
        },
        {
            "img": "/diy/icon-set/advance-sale.png",
            "route": "/plugins/earnest/index",
            "title": "预售首页"
        },
        {
            "img": "/diy/icon-set/product-reservation.png",
            title: "预售订单",
            route: "/plugins/earnest/order/list?current=0"
        },
        {
            "img": "/diy/icon-set/certificate.png",
            "route": "/plugins/Certificate/index",
            "title": "授权证书"
        },
        {
            img: "/diy/icon-set/double-copy.png",
            title: "二二复制",
            route: "/plugins/DoubleCopy/index"
        },
        {
            "img": "/diy/icon-set/my-client.png",
            "route": "/plugins/DoubleCopy/myClient",
            "title": "我的客户"
        },
        {
            "img": "/diy/icon-set/equity.png",
            "route": "/plugins/public/promotion/rights?type=DoubleCopy",
            "title": "权益中心"
        },
        {
            "img": "/diy/icon-set/double-copy.png",
            "route": "/plugins/DoubleCopy/goods/list",
            "title": "二二复制商品"
        },
        {
            "img": "/diy/icon-set/mch-index.png",
            "route": "/plugins/Mch/store/storeindex",
            "title": "商户聚合页"
        },
        {
            "img": "/diy/icon-set/merchant-join.png",
            "route": "/plugins/Mch/index",
            "title": "商户入驻"
        },
        {
            "img": "/diy/icon-set/recommendation-courtesy.png",
            "route": "/plugins/Recommen/index",
            "title": "推荐有礼排行榜"
        },
        {
            "img": "/diy/icon-set/recommendation-courtesy.png",
            "route": "/plugins/Recommen/list",
            "title": "推荐有礼活动"
        },
        {
            "img": "/diy/icon-set/smart-card.png",
            title: "智能名片",
            route: "/plugins2/Card/index"
        },
        {
            "img": "/diy/icon-set/pk.png",
            "route": "/plugins2/Pk/index",
            "title": "PK排行榜"
        },
        {
            "img": "/diy/icon-set/smart-form.png",
            "route": "/plugins/SmartForm/SmartForm",
            "title": "智能表单"
        },
        {
            "img": "/diy/icon-set/product-reservation.png",
            "route": "plugins/Subscribe/diyindex",
            "title": "预约首页"
        },
        {
            "img": "/diy/icon-set/subscribe.png",
            "route": "/plugins/Subscribe/index",
            "title": "预约列表"
        },
        {
            "img": "/diy/icon-set/coupon.png",
            title: "电子券管理",
            route: "/plugins2/ElectronCoupon/index"
        },
        {
            "img": "/diy/icon-set/coupon.png",
            title: "领券中心",
            route: "/plugins2/ElectronCoupon/center"
        },
        {
            "img": "/diy/icon-set/boss-achievement.png",
            title: "股东业绩",
            route: "/plugins/BossAchievement/index"
        },
        // { "img": "/diy/icon-set/boss-achievement.png", title: "种子金", route: "/plugins/BossAchievement/index" },
        {
            "img": "/diy/icon-set/case-base.png",
            "route": "/plugins/CaseBase/index",
            "title": "案例库"
        },
        {
            "img": "/diy/icon-set/clerk.png",
            "route": "/plugins/Clerk/index",
            "title": "卡券核销"
        },
        {
            "img": "/diy/icon-set/flash-sale-list.png",
            "route": "/plugins3/Seckill/seckillList",
            "title": "秒杀列表"
        },
        {
            "img": "/diy/icon-set/partner-shareholder.png",
            "route": "/plugins/partner_shareholder/index",
            "title": "加权分红"
        },
        {
            "img": "/diy/icon-set/equity.png",
            "route": "/plugins/promotion/rights?type=partner_shareholder",
            "title": "权益中心"
        },
        {
            "img": "/diy/icon-set/blind-box.png",
            title: "奖金盲盒",
            route: "/plugins2/BlindBox/index"
        },
        {
            "img": "/diy/icon-set/purchase-application.png",
            title: "奖金明细",
            route: "/plugins2/BlindBox/bonusDetailed"
        },
        {
            "img": "/diy/icon-set/purchase-application.png",
            "route": "/plugins/Purchase/apply",
            "title": "资格申请"
        },
        {
            "img": "/diy/icon-set/purchase-index.png",
            title: "商品列表",
            route: "/plugins/Purchase/index"
        },
        {
            "img": "/diy/icon-set/blind-box.png",
            title: "奖金盲盒",
            route: "/plugins2/BlindBoxs/index"
        },
        {
            "img": "/diy/icon-set/purchase-application.png",
            title: "奖金明细",
            route: "/plugins2/BlindBoxs/bonusDetailed"
        },
        {
            "img": "/diy/icon-set/contribution-index.png",
            title: "贡献值首页",
            route: "/plugins2/Contribution/index"
        },
        // { "img": "/diy/icon-set/contribution-inex.png", title: "积分入口", route: "/plugins2/Contribution/index" },
        // { "img": "/diy/icon-set/contribution-inex.png", title: "激活商品", route: "/plugins2/Contribution/index" },
        {
            "img": "/diy/icon-set/prize-draw.png",
            "route": "/plugins2/Draw/index",
            "title": "抽奖"
        },
        {
            img: "/diy/icon-set/distribution.png",
            title: "分销分红",
            route: "/plugins/CircleDistribution/index"
        },


        // { img: "/diy/icon-set/distribution.png",title: "团购抢单",route: "/plugins/GroupRush/home"},
        // { img: "/diy/icon-set/distribution.png",title: "团购专区",route: "plugins/GroupRush/index"},
        {
            "img": "/diy/icon-set/merchant-hiCurrency.png",
            title: "商家嗨呗",
            route: "/plugins/HiGo/MerchantHiCurrency/index"
        },
        {
            "img": "/diy/icon-set/public-line.png",
            title: "公排",
            route: "/plugins3/PublicLine/QueueLine/index"
        },
        {
            "img": "/diy/icon-set/cloud-storage.png",
            "title": "新云库存",
            "route": "/plugins2/CloudStockTwo/index"
        },
        {
            "img": "/diy/icon-set/signingProcess.png",
            "route": "/plugins3/dianqian/signingProcess",
            "title": "电子签约"
        },
        // { "img": "/diy/icon-set/cloud-storage.png", "title": "天天抽奖","route": "plugins2/dailyLottery/index" },
        {
            "img": "/diy/icon-set/share-act.png",
            title: "分享有礼",
            route: "/plugins2/shareAct/index"
        },
        {
            "img": "/diy/icon-set/sign-on-alipay.png",
            title: "签到领红包",
            route: "/plugins2/signOnAlipay/index"
        },
        {
            "img": "/diy/icon-set/community-purchase.png",
            title: "社区团长入驻",
            route: "/plugins2/CommunityPurchase/index"
        },
        {
            "img": "/diy/icon-set/community-user.png",
            title: "社区团购店主",
            route: "/plugins2/CommunityUser/index"
        },
        {
            "img": "/diy/icon-set/sign-list.png",
            title: "支付宝签约",
            route: "/plugins3/AvoidTax/signList"
        }, //【支付宝签约】
        {
            "img": "/diy/icon-set/ai-spirit.png",
            "route": "/plugins2/AiSpirit/index",
            "title": "AI精灵"
        },
        {
            "img": "/diy/icon-set/eight-ou-two.png",
            title: "八出二",
            route: "/plugins/EightOutTwo/index"
        },
        {
            "img": "/diy/icon-set/eight-ou-two.png",
            title: "我要申请",
            route: "plugins2/partnerDistributor/apply/index"
        },
        {
            "img": "/diy/icon-set/team.png",
            "route": "plugins2/partnerDistributor/partner/index",
            "title": "合伙人团队"
        },
        {
            "img": "/diy/icon-set/team.png",
            "route": "plugins2/partnerDistributor/distributor/index",
            "title": "经销商团队"
        },
        {
            "img": "/diy/icon-set/upload-screenshot.png",
            title: "任务打卡",
            route: "plugins3/UploadScreenshot/index"
        },
        // { "img": "/diy/icon-set/upload-screenshot.png", title: "亲友卡", route: "/plugins2/MembersCard/mother_card_list/index" },
        // { "img": "/diy/icon-set/upload-screenshot.png", title: "申请入驻", route: "/plugins/ShareholderRecruit/index" },
        // { "img": "/diy/icon-set/upload-screenshot.png", title: "农业补贴", route: "/plugins2/AgriculturalSubsidies/SubsidyCenter/index" },
        {
            "img": "/diy/icon-set/mini-mall.png",
            title: "迷你商城",
            route: "/plugins2/MiniMall/goods/goodsList"
        },
        {
            "img": "/diy/icon-set/sales-company.png",
            title: "销售公司",
            route: "/plugins2/SalesCompany/index"
        },
        {
            "img": "/diy/icon-set/operation-center.png",
            "route": "/plugins3/OperationCenter/index",
            "title": "运营中心"
        },
        {
            "img": "/diy/icon-set/operation-center.png",
            title: "运营中心申请",
            route: "/plugins3/OperationCenter/apply"
        },
        {
            "img": "/diy/icon-set/investment-center.png",
            "route": "/plugins2/BusinessActivity/index",
            "title": "招商中心"
        },
        {
            "img": "/diy/icon-set/group-buy.png",
            "route": "/plugins/group_buy/index",
            "title": "拼团首页"
        },
        {
            "img": "/diy/icon-set/group-buy-list.png",
            "route": "/plugins/group_buy/orderList",
            "title": "拼团订单"
        },
        {
            "img": "/diy/icon-set/score-expansion.png",
            title: "积分拓客",
            route: "/plugins2/ScoreExpansion/redpackList"
        },
        {
            "img": "/diy/icon-set/business-card.png",
            "route": "/plugins2/BusinessCard/index",
            "title": "智能拓客"
        },
        {
            "img": "/diy/icon-set/wechat-video-shop.png",
            title: "微信视频小店",
            route: "/plugins3/WechatVideoShop/index"
        },
        {
            "img": "/diy/icon-set/invite.png",
            title: "分销员申请",
            route: "/plugins3/WechatVideoShop/invite"
        },
        {
            "img": "/diy/icon-set/sign-list.png",
            title: "银行卡签约",
            route: "/plugins3/BankTax/signList"
        }, //【银行卡签约】
        {
            "img": "/diy/icon-set/subscribe-index.png",
            title: "预约信息",
            route: "/plugins3/ServicePointAppointment/index"
        },
        {
            "img": "/diy/icon-set/service-point.png",
            title: "服务点管理",
            route: "/plugins3/ServicePointAppointment/ServicePoint/index",
        },
        {
            "img": "/diy/icon-set/servic-point-clerk.png",
            "route": "/plugins3/ServicePointAppointment/WriteOff/index",
            "title": "核销验证"
        },
        {
            "img": "/diy/icon-set/make-stock.png",
            title: "库存管理",
            route: "/plugins3/ServicePointAppointment/MakeStock/index"
        },
        // { "img": "/diy/icon-set/subscribe-index.png", title: "数字币商城（银豆）", route: "/plugins3/ContributionRelease/index?type=2" },
        // { "img": "/diy/icon-set/subscribe-index.png", title: "数字币商城（金豆）", route: "/plugins3/ContributionRelease/index?type=1" },

        {
            "img": "/diy/icon-set/rebuy-incentive.png",
            title: "复购奖励",
            route: "/plugins3/RebuyIncentive/index"
        },
        {
            "img": "/diy/icon-set/share-holders.png",
            title: "占比分红",
            route: "/plugins3/Shareholders/index"
        },
        {
            "img": "/diy/icon-set/equity.png",
            title: "权益中心",
            route: "/plugins/public/promotion/rights?type=Shareholders"
        },
        {
            img: "/diy/icon-set/double-copy.png",
            title: "二二复制",
            route: "/plugins2/ZaoDoubleCopy/index"
        },
        {
            "img": "/diy/icon-set/my-client.png",
            "route": "/plugins2/ZaoDoubleCopy/myClient",
            "title": "我的客户"
        },
        {
            "img": "/diy/icon-set/equity.png",
            "route": "/plugins2/public/promotion/rights?type=ZaoDoubleCopy",
            "title": "权益中心"
        },
        {
            "img": "/diy/icon-set/double-copy.png",
            "route": "/plugins2/ZaoDoubleCopy/goods/list",
            "title": "二二复制商品"
        },
        {
            "img": "/diy/icon-set/area-management.png",
            title: "区域代理",
            route: "/plugins2/AreaManagement/my-area"
        },
        // { "img": "/diy/icon-set/starfish.png", title: "全民分红", route: "/plugins3/WholeBonus/index" },
        {
            "img": "/diy/icon-set/starfish.png",
            title: "海星模式",
            route: "/plugins2/Starfish/index"
        },
        {
            "img": "/diy/icon-set/purchasing-records.png",
            "route": "/plugins3/ValetOrder/purchasingRecords",
            "title": "代客下单"
        },
        {
            "img": "/diy/icon-set/starfish.png",
            title: "兑换卡",
            route: "plugins2/partnerDistributor/redemptionCard/redemptionCard"
        },
        {
            "img": "/diy/icon-set/withdrawal.png",
            title: "云库存业绩奖励中心",
            route: "/plugins3/CloudStockAchievement/Perfdividend"
        },
        {
            "img": "/diy/icon-set/verifier.png",
            "route": "/plugins3/WWriteOff/index",
            "title": "核销员"
        },
        {
            "img": "/diy/icon-set/tech-worker.png",
            "route": "/plugins4/ReservationService/techWorker/index",
            "title": "技师端"
        },
        {
            "img": "/diy/icon-set/store-service-apply.png",
            title: "门店服务招募",
            route: "/plugins4/ReservationService/service/storeServiceApply"
        },
        {
            "img": "/diy/icon-set/service-apply.png",
            title: "服务招募",
            route: "/plugins4/ReservationService/service/serviceApply"
        },
        {
           "img": "/diy/icon-set/service-staff-list.png", title: "技师列表",
            route: "/plugins2/reserveService/serviceStaff?title="
        },
        {  "img": "/diy/icon-set/service-staff-list.png", title: "门店技师列表",
            route: "/plugins2/reserveService/serviceStaff?pageType=1"
        },
        {
            "img": "/diy/icon-set/ai-skin-audit.png",
            "route": "/plugins4/AiSkinAudit/index",
            "title": "AI测肤"
        },
        {
            "img": "/diy/icon-set/tech-worker.png",
            title: "师傅端",
            route: "/plugins4/ReservationService/masterWorker/index"
        },
        {
            "img": "/diy/icon-set/three-copy.png",
            title: "三三复制",
            route: "/plugins/ThreeCopy/index"
        },
        {
            "img": "/diy/icon-set/three-copy.png",
            title: "直推下级",
            route: "/plugins/ThreeCopy/agentList"
        },
        {
            "img": "/diy/icon-set/my-client.png",
            title: "我的客户",
            route: "/plugins/ThreeCopy/myClient"
        },
        {
            "img": "/diy/icon-set/equity.png",
            title: "权益中心",
            route: "/plugins/public/promotion/rights?type=ThreeCopy"
        },
        {
            "img": "/diy/icon-set/three-copy.png",
            title: "三三复制商品",
            route: "/plugins/ThreeCopy/goods/list"
        },
        {
            "img": "/diy/icon-set/video-course.png",
            "title": "视频课程",
            "route": "/plugins/course/details?id="
        },
        {
            "img": "/diy/icon-set/aiyunuo.png",
            title: "医养门诊",
            route: "/customDesigns/Aiyunuo/Outpatient/index"
        },
        {
            "img": "/diy/icon-set/aiyunuo-store.png",
            "title": "爱优诺门店",
            "route": "/customDesigns/Aiyunuo/Store/index"
        },
        {
            "img": "/diy/icon-set/team-leader.png",
            "title": "团队长",
            "route": "/plugins/TeamLeader/index"
        },
        {
            "img": "/diy/icon-set/fire-protection.png",
            "title": "社安消防",
            "route": "/customDesigns/FireProtection/pages/index/index"
        },
        {
            "img": "/diy/icon-set/group-data.png",
            "title": "群组数据",
            "route": "/customAddons/GroupData/index"
        },
        {
            "img": "/diy/icon-set/group-data.png",
            "title": "业绩奖励B",
            "route": "/plugins3/Achievement/index?type=AchievementB"
        },
        {
            "img": "/diy/icon-set/asset.png",
            "title": "资产通",
            "route": "/plugins/pages/assets/currency/index?home_type=asset"
        },
        {
            "img": "/diy/icon-set/direct-rewards.png",
            "title": "直推奖",
            "route": "/customAddons/DirectBonus/directBonus"
        },
        {
            "img": "/diy/icon-set/bottle-coupon.png",
            "title": "酒券活动",
            "route": "/customAddons/BottleCoupon/activity"
        },
        {
            "img": "/diy/icon-set/img-clokin.png",
            "title": "图文打卡",
            "route": "/customAddons/ImgClokin/index"
        },
        { "img": "/diy/icon-set/content-matrix.png", "title": "内容矩阵","route": "/customAddons/ContentMatrix/index"},
        {"img": "/diy/icon-set/agent-gratitude.png", "title": "感恩奖", "route": "/customAddons/AgentGratitude/index"},
        { "img": "/diy/icon-set/bonus-pool.png", "title": "分红池","route": "/customAddons/BonusPool/index"},
        {
            "img": "/diy/icon-set/PriceDifferenceGiftPackage.png",
            "title": "价差礼包",
            "route": "/customAddons/PriceDifferenceGiftPackage/index"
        },
        { "img": "/diy/icon-set/networking.png", "title": "人脉","route": "/customAddons/connections/index"},
        { "img": "/diy/icon-set/full-gift-activity.png", "title": "满送活动","route": "/customAddons/FullDeliveryActivity/index"},
        { "img": "/diy/icon-set/diff-reward.png", "title": "极差","route": "/customAddons/PoorAward/index"},
        { "img": "/diy/icon-set/zhai-ke-user.png", "title": "萃伊曼AI体测仪","route": "/customAddons/BodyFatScale/zkt-scale/index"},
        { "img": "/diy/icon-set/zhai-ke-store.png", "title": "店长管理","route": "/customAddons/BodyFatScale/manager/index"},
        { "img": "/diy/icon-set/lease-index.png", "title": "租赁","route": "customAddons/Lease/index"},
        { "img": "/diy/icon-set/lease-mall.png", "title": "租赁商城","route": "customAddons/LeaseMall/index"},
        { "img": "/diy/icon-set/cloud-clinic-index.png", "title": "立即检测","route": "/customAddons/CloudClinic/index"},
        { "img": "/diy/icon-set/cloud-clinic-report.png", "title": "查看报告","route": "/customAddons/CloudClinic/report"},
        { "img": "/diy/icon-set/zhiranai.png", "title": "智然艾","route": "/customDesigns/Zhiranai/Store/index"},
        { "img": "/diy/icon-set/daily-wage.png", "title": "消费增值","route": "/customAddons/RongJiangSanHua/index"},
        { "img": "/diy/icon-set/physiotherapist.png", "title": "理疗师","route": "/customAddons/PhysicalTherapist/index"},
        { "img": "/diy/icon-set/win-profits.png", "title": "新积分增长赢收益","route": "/customAddons/NewScoreGame/pointsWinProfits"},
        { "img": "/diy/icon-set/daily-wage.png", "title": "消费增值","route": "/customAddons/RongJiangSanHua/index"},
        { "img": "/diy/icon-set/regional-assessment.png", "title": "区域考核","route": "/customAddons/RegionalAssessment/index"},
        { "img": "/diy/icon-set/consume-reward.png", "title": "消费奖励","route": "/customAddons/ConsumptionRewards/index"},
        { "img": "/diy/icon-set/yunmeng.png", "title": "云盟店移动端","route": "/customDesigns/YunmengStore/merchant/index"},
        { "img": "/diy/icon-set/invent-achievement.png", "title": "联创业绩","route": "/customAddons/JointCreationPerformance/index"},
        { "img": "/diy/icon-set/area-partner.png", "title": "区域合伙人","route": "/customAddons2/RegionalPartner/index"},
        { "img": "/diy/icon-set/rank-reward.png", "title": "排位分润","route": "/customAddons2/RankReward/index"},
        // {
        //     "img": "/diy/icon-set/user-feedback.png",
        //     "route": "",
        //     "title": "用户反馈"
        // },


        // {
        //     "img": "/diy/icon-set/problem-feedback.png",
        //     "route": "/plugins/pages/center/keep",
        //     "title": "问题反馈"
];

export default defaultIconList;
