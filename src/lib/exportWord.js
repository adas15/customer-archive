import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx';
import { db } from '../db/db.js';
import { listCustomers, listAllCustomers } from '../db/customers.js';
import { triggerDownload, ts, PROGRESS_LABEL } from './download.js';

async function blobToArrayBuffer(id) {
  if (!id) return null;
  const rec = await db.images.get(id);
  if (!rec?.blob) return null;
  return rec.blob.arrayBuffer();
}

async function imagePara(label, id) {
  const buf = await blobToArrayBuffer(id);
  if (!buf) return new Paragraph({ children: [new TextRun({ text: `${label}：（无）`, size: 20, color: '9CA3AF' })] });
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}：`, size: 20, bold: true }),
      new ImageRun({ data: buf, transformation: { width: 180, height: 120 } }),
    ],
    spacing: { after: 120 },
  });
}

function kvRow(k, v) {
  return new TableRow({
    children: [
      new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: k, size: 20, color: '6B7280' })] })] }),
      new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: v || '—', size: 20 })] })] }),
    ],
  });
}

async function customerSection(c, idx) {
  const children = [];
  if (idx > 0) children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  children.push(new Paragraph({ text: c.companyName || '（未命名公司）', heading: HeadingLevel.HEADING_1 }));

  // 公司/法人信息表
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E6E9ED' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E6E9ED' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E6E9ED' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E6E9ED' }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E6E9ED' }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E6E9ED' } },
    rows: [kvRow('法人姓名', c.legalPersonName), kvRow('法人电话', c.legalPersonPhone)],
  }));

  children.push(new Paragraph({ text: '证照与照片', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
  children.push(await imagePara('营业执照', c.businessLicense));
  children.push(await imagePara('法人半身照', c.legalPortrait));
  children.push(await imagePara('身份证正面', c.legalIdFront));
  children.push(await imagePara('身份证反面', c.legalIdBack));

  // 股东
  if ((c.shareholders || []).length) {
    children.push(new Paragraph({ text: '股东信息', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    for (const s of c.shareholders) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${s.name || '（未填）'}  电话：${s.phone || '—'}`, size: 20, bold: true })] }));
      children.push(await imagePara('身份证正面', s.idFront));
      children.push(await imagePara('身份证反面', s.idBack));
    }
  }

  // 订单
  if ((c.orders || []).length) {
    children.push(new Paragraph({ text: '订单信息', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    const rows = [
      new TableRow({ children: ['订单号', '服务内容', '办理进度'].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })] })) }),
      ...c.orders.map((o) => new TableRow({ children: [o.orderNo || '—', o.serviceContent || '—', PROGRESS_LABEL[o.progress] || '—'].map((t) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, size: 20 })] })] })) })),
    ];
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  return children;
}

async function buildDoc(customers, label) {
  const sections = [];
  let all = [];
  for (let i = 0; i < customers.length; i++) {
    all = all.concat(await customerSection(customers[i], i));
  }
  if (!all.length) all = [new Paragraph({ text: '暂无客户数据' })];

  const doc = new Document({
    styles: { default: { document: { run: { font: '微软雅黑' } } } },
    sections: [{ children: all }],
  });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `客户档案-Word-${label}-${ts()}.docx`);
}

export async function exportGroupWord(chatId) {
  await buildDoc(await listCustomers(chatId), chatId || 'group');
}
export async function exportAllWord() {
  await buildDoc(await listAllCustomers(), 'all');
}
