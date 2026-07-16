import JSZip from 'jszip';
import { db, uuid } from '../db/db.js';

// 导入 zip：解析 data.json + images/*，写回 DB
// 去重策略：同 chatId + 同 companyName 已存在 → 跳过；否则追加
export async function importZip(file) {
  const zip = await JSZip.loadAsync(file);
  const dataFile = zip.file('data.json');
  if (!dataFile) throw new Error('文件格式不正确：缺少 data.json');

  let parsed;
  try {
    parsed = JSON.parse(await dataFile.async('string'));
  } catch {
    throw new Error('文件格式不正确：data.json 解析失败');
  }
  const customers = parsed.customers || parsed; // 兼容纯数组
  if (!Array.isArray(customers)) throw new Error('文件格式不正确：无客户数据');

  // 相对路径 → 新 image id 的映射（同一路径只导入一次）
  const pathToNewId = {};
  async function importImageByPath(path) {
    if (!path) return '';
    if (pathToNewId[path]) return pathToNewId[path];
    const f = zip.file(path);
    if (!f) return '';
    const blob = await f.async('blob');
    const newId = uuid();
    await db.images.put({ id: newId, blob, mimeType: 'image/jpeg', width: 0, height: 0 });
    pathToNewId[path] = newId;
    return newId;
  }

  let imported = 0;
  let skipped = 0;

  for (const c of customers) {
    const chatId = c.chatId;
    if (!chatId) { skipped++; continue; }

    // 去重
    const existing = await db.customers.where('chatId').equals(chatId).toArray();
    if (existing.some((e) => (e.companyName || '') === (c.companyName || '') && c.companyName)) {
      skipped++;
      continue;
    }

    const rebuilt = {
      ...c,
      id: uuid(), // 避免 id 冲突
      businessLicense: await importImageByPath(c.businessLicense),
      legalPortrait: await importImageByPath(c.legalPortrait),
      legalIdFront: await importImageByPath(c.legalIdFront),
      legalIdBack: await importImageByPath(c.legalIdBack),
      shareholders: [],
      orders: c.orders || [], // 修复：导入时一并保留订单信息
      createdAt: c.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    for (const s of c.shareholders || []) {
      rebuilt.shareholders.push({
        ...s,
        id: s.id || uuid(),
        idFront: await importImageByPath(s.idFront),
        idBack: await importImageByPath(s.idBack),
      });
    }
    await db.customers.put(rebuilt);
    imported++;
  }

  return { imported, skipped };
}
