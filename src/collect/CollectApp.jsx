import { useRef, useState } from 'react';
import CollectForm from './CollectForm.jsx';
import { getChatIdFromUrl } from '../lib/chat.js';

// 客户自助收集表主壳：纯前端、零后端、无登录、不留存。
// 链接带 chatId → 导出 zip 自动带入，档案库导入时按 chatId 归群。
export default function CollectApp() {
  const urlChatId = getChatIdFromUrl();
  const imagesRef = useRef(new Map()); // 内存图片池：id -> Blob
  const [missingChat, setMissingChat] = useState(!urlChatId);
  const [manualChat, setManualChat] = useState('');
  const [done, setDone] = useState(false);
  const [formKey, setFormKey] = useState(0); // 用于「再填一份」强制重置表单

  const chatId = urlChatId || manualChat.trim();

  function reset() {
    imagesRef.current.clear();
    setFormKey((k) => k + 1);
    setDone(false);
  }

  return (
    <div className="app-shell">
      <div className="navbar" style={{ justifyContent: 'center' }}>
        <div className="title" style={{ textAlign: 'center' }}>客户信息收集表</div>
      </div>

      {missingChat && (
        <div className="warn-banner">
          <b>提示：</b>本链接未关联档案库，导出的文件可能无法自动归入对应群。如服务人员提供了标识，请在下方填写。
          <input
            className="manual-chat"
            placeholder="填写档案库标识（如群编号）"
            value={manualChat}
            onChange={(e) => setManualChat(e.target.value)}
          />
        </div>
      )}

      <div className="collect-intro">
        带 <span className="req">*</span> 为必填。填完后点击「导出文件」，通过微信将文件发回服务人员即可，无需注册登录，关闭页面不留存数据。
      </div>

      <CollectForm key={formKey} chatId={chatId} imagesRef={imagesRef} onExported={() => setDone(true)} />

      {done && (
        <div className="success-mask" onClick={() => setDone(false)}>
          <div className="success-card" onClick={(e) => e.stopPropagation()}>
            <div className="check">✓</div>
            <div className="st">导出成功</div>
            <div className="sd">
              文件已保存到本机（
              {chatId ? '将自动归入对应档案库' : '请在档案库导入时手动选择对应群'}）。
              请通过微信将该 zip 文件发送给服务人员。
            </div>
            <div className="sbtn" onClick={reset}>再填一份</div>
            <div className="slink" onClick={() => setDone(false)}>关闭</div>
          </div>
        </div>
      )}
    </div>
  );
}
