import { printApi } from '@/api/warehouse';

/**
 * 打印指定 bizType + docId：
 *  - 优先取默认模板；找不到时提示
 *  - 打开新窗口写入渲染后的 HTML，附上 window.print()
 * 用法：await doPrint('IN', row.id)
 */
export async function doPrint(bizType, docId) {
  let tpl = null;
  try { tpl = await printApi.getDefault(bizType); } catch (e) { /* ignore */ }
  if (!tpl || !tpl.id) {
    throw new Error(`未配置 ${bizType} 的默认打印模板，请前往"打印模板"页新增/启用`);
  }
  const html = await printApi.render(tpl.id, docId);
  const w = window.open('', '_blank', 'width=900,height=800');
  if (!w) throw new Error('浏览器阻止了弹窗，请允许弹窗后重试');
  const paper = paperCss(tpl.paperSize);
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${tpl.name}</title>
    <style>
      @media print{@page{${paper}}}
      body{margin:0;color:#000;font-size:14px;line-height:1.7}
      /* 打印时强制黑色实底，避免浏览器把表格线和底色淡化掉 */
      table{color:#000}
      th,td{color:#000;border-color:#000 !important}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style>
    </head><body>${html}
    <script>window.onload=function(){setTimeout(function(){window.print();},200);}<\/script>
    </body></html>`);
  w.document.close();
}

function paperCss(size) {
  if (!size || size === 'A4') return 'size: A4;';
  const m = /^(\d+)x(\d+)$/i.exec(size);
  if (m) return `size: ${m[1]}mm ${m[2]}mm; margin: 0;`;
  return 'size: A4;';
}

export default { doPrint };
