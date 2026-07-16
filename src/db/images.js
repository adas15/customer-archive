import { db, uuid } from './db.js';
// 图片压缩抽为纯函数，供档案库与收集表共用
export { compressImage } from '../lib/imageCompress.js';

// 存图片，返回 image id
export async function putImage(file) {
  const { blob, width, height, mimeType } = await compressImage(file);
  const id = uuid();
  await db.images.put({ id, blob, width, height, mimeType });
  return id;
}

// 直接存已有 blob（用于导入）
export async function putImageBlob(id, blob, width = 0, height = 0, mimeType = 'image/jpeg') {
  await db.images.put({ id, blob, width, height, mimeType });
}

export async function getImage(id) {
  if (!id) return null;
  return db.images.get(id);
}

// 返回可用于 <img src> 的 objectURL；调用方负责 revoke
export async function getImageUrl(id) {
  const rec = await getImage(id);
  if (!rec) return null;
  return URL.createObjectURL(rec.blob);
}

export async function deleteImages(ids) {
  const valid = ids.filter(Boolean);
  if (valid.length) await db.images.bulkDelete(valid);
}
