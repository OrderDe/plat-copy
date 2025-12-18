import * as selfUtil from '@/utils/ZBKJIutil.js';
import router from "@/router";

export default function useDeviseDiy() {
    const frontDomain = `${selfUtil.getFrontDomainUrl()}`;
    // 预览
    const previewProtol = (id) => {
        if (!id) return;
        let perViewDia = {};
        perViewDia.perViewUrl = frontDomain + '?id=' + id;
        perViewDia.visible = true;
        return perViewDia;
    };
    // 添加、编辑、赋值
    const onEditDiyPage = (id, type, fromTo) => {
        const { href } = router.resolve({
            path: `/page/design/creatDevise/${id}/${type}`,
        });
        window.open(href);
    };

    return {
        previewProtol,
        onEditDiyPage
    };
}
