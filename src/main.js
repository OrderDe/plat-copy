
import Vue from 'vue';
import '@babel/polyfill';
import '@/theme/index.scss';
import 'normalize.css/normalize.css'; // a modern alternative to CSS resets
import '@/assets/iconfont/iconfont-weapp-icon.css';
import '@/assets/iconfont/iconfont.css';
import 'swiper/dist/css/swiper.css';
import 'vue-ydui/dist/ydui.base.css';
import Element from 'element-ui';
import './theme/element-variables.scss';
import '@/styles/index.scss'; // global css
import '@/assets/fonts/font.css'; // font css
Vue.use(Element, { size: 'small' });
// 懒加载
import VueLazyload from 'vue-lazyload';
import VueAwesomeSwiper from 'vue-awesome-swiper';
import Cookies from 'js-cookie';
import Debounce from './libs/debounce.js'; //防抖自定义指令
Vue.config.devtools = true;
import App from './App';
import store from './store';
import router from './router';
import base from './components/base/index'; // 公共组件
import uploadPicture from './components/uploadFrom';
import goodListFrom from './components/goodList/goodListFrom';
import couponFrom from './components/couponList/couponFrom';
import articleFrom from './components/articleList/articleFrom';
import { loadScriptQueue } from '@/components/FormGenerator/utils/loadScript';
import './icons'; // icon
import './permission'; // permission control
import './utils/error-log'; // error integralLog
import * as filters from './filters'; // global filters
import { parseQuery } from '@/utils';
import plugins from './plugins';
import directive from './directive'; //directive
import libs from './libs/index.js'; // 全局函数
import { isPlatform } from "./utils/settingMer";
Vue.prototype.__isPlatform = isPlatform;
import modelerStore from '@/components/Process/common/global'

// ================= 移植 ryFlowAble 模块所需：全局组件 / 原型方法(仅在平台未注册时补充，不覆盖平台已有) =================
import RSDictTag from '@/components/ryFlowAble/DictTag'
import RSPagination from '@/components/ryFlowAble/Pagination'
import RSRightToolbar from '@/components/ryFlowAble/RightToolbar'
import RSEditor from '@/components/ryFlowAble/Editor'
import RSFileUpload from '@/components/ryFlowAble/FileUpload'
import RSImageUpload from '@/components/ryFlowAble/ImageUpload'
import RSImagePreview from '@/components/ryFlowAble/ImagePreview'
import RSParentView from '@/components/ryFlowAble/ParentView'
import RSBreadcrumb from '@/components/ryFlowAble/Breadcrumb'
import RSHamburger from '@/components/ryFlowAble/Hamburger'
import RSScreenfull from '@/components/ryFlowAble/Screenfull'
import RSSvgIcon from '@/components/ryFlowAble/SvgIcon'
import RSThemePicker from '@/components/ryFlowAble/ThemePicker'
import RSSizeSelect from '@/components/ryFlowAble/SizeSelect'
import RSTopNav from '@/components/ryFlowAble/TopNav'
import RSPanThumb from '@/components/ryFlowAble/PanThumb'
import RSIconSelect from '@/components/ryFlowAble/IconSelect'
import RSProcessTrace from '@/components/ryFlowAble/ProcessTrace'
import RSApprovalTimeline from '@/components/ryFlowAble/ApprovalTimeline'
import RSiFrame from '@/components/ryFlowAble/iFrame'
import RSCrontab from '@/components/ryFlowAble/Crontab'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import { getDicts } from '@/api/ryFlowAble/system/dict/data'
import { getConfigKey } from '@/api/ryFlowAble/system/config'
import { addDateRange, selectDictLabel, blobValidate } from '@/utils/ruoyi'
import request from '@/utils/request'
import { saveAs } from 'file-saver'

// 表单设计器 - 暴露全局 Vue 后动态加载 UMD 模块
// 使用 Promise 确保组件使用时脚本已加载完毕
window.Vue = Vue

