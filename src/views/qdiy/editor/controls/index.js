/**
 * QDiy 基础控件统一注册
 *
 * 迁移自 PHP `backend/views/components/common/diy/style-components/`（21 个控件，约 5836 行）
 * 与公共 mixin `backend/web/resources/js/diy-util.js`（317 行，见 ./utils.js）。
 *
 * PHP 侧这些控件是 Vue.component 全局注册的，P6 的 style.vue 直接按 `diy-xxx` 标签名使用。
 * 这里保持同样的用法：在 editor 入口 import 一次本文件即可全局可用，
 * 同时也导出了组件对象，需要局部注册时可以按需 import。
 */
import Vue from 'vue';

import DiyStyleContain from './DiyStyleContain';
import DiyGoodsInfoStyleContain from './DiyGoodsInfoStyleContain';
import DiyColor from './DiyColor';
import DiySizeSetting from './DiySizeSetting';
import DiyTabs from './DiyTabs';
import DiyTab from './DiyTab';
import DiyUrl from './DiyUrl';
import DiyAlign from './DiyAlign';
import DiyConfirmPopup from './DiyConfirmPopup';
import DiyGoodsGroup from './DiyGoodsGroup';
import DiyCenterMenu from './DiyCenterMenu';
import DiyStoreInfo from './DiyStoreInfo';
import DiyStyle from './DiyStyle';
import DiyGoodsInfoStyle from './DiyGoodsInfoStyle';
import DiyOperationList from './DiyOperationList';
import DiyHeader from './DiyHeader';
import DiyImgIconSet from './DiyImgIconSet';
import DiyIconSet from './DiyIconSet';
import DiyImgSetting from './DiyImgSetting';
import DiyImgSettingDrag from './DiyImgSettingDrag';
import DiyRubikCube from './DiyRubikCube';

// key 为 PHP 侧的原组件名，保证 P6 迁移时标签名不用改
const controls = {
  'diy-style-contain': DiyStyleContain,
  'diy-goods-info-style-contain': DiyGoodsInfoStyleContain,
  'diy-color': DiyColor,
  'diy-size-setting': DiySizeSetting,
  'diy-tabs': DiyTabs,
  'diy-tab': DiyTab,
  'diy-url': DiyUrl,
  'diy-align': DiyAlign,
  'diy-confirm-popup': DiyConfirmPopup,
  'diy-goods-group': DiyGoodsGroup,
  'diy-center-menu': DiyCenterMenu,
  'diy-store-info': DiyStoreInfo,
  'diy-style': DiyStyle,
  'diy-goods-info-style': DiyGoodsInfoStyle,
  'diy-operation-list': DiyOperationList,
  'diy-header': DiyHeader,
  'diy-img-icon-set': DiyImgIconSet,
  'diy-icon-set': DiyIconSet,
  'diy-img-setting': DiyImgSetting,
  'diy-img-setting-drag': DiyImgSettingDrag,
  'diy-rubik-cube': DiyRubikCube,
};

Object.keys(controls).forEach((name) => {
  Vue.component(name, controls[name]);
});

export {
  DiyStyleContain,
  DiyGoodsInfoStyleContain,
  DiyColor,
  DiySizeSetting,
  DiyTabs,
  DiyTab,
  DiyUrl,
  DiyAlign,
  DiyConfirmPopup,
  DiyGoodsGroup,
  DiyCenterMenu,
  DiyStoreInfo,
  DiyStyle,
  DiyGoodsInfoStyle,
  DiyOperationList,
  DiyHeader,
  DiyImgIconSet,
  DiyIconSet,
  DiyImgSetting,
  DiyImgSettingDrag,
  DiyRubikCube,
};

export default controls;
