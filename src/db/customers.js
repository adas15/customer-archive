import { db, uuid } from './db.js';
import { deleteImages } from './images.js';

// 收集一个客户记录引用到的所有 image id（用于级联删除 / 导出聚合）
export function collectImageIds(customer) {
  const ids = [
    customer.businessLicense,
    customer.legalPortrait,
    customer.legalIdFront,
    customer.legalIdBack,
  ];
  (customer.shareholders || []).forEach((s) => {
    ids.push(s.idFront, s.idBack);
  });
  return ids.filter(Boolean);
}

// 按群 + 关键词（公司名 / 法人名）查询
export async function listCustomers(chatId, keyword = '') {
  let coll = db.customers.where('chatId').equals(chatId);
  let arr = await coll.toArray();
  if (keyword.trim()) {
    const q = keyword.trim().toLowerCase();
    arr = arr.filter(
      (c) =>
        (c.companyName || '').toLowerCase().includes(q) ||
        (c.legalPersonName || '').toLowerCase().includes(q)
    );
  }
  arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return arr;
}

export async function getCustomer(id) {
  return db.customers.get(id);
}

// 新增 / 更新（同 id 覆盖）
export async function saveCustomer(customer) {
  const now = Date.now();
  const record = {
    ...customer,
    id: customer.id || uuid(),
    createdAt: customer.createdAt || now,
    updatedAt: now,
  };
  await db.customers.put(record);
  return record;
}

// 删除客户 + 级联删除其图片
export async function deleteCustomer(id) {
  const c = await db.customers.get(id);
  if (!c) return;
  await deleteImages(collectImageIds(c));
  await db.customers.delete(id);
}

// 枚举所有群 id（全量导出用）
export async function listChatIds() {
  const all = await db.customers.toArray();
  return [...new Set(all.map((c) => c.chatId))];
}

// 取全部客户（导出用）
export async function listAllCustomers() {
  return db.customers.toArray();
}
