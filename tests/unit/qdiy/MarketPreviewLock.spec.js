import { shallowMount } from '@vue/test-utils';

jest.mock('@/components/base/uploadPicture.vue', () => ({
  name: 'UploadPictures',
  render(h) {
    return h('div');
  },
}));
jest.mock('@/api/qdiy', () => ({
  qdiyMarketListApi: jest.fn(),
  qdiyMarketReceiveApi: jest.fn(),
  qdiyMarketDetailApi: jest.fn(),
  qdiyMarketSaveApi: jest.fn(),
  qdiyMarketUpdateApi: jest.fn(),
  qdiyMarketOnSaleApi: jest.fn(),
  qdiyMarketDeleteApi: jest.fn(),
}));
jest.mock('@/utils/permission', () => ({ checkPermi: () => false }));

import QDiyMarket from '@/views/qdiy/market/index.vue';

describe('template market preview image lock', () => {
  it('does not open the image picker while editing an existing template', () => {
    const wrapper = shallowMount(QDiyMarket);
    wrapper.setData({ templateForm: { ...wrapper.vm.emptyForm(), id: 42, cover: 'old-cover.png' } });

    wrapper.vm.handleOpenCoverPicker();

    expect(wrapper.vm.uploadVisible).toBe(false);
    wrapper.destroy();
  });

  it('keeps the image picker available for a new template', () => {
    const wrapper = shallowMount(QDiyMarket);

    wrapper.vm.handleOpenCoverPicker();

    expect(wrapper.vm.uploadVisible).toBe(true);
    wrapper.destroy();
  });

  it('refuses to overwrite the preview image from an edit callback', () => {
    const wrapper = shallowMount(QDiyMarket);
    wrapper.setData({
      uploadVisible: true,
      templateForm: { ...wrapper.vm.emptyForm(), id: 42, cover: 'old-cover.png' },
    });

    wrapper.vm.handleGetImage([{ sattDir: 'new-cover.png' }]);

    expect(wrapper.vm.templateForm.cover).toBe('old-cover.png');
    expect(wrapper.vm.uploadVisible).toBe(false);
    wrapper.destroy();
  });
});
