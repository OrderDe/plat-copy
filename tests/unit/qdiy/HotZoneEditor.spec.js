import { shallowMount } from '@vue/test-utils';

jest.mock('@/views/qdiy/editor/controls/LinkPickerDialog.vue', () => ({
  name: 'LinkPickerDialog',
  render(h) {
    return h('div');
  },
}));
jest.mock('@/components/base/uploadPicture.vue', () => ({
  name: 'UploadPictures',
  render(h) {
    return h('div');
  },
}));

import HotZoneEditor from '@/views/qdiy/editor/controls/HotZoneEditor.vue';
import DiyImgSetting from '@/views/qdiy/editor/controls/DiyImgSetting.vue';
import DiyImgSettingDrag from '@/views/qdiy/editor/controls/DiyImgSettingDrag.vue';

const existingZone = {
  leftPer: 0,
  topPer: 0,
  widthPer: 0.3,
  heightPer: 0.3,
  url: '',
  urlName: '',
  urlType: '',
};

function mountEditor() {
  const wrapper = shallowMount(HotZoneEditor, {
    propsData: {
      image: 'old-image.jpg',
      value: [existingZone],
    },
    mocks: {
      $message: { warning: jest.fn() },
    },
  });
  wrapper.vm.$refs.stage.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 500,
    height: 300,
  });
  return wrapper;
}

describe('HotZoneEditor', () => {
  it('does not create a zone for a normal click', () => {
    const wrapper = mountEditor();

    wrapper.vm.onStageDown({ button: 0, clientX: 100, clientY: 100 });
    wrapper.vm.onMouseUp();

    expect(wrapper.vm.zones).toHaveLength(1);
    wrapper.destroy();
  });

  it('creates a zone after dragging beyond the click threshold', () => {
    const wrapper = mountEditor();

    wrapper.vm.onStageDown({ button: 0, clientX: 100, clientY: 60 });
    wrapper.vm.onMouseMove({ clientX: 250, clientY: 180 });
    wrapper.vm.onMouseUp();

    expect(wrapper.vm.zones).toHaveLength(2);
    expect(wrapper.vm.zones[1].leftPer).toBeCloseTo(0.2);
    expect(wrapper.vm.zones[1].topPer).toBeCloseTo(0.2);
    expect(wrapper.vm.zones[1].widthPer).toBeCloseTo(0.3);
    expect(wrapper.vm.zones[1].heightPer).toBeCloseTo(0.4);
    wrapper.destroy();
  });

  it('emits a replace request from the editor toolbar', () => {
    const wrapper = mountEditor();

    wrapper.vm.replaceImage();

    expect(wrapper.emitted('replace-image')).toHaveLength(1);
    wrapper.destroy();
  });
});

describe('DiyImgSetting hot-zone image replacement', () => {
  it('updates both the source item and the open editor preview', () => {
    const wrapper = shallowMount(DiyImgSetting, {
      propsData: {
        showHotZone: true,
        imgInfos: [{ imgUrl: 'old-image.jpg', hotZone: [existingZone] }],
      },
    });
    wrapper.setData({
      hotZonePop: true,
      urlIndex: 0,
      pickingIndex: 0,
      pickerVisible: true,
      selHotZoneImg: { imgUrl: 'old-image.jpg', hotZone: [existingZone] },
    });

    wrapper.vm.onPicked([{ sattDir: 'new-image.jpg' }]);

    expect(wrapper.vm.newImgInfos[0].imgUrl).toBe('new-image.jpg');
    expect(wrapper.vm.selHotZoneImg.imgUrl).toBe('new-image.jpg');
    expect(wrapper.vm.pickerVisible).toBe(false);
    expect(wrapper.emitted('change')).toHaveLength(1);
    wrapper.destroy();
  });

  it('keeps the draggable image setting preview in sync', () => {
    const wrapper = shallowMount(DiyImgSettingDrag, {
      propsData: {
        showHotZone: true,
        imgInfos: [{ imgUrl: 'old-image.jpg', hotZone: [existingZone], selectType: 1 }],
      },
    });
    wrapper.setData({
      hotZonePop: true,
      urlIndex: 0,
      pickingIndex: 0,
      pickingType: 'image',
      pickerVisible: true,
      selHotZoneImg: { imgUrl: 'old-image.jpg', hotZone: [existingZone] },
    });

    wrapper.vm.onPicked([{ sattDir: 'new-drag-image.jpg' }]);

    expect(wrapper.vm.newImgInfos[0].imgUrl).toBe('new-drag-image.jpg');
    expect(wrapper.vm.selHotZoneImg.imgUrl).toBe('new-drag-image.jpg');
    expect(wrapper.vm.pickerVisible).toBe(false);
    expect(wrapper.emitted('change')).toHaveLength(1);
    wrapper.destroy();
  });
});
