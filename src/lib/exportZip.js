import { db } from '../db/db.js';
import { listCustomers, listAllCustomers } from '../db/customers.js';
import { triggerDownload, ts } from './download.js';
import { buildArchiveBlob } from './zipBuilder.js';

const IMG_FIELDS = ['businessLicense', 'legalPortrait', 'legalIdFront', 'legalIdBack'];
const SH_IMG_FIELDS = ['idFront', 'idBack'];

function gatherIds(customer) {
  const ids = [];
  IMG_FIELDS.forEach((f) => { if (customer[f]) ids.push(customer[f]); });
  (customer.shareholders || []).forEach((s) => {
    SH_IMG_FIELDS.forEach((f) => { if (s[f]) ids.push(s[f]); });
  });
  return ids;
}

// 从 DB 取出所有引用图片的 Blob，组装成 imagesMap
async function collectImagesMap(customers) {
  const ids = new Set();
  customers.forEach((c) => gatherIds(c).forEach((id) => ids.add(id)));
  const map = {};
  for (const id of ids) {
    const rec = await db.images.get(id);
    if (rec?.blob) map[id] = rec.blob;
  }
  return map;
}

async function exportZip(customers, meta, label) {
  const imagesMap = await collectImagesMap(customers);
  const blob = await buildArchiveBlob(customers, imagesMap, meta);
  triggerDownload(blob, `customer-archive-${label}-${ts()}.zip`);
}

export async function exportGroupZip(chatId) {
  const customers = await listCustomers(chatId);
  await exportZip(customers, { chatId, source: 'archive' }, chatId || 'group');
}

export async function exportAllZip() {
  const customers = await listAllCustomers();
  const chatIds = [...new Set(customers.map((c) => c.chatId))];
  await exportZip(customers, { chatIds, source: 'archive-all' }, 'all');
}