// Designer 和 Render 共享 i18n 状态，Designer 将 lang 设为 getter-only 后 Render 写入会报错。
// 在加载任何 UMD 之前全局拦截 Object.defineProperty，从源头阻止 lang getter-only 的产生。
const _origDefineProperty = Object.defineProperty
Object.defineProperty = function (obj, prop, desc) {
  if (prop === 'lang' && desc && desc.get && !desc.set) {
    // 直接替换为 getter+setter，不让只读 getter 落地
    let val = undefined
    try { val = desc.get.call(obj) } catch (e) {}
    return _origDefineProperty.call(Object, obj, prop, {
      get() { return val },
      set(v) { val = v },
      configurable: true,
      enumerable: desc.enumerable !== false
    })
  }
  return _origDefineProperty.call(Object, obj, prop, desc)
}

Vue.prototype.$vFormReady = new Promise((resolve, reject) => {
  // 1. 加载表单设计器
  const designerScript = document.createElement('script')
  designerScript.src = '/static/vform/VFormDesigner.umd.min.js'
  designerScript.onload = () => {
    const designerLink = document.createElement('link')
    designerLink.rel = 'stylesheet'
    designerLink.href = '/static/vform/VFormDesigner.css'
    document.head.appendChild(designerLink)
    Vue.use(window.VFormDesigner.default || window.VFormDesigner)
    // Designer 已完成安装，恢复原生 defineProperty
    Object.defineProperty = _origDefineProperty

    // 2. 加载表单渲染器（lang 冲突已修复，Render 可正常完成 install）
    const renderScript = document.createElement('script')
    renderScript.src = '/static/vform/VFormRender.umd.min.js'
    renderScript.onload = () => {
      const renderLink = document.createElement('link')
      renderLink.rel = 'stylesheet'
      renderLink.href = '/static/vform/VFormRender.css'
      document.head.appendChild(renderLink)
      resolve()
    }
    renderScript.onerror = reject
    document.head.appendChild(renderScript)
  }
  designerScript.onerror = reject
  document.head.appendChild(designerScript)
})


// 全局方法挂载
Vue.prototype.modelerStore = modelerStore
Vue.use(VueLazyload, {
  preLoad: 1.3,
  error: require('./assets/imgs/no.png'),
  loading: require('./assets/imgs/moren.jpg'),
  attempt: 1,
  listenEvents: ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove'],
});
Vue.prototype.bus = new Vue();
Vue.use(uploadPicture);
Vue.use(goodListFrom);
Vue.use(articleFrom);
Vue.use(couponFrom);
Vue.use(VueAwesomeSwiper);
Vue.use(plugins);
Vue.use(directive);
Vue.use(libs);
Vue.use(base);
let cookieName = 'VCONSOLE';
let query = parseQuery();
let urlSpread = query['spread'];
let vconsole = query[cookieName.toLowerCase()];
let md5Crmeb = 'b14d1e9baeced9bb7525ab19ee35f2d2'; //CRMEB MD5 加密开启vconsole模式
let md5UnCrmeb = '3dca2162c4e101b7656793a1af20295c'; //UN_CREMB MD5 加密关闭vconsole模式

if (vconsole !== undefined) {
  if (vconsole === md5UnCrmeb && Cookies.has(cookieName)) Cookies.remove(cookieName);
} else vconsole = Cookies.get(cookieName);

if (vconsole !== undefined && vconsole === md5Crmeb) {
  Cookies.set(cookieName, md5Crmeb, 3600);
  const module = () => import('vconsole');
  module().then((Module) => {
    new Module.default();
  });
}
// 自定义实现String 类型的replaceAll方法
String.prototype.replaceAll = function (s1, s2) {
  return this.replace(new RegExp(s1, 'gm'), s2);
};

// register global utility filters
Object.keys(filters).forEach((key) => {
  Vue.filter(key, filters[key]);
});

Vue.config.productionTip = false;

const $previewApp = document.getElementById('previewApp');
const childAttrs = {
  file: '',
  dialog: ' width="600px" class="dialog-width" v-if="visible" :visible.sync="visible" :modal-append-to-body="false" ',
};

window.addEventListener('message', init, false);

function buildLinks(links) {
  let strs = '';
  links.forEach((url) => {
    strs += `<link href="${url}" rel="stylesheet">`;
  });
  return strs;
}

