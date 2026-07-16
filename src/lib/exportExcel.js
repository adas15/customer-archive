import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { db } from '../db/db.js';
import { listCustomers, listAllCustomers, collectImageIds } from '../db/customers.js';
import { triggerDownload, ts, PROGRESS_LABEL } from './download.js';

// Excel：三个 Sheet（客户/股东/订单，以 customerId 关联）+ images/ 文件夹，打成一个 zip
async function buildExcelZip(customers, label) {
  const idToPath = {};
  const imageIdSet = new Set();
  customers.forEach((c) => collectImageIds(c).forEach((id) => imageIdSet.add(id)));

  const zip = new JSZip();
  const imgFolder = zip.folder('images');
  for (const id of imageIdSet) {
    const rec = await db.images.get(id);
    if (rec?.blob) {
      idToPath[id] = `images/${id}.jpg`;
      imgFolder.file(`${id}.jpg`, rec.blob);
    }
  }
  const p = (id) => (id && idToPath[id]) || '';

  // 客户表
  const customerRows = customers.map((c) => ({
    客户ID: c.id,
    群ID: c.chatId,
    公司名: c.companyName || '',
    法人姓名: c.legalPersonName || '',
    法人电话: c.legalPersonPhone || '',
    营业执照: p(c.businessLicense),
    法人半身照: p(c.legalPortrait),
    法人身份证正面: p(c.legalIdFront),
    法人身份证反面: p(c.legalIdBack),
    创建时间: c.createdAt ? new Date(c.createdAt).toLocaleString('zh-CN') : '',
  }));

  // 股东表
  const shareholderRows = [];
  customers.forEach((c) => {
    (c.shareholders || []).forEach((s) => {
      shareholderRows.push({
        客户ID: c.id,
        公司名: c.companyName || '',
        股东姓名: s.name || '',
        股东电话: s.phone || '',
        身份证正面: p(s.idFront),
        身份证反面: p(s.idBack),
      });
    });
  });

  // 订单表
  const orderRows = [];
  customers.forEach((c) => {
    (c.orders || []).forEach((o) => {
      orderRows.push({
        客户ID: c.id,
        公司名: c.companyName || '',
        订单号: o.orderNo || '',
        服务内容: o.serviceContent || '',
        办理进度: PROGRESS_LABEL[o.progress] || o.progress || '',
      });
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customerRows), '客户');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shareholderRows), '股东');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderRows), '订单');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file(`客户档案-${label}.xlsx`, wbout);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerDownload(blob, `客户档案-Excel-${label}-${ts()}.zip`);
}

export async function exportGroupExcel(chatId) {
  await buildExcelZip(await listCustomers(chatId), chatId || 'group');
}
export async function exportAllExcel() {
  await buildExcelZip(await listAllCustomers(), 'all');
}
