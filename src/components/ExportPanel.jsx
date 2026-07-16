import { useState } from 'react';
import { Popup, Toast } from 'antd-mobile';
import { runExport } from '../lib/exporter.js';

const FORMATS = [
  { key: 'zip', ico: '🗜️', color: '#E6F2F3', title: 'ZIP 备份包', desc: 'JSON + 图片，用于跨设备迁移' },
  { key: 'excel', ico: '📊', color: '#E7F6EC', title: 'Excel 表格', desc: '客户/股东/订单三表 + 图片文件夹' },
  { key: 'word', ico: '📝', color: '#E6EEFB', title: 'Word 文档', desc: '每客户一页，图片内嵌' },
  { key: 'pdf', ico: '📕', color: '#FDECEC', title: 'PDF 文档', desc: '适合打印归档，图片内嵌' },
];

export default function ExportPanel({ visible, onClose, chatId }) {
  const [scope, setScope] = useState('current');
  const [busy, setBusy] = useState('');

  async function handleExport(format) {
    setBusy(format);
    Toast.show({ icon: 'loading', content: '正在生成…', duration: 0 });
    try {
      await runExport(format, scope, chatId);
      Toast.clear();
      Toast.show({ icon: 'success', content: '已开始下载' });
      onClose();
    } catch (e) {
      Toast.clear();
      Toast.show({ content: '导出失败：' + (e.message || '未知错误') });
    } finally {
      setBusy('');
    }
  }

  return (
    <Popup visible={visible} onMaskClick={onClose} bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '80vh', overflow: 'auto' }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>导出数据</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>选择范围与格式</div>

      <div className="scope-seg">
        <button className={scope === 'current' ? 'on' : ''} onClick={() => setScope('current')}>当前群</button>
        <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>全部群</button>
      </div>

      {FORMATS.map((f) => (
        <div key={f.key} className="export-opt" onClick={busy ? undefined : () => handleExport(f.key)} style={{ opacity: busy && busy !== f.key ? 0.5 : 1 }}>
          <div className="ico" style={{ background: f.color }}>{f.ico}</div>
          <div className="txt">
            <b>{f.title}</b>
            <span>{busy === f.key ? '生成中…' : f.desc}</span>
          </div>
        </div>
      ))}
    </Popup>
  );
}
