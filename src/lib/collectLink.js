// 根据当前群 chatId，生成「客户收集表」的分享链接。
// 收集表导出的 zip 必须带 chatId，档案库导入时才能自动归群（importZip 对无 chatId 记录整条跳过）。
export function buildCollectUrl(chatId) {
  if (!chatId) return null;
  // 基于当前页面 URL 推导 collect.html 绝对地址（兼容子目录 / base 相对路径部署）
  const base = new URL('collect.html', location.href).href.split('?')[0];
  return `${base}?chatId=${encodeURIComponent(chatId)}`;
}
