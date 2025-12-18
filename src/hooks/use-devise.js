import store from '../store';

export default function useDeviseDiy(param) {
  //中间页点击隐藏模块；
  const bindHide = (item, key) => {
    this.$nextTick(() => {
      this.$set(this.mConfig[key], 'isShow', !this.mConfig[key].isShow);
    });

    //this.mConfig[key].isShow = !this.mConfig[key].isShow
    store.commit('mobildConfig/UPDATESHOW', item);
  };
  //移动事件
  const onMove = (e) => {
    if (e.relatedContext.element.name == 'search_box') return false;
    if (e.relatedContext.element.name == 'nav_bar') return false;
    return true;
  };

  // 对象转数组
  const objToArr = (data) => {
    let obj = Object.keys(data).sort();
    let m = obj.map((key) => data[key]);
    return m;
  };
  return {
    bindHide,
    onMove,
    objToArr,
  };
}
