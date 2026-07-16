// 解析当前群 ID：
// 1) 企微侧边栏会把 URL 中的 $CHAT_ID$ 替换为真实群ID → ?chatId=xxx
// 2) 手动/测试：URL 带 ?chatId=xxx
// 3) 兜底：localStorage 上次输入 → 或提示手动输入

const LS_KEY = 'ca:lastChatId';
const NAME_KEY = 'ca:chatNames'; // { chatId: 群名 }

export function getChatIdFromUrl() {
  const params = new URLSearchParams(location.search);
  let cid = params.get('chatId');
  // 企微未替换的占位符原样出现时视为无效
  if (!cid || cid === '$CHAT_ID$') return null;
  return cid;
}

export function resolveChatId() {
  const fromUrl = getChatIdFromUrl();
  if (fromUrl) {
    localStorage.setItem(LS_KEY, fromUrl);
    return fromUrl;
  }
  return localStorage.getItem(LS_KEY) || null;
}

export function setManualChatId(id) {
  if (id) localStorage.setItem(LS_KEY, id);
}

export function getChatName(chatId) {
  try {
    const map = JSON.parse(localStorage.getItem(NAME_KEY) || '{}');
    return map[chatId] || '';
  } catch {
    return '';
  }
}

export function setChatName(chatId, name) {
  try {
    const map = JSON.parse(localStorage.getItem(NAME_KEY) || '{}');
    map[chatId] = name;
    localStorage.setItem(NAME_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}
