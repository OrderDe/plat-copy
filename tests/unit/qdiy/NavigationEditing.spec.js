import { shallowMount } from '@vue/test-utils';

jest.mock('@/views/qdiy/editor/registry', () => ({
  isRegistered: () => true,
  previewOf: () => 'div',
  parsePermission: () => ({}),
  toStyle: () => ({}),
}));

import WidgetLibrary from '@/views/qdiy/editor/components/WidgetLibrary.vue';
import PhoneCanvas from '@/views/qdiy/editor/components/PhoneCanvas.vue';
import NavStyle from '@/views/qdiy/editor/widgets/nav/style.vue';

const navComponent = { code: 'nav', title: '顶部导航', count: 1, isTop: 1 };
const navItem = {
  identify: 'nav',
  data: { contentType: 2, logoSrc: 'old-logo.png' },
  computedStyle: {},
  params: {},
};

describe('top navigation editing', () => {
  it('selects the existing navigation when its component card is clicked', () => {
    const wrapper = shallowMount(WidgetLibrary, {
      propsData: {
        groups: [{ group: 'graphic', title: '图文类', list: [navComponent] }],
        list: [navItem],
      },
      mocks: { $message: { warning: jest.fn() } },
    });

    wrapper.vm.handleAdd(navComponent);

    expect(wrapper.emitted('select-existing')[0]).toEqual([0]);
    expect(wrapper.vm.$message.warning).not.toHaveBeenCalled();
    wrapper.destroy();
  });

  it('does not render the fallback page title when a top component exists', () => {
    const wrapper = shallowMount(PhoneCanvas, {
      propsData: {
        list: [navItem],
        componentMap: { nav: navComponent },
        pageTitle: '食品',
      },
    });

    expect(wrapper.find('.phone-head').exists()).toBe(false);
    wrapper.destroy();
  });

  it('keeps the page title fallback for pages without a top component', () => {
    const wrapper = shallowMount(PhoneCanvas, {
      propsData: { list: [], componentMap: {}, pageTitle: '食品' },
    });

    expect(wrapper.find('.phone-head').text()).toBe('食品');
    wrapper.destroy();
  });

  it('loads and replaces an existing navigation logo', () => {
    const wrapper = shallowMount(NavStyle, {
      propsData: { activeItem: navItem },
    });

    expect(wrapper.vm.imageUrl).toEqual([{ imgUrl: 'old-logo.png' }]);
    wrapper.vm.addIconImg([{ imgUrl: 'new-logo.png' }], 'logoSrc');

    expect(wrapper.vm.result.data.logoSrc).toBe('new-logo.png');
    expect(wrapper.emitted('update')).toHaveLength(1);
    wrapper.destroy();
  });
});
