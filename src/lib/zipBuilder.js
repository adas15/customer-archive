import JSZip from 'jszip';

// 客户记录里引用图片的字段（顶层）
const IMG_FIELDS = ['businessLicense', 'legalPortrait', 'legalIdFront', 'legalIdBack'];
// 股东记录里引用图片的字段
const SH_IMG_FIELDS = ['idFront', 'idBack'];

// 收集一条客户记录引用到的所有 image id
function gatherIds(customer) {
  const ids = [];
  IMG_FIELDS.forEach((f) => {
    if (customer[f]) ids.push(customer[f]);
  });
  (customer.shareholders || []).forEach((s) => {
    SH_IMG_FIELDS.forEach((f) => {
      if (s[f]) ids.push(s[f]);
    });
  });
  return ids;
}

/**
 * 把客户数组打包为归档 Blob（与档案库 importZip 完全互通）。
 * @param {Array} customers  图片字段为 imageId 字符串（与档案库 DB schema 一致）
 * @param {Object} imagesMap { [imageId]: Blob } —— 提供每个 id 对应的实际图片二进制
 * @param {Object} meta      写入 data.json 顶层的附加信息，如 { chatId, source }
 * @returns {Promise<Blob>}
 */
export async function buildArchiveBlob(customers, imagesMap, meta = {}) {
  const zip = new JSZip();
  const imgFolder = zip.folder('images');
  const idToPath = {};
  const allIds = new Set();
  customers.forEach((c) => gatherIds(c).forEach((id) => allIds.add(id)));

  // 写图片二进制
  for (const id of allIds) {
    const blob = imagesMap[id];
    if (blob) {
      const path = `images/${id}.jpg`;
      idToPath[id] = path;
      imgFolder.file(`${id}.jpg`, blob);
    }
  }

  // data.json：图片字段 id → 相对路径；保留原记录其余字段
  const mapField = (id) => (id && idToPath[id]) || '';
  const data = customers.map((c) => ({
    ...c,
    businessLicense: mapField(c.businessLicense),
    legalPortrait: mapField(c.legalPortrait),
    legalIdFront: mapField(c.legalIdFront),
    legalIdBack: mapField(c.legalIdBack),
    shareholders: (c.shareholders || []).map((s) => ({
      ...s,
      idFront: mapField(s.idFront),
      idBack: mapField(s.idBack),
    })),
  }));

  zip.file(
    'data.json',
    JSON.stringify({ version: 1, exportedAt: Date.now(), ...meta, customers: data }, null, 2)
  );
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
