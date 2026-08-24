import LinkPickerDialog from './LinkPickerDialog';

/**
 * 属性面板接入「链接选择」的公共逻辑
 *
 * 控件只负责 emit('pick-link', index, item)，选完写回也由控件的 setUrl 完成，
 * 中间这段「打开弹窗 → 记住是哪个控件的第几项 → 回填」在十几个组件里是一样的，
 * 所以抽成 mixin。
 *
 * 用法（属性面板）：
 *   <diy-img-setting ref="imgSetting" @pick-link="(i, item) => openLinkPicker('imgSetting', item)" />
 *   <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
 */
export default {
  components: { LinkPickerDialog },
  data() {
    return {
      // 当前等待回填的控件 ref 名与列表项
      linkPickerRef: '',
      linkPickerItem: null,
    };
  },
  methods: {
    openLinkPicker(refName, item) {
      this.linkPickerRef = refName;
      this.linkPickerItem = item || null;
      // linkaddress 自己管弹窗开关，这里直接调它的 open
      if (this.$refs.linkPicker) this.$refs.linkPicker.open();
    },
    onLinkPicked(urlInfo) {
      const control = this.$refs[this.linkPickerRef];
      if (!control || typeof control.setUrl !== 'function') return;
      // diy-icon-set 这类是 setUrl(item, urlInfo)，diy-img-setting 是 setUrl(urlInfo)
      if (control.setUrl.length >= 2) {
        control.setUrl(this.linkPickerItem, urlInfo);
      } else {
        control.setUrl(urlInfo);
      }
      this.linkPickerItem = null;
    },
  },
};
