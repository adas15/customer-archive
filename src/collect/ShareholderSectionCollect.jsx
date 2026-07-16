import { Input } from 'antd-mobile';
import ImageFieldCollect from './ImageFieldCollect.jsx';

// 收集表专用股东分区：图片存内存（imagesRef），删除整行时同步清理内存中的图片 Blob。
export default function ShareholderSectionCollect({ shareholders, setShareholders, imagesRef }) {
  function update(idx, patch) {
    setShareholders(shareholders.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function add() {
    setShareholders([
      ...shareholders,
      { id: 'sh' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: '', phone: '', idFront: '', idBack: '' },
    ]);
  }
  function remove(idx) {
    const s = shareholders[idx];
    const ids = [s.idFront, s.idBack].filter(Boolean);
    if (ids.length) ids.forEach((id) => imagesRef.current.delete(id));
    setShareholders(shareholders.filter((_, i) => i !== idx));
  }

  return (
    <div className="form-block">
      <h3>股东信息 <span className="badge-idx">{shareholders.length}</span></h3>
      <div className="hint">可添加多位股东，身份证照片随资料导出</div>

      {shareholders.map((s, idx) => (
        <div key={s.id} style={{ borderTop: idx ? '1px dashed var(--border)' : 'none', paddingTop: idx ? 12 : 0, marginTop: idx ? 12 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>股东 {idx + 1}</span>
            <button className="row-del-btn" onClick={() => remove(idx)}>删除</button>
          </div>
          <div className="field-label">姓名</div>
          <Input placeholder="股东姓名" value={s.name} onChange={(v) => update(idx, { name: v })} />
          <div className="field-label">电话</div>
          <Input placeholder="联系电话" type="tel" value={s.phone} onChange={(v) => update(idx, { phone: v })} />
          <div className="field-label">身份证正反面</div>
          <div className="img-grid">
            <ImageFieldCollect label="身份证正面" icon="🪪" value={s.idFront} onChange={(id) => update(idx, { idFront: id })} imagesRef={imagesRef} />
            <ImageFieldCollect label="身份证反面" icon="🪪" value={s.idBack} onChange={(id) => update(idx, { idBack: id })} imagesRef={imagesRef} />
          </div>
        </div>
      ))}

      <button className="add-row-btn" onClick={add}>+ 添加股东</button>
    </div>
  );
}
