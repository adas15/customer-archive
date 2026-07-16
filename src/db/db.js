import Dexie from 'dexie';

// 单一 Dexie 实例。customers 与 images 分表存储。
export const db = new Dexie('customer-archive');

db.version(1).stores({
  // 主键 id + 群隔离键 chatId + 搜索索引
  customers: 'id, chatId, companyName, legalPersonName, updatedAt',
  images: 'id',
});

// 简单可用性检测（隐私模式下 IndexedDB 可能不可用）
export async function checkDbAvailable() {
  try {
    await db.open();
    return true;
  } catch (e) {
    console.error('IndexedDB unavailable:', e);
    return false;
  }
}

export function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