function init(event) {
  if (event.data.type === 'refreshFrame') {
    const code = event.data.data;
    const attrs = childAttrs[code.generateConf.type];
    let links = '';

    if (Array.isArray(code.links) && code.links.length > 0) {
      links = buildLinks(code.links);
    }

    $previewApp.innerHTML = `${links}<style>${code.css}</style><div id="app"></div>`;

    if (Array.isArray(code.scripts) && code.scripts.length > 0) {
      loadScriptQueue(code.scripts, () => {
        newVue(attrs, code.js, code.html);
      });
    } else {
      newVue(attrs, code.js, code.html);
    }
  }
}

function newVue(attrs, main, html) {
  // eslint-disable-next-line no-eval
  main = eval(`(${main})`);
  main.template = `<div>${html}</div>`;
  new Vue({
    components: {
      child: main,
    },
    data() {
      return {
        visible: true,
      };
    },
    template: `<div><child ${attrs}/></div>`,
  }).$mount('#app');
}

String.prototype.replaceAll = function (s1, s2) {
  return this.replace(new RegExp(s1, 'gm'), s2);
};

/**
 * 防抖 防止重复点击
 * 传参：v-debounceClick="() =>{handleFun(arg)}"
 * 不传参:v-debounceClick="handleFun"
 * delayTime:延迟的时间,只执行最后一次
 */
Vue.directive('debounceClick', {
  bind(el, binding, vnode, oldvnode) {},
  inserted: function (el, binding) {
    let delayTime = el.getAttribute('delay-time') || 500;
    el.onclick = Debounce(function () {
      binding.value();
    }, delayTime);
  },
});

const baseURL = process.env.VUE_APP_BASE_API;
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = `https://cdn.oss.9gt.net/js/es.js?version=JAVA-MER-v2.1&admin_host=${baseURL}`;
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})()

// ================= 移植 ryFlowAble：注册全局组件(不覆盖平台已有同名全局组件) =================
const RS_GLOBALS = {
  DictTag: RSDictTag,
  Pagination: RSPagination,
  RightToolbar: RSRightToolbar,
  Editor: RSEditor,
  FileUpload: RSFileUpload,
  ImageUpload: RSImageUpload,
  ImagePreview: RSImagePreview,
  ParentView: RSParentView,
  Breadcrumb: RSBreadcrumb,
  Hamburger: RSHamburger,
  Screenfull: RSScreenfull,
  SvgIcon: RSSvgIcon,
  ThemePicker: RSThemePicker,
  SizeSelect: RSSizeSelect,
  TopNav: RSTopNav,
  PanThumb: RSPanThumb,
  IconSelect: RSIconSelect,
  ProcessTrace: RSProcessTrace,
  ApprovalTimeline: RSApprovalTimeline,
  IFrame: RSiFrame,
  Crontab: RSCrontab,
  TreeSelect: Treeselect,
};
Object.keys(RS_GLOBALS).forEach((name) => {
  if (!Vue.options.components[name]) {
    Vue.component(name, RS_GLOBALS[name]);
  }
});

// 原型方法（移植模块依赖）
Vue.prototype.getDicts = getDicts;
Vue.prototype.getConfigKey = getConfigKey;
Vue.prototype.addDateRange = addDateRange;
Vue.prototype.selectDictLabel = selectDictLabel;
Vue.prototype.msgSuccess = function (msg) {
  this.$message({ type: 'success', message: msg || '操作成功' });
};
Vue.prototype.msgError = function (msg) {
  this.$message({ type: 'error', message: msg || '操作失败' });
};
Vue.prototype.msgWarning = function (msg) {
  this.$message({ type: 'warning', message: msg });
};
Vue.prototype.msgInfo = function (msg) {
  this.$message({ type: 'info', message: msg });
};
Vue.prototype.download = function (url, params, filename) {
  return request({
    method: 'get',
    url: url,
    params: params,
    responseType: 'blob',
  }).then((data) => {
    if (blobValidate(data)) {
      const blob = new Blob([data]);
      saveAs(blob, filename);
    } else {
      data.text().then((text) => {
        const res = JSON.parse(text);
        this.$message({ type: 'error', message: res.msg || '下载文件失败' });
      });
    }
  });
};

new Vue({
  el: '#app',
  router,
  store,
  render: (h) => h(App),
});
