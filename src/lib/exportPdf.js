import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../db/db.js';
import { listCustomers, listAllCustomers } from '../db/customers.js';
import { triggerDownload, ts, PROGRESS_LABEL } from './download.js';

// PDF：为每个客户构建隐藏 DOM，用 html2canvas 截图后 jsPDF 分页
// 通过浏览器渲染解决中文字体问题
async function imgTag(id, label) {
  if (!id) return `<div style="font-size:12px;color:#9CA3AF">${label}：无</div>`;
  const rec = await db.images.get(id);
  if (!rec?.blob) return `<div style="font-size:12px;color:#9CA3AF">${label}：无</div>`;
  const dataUrl = await new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(rec.blob);
  });
  return `<div style="display:inline-block;margin:0 12px 8px 0;vertical-align:top">
    <div style="font-size:11px;color:#6B7280;margin-bottom:3px">${label}</div>
    <img src="${dataUrl}" style="width:150px;height:100px;object-fit:cover;border:1px solid #E6E9ED;border-radius:6px" />
  </div>`;
}

async function customerHtml(c) {
  const shareholders = [];
  for (const s of c.shareholders || []) {
    shareholders.push(`
      <div style="margin-bottom:10px">
        <div style="font-size:13px;font-weight:700">${s.name || '（未填）'} · ${s.phone || '—'}</div>
        <div>${await imgTag(s.idFront, '身份证正面')}${await imgTag(s.idBack, '身份证反面')}</div>
      </div>`);
  }
  const orders = (c.orders || []).map((o) => `
    <tr>
      <td style="border:1px solid #E6E9ED;padding:6px;font-size:12px">${o.orderNo || '—'}</td>
      <td style="border:1px solid #E6E9ED;padding:6px;font-size:12px">${o.serviceContent || '—'}</td>
      <td style="border:1px solid #E6E9ED;padding:6px;font-size:12px">${PROGRESS_LABEL[o.progress] || '—'}</td>
    </tr>`).join('');

  return `
  <div style="width:720px;padding:28px;box-sizing:border-box;font-family:'Microsoft YaHei',sans-serif;color:#1F2937;background:#fff">
    <h1 style="font-size:20px;margin:0 0 16px;border-bottom:2px solid #0E7C86;padding-bottom:8px">${c.companyName || '（未命名公司）'}</h1>
    <div style="font-size:13px;line-height:1.9;margin-bottom:14px">
      <div><b>法人姓名：</b>${c.legalPersonName || '—'}</div>
      <div><b>法人电话：</b>${c.legalPersonPhone || '—'}</div>
    </div>
    <div style="font-size:14px;font-weight:700;color:#0B6168;margin:12px 0 8px">证照与照片</div>
    <div>${await imgTag(c.businessLicense, '营业执照')}${await imgTag(c.legalPortrait, '法人半身照')}${await imgTag(c.legalIdFront, '身份证正面')}${await imgTag(c.legalIdBack, '身份证反面')}</div>
    ${shareholders.length ? `<div style="font-size:14px;font-weight:700;color:#0B6168;margin:16px 0 8px">股东信息</div>${shareholders.join('')}` : ''}
    ${orders ? `<div style="font-size:14px;font-weight:700;color:#0B6168;margin:16px 0 8px">订单信息</div>
      <table style="border-collapse:collapse;width:100%">
        <tr><th style="border:1px solid #E6E9ED;padding:6px;font-size:12px;background:#F4F6F8">订单号</th><th style="border:1px solid #E6E9ED;padding:6px;font-size:12px;background:#F4F6F8">服务内容</th><th style="border:1px solid #E6E9ED;padding:6px;font-size:12px;background:#F4F6F8">办理进度</th></tr>
        ${orders}
      </table>` : ''}
  </div>`;
}

async function buildPdf(customers, label) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.appendChild(host);

  try {
    if (!customers.length) {
      pdf.setFontSize(14);
      pdf.text('No data', 20, 20);
    }
    for (let i = 0; i < customers.length; i++) {
      host.innerHTML = await customerHtml(customers[i]);
      const canvas = await html2canvas(host.firstElementChild, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (i > 0) pdf.addPage();
      // 若内容超过一页高度，分片贴图
      let remaining = imgH;
      let position = 0;
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      } else {
        while (remaining > 0) {
          pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
          remaining -= pageH;
          if (remaining > 0) { pdf.addPage(); position -= pageH; }
        }
      }
    }
    triggerDownload(pdf.output('blob'), `客户档案-PDF-${label}-${ts()}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}

export async function exportGroupPdf(chatId) {
  await buildPdf(await listCustomers(chatId), chatId || 'group');
}
export async function exportAllPdf() {
  await buildPdf(await listAllCustomers(), 'all');
}
