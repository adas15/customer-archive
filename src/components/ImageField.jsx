import { useRef, useState } from 'react';
import { Toast, ImageViewer } from 'antd-mobile';
import { putImage, deleteImages } from '../db/images.js';
import { useObjectUrl } from '../hooks/useObjectUrl.js';

// 单个图片上传/预览/删除位。value = image id，onChange(newId)
export default function ImageField({ label, icon = '📷', value, onChange }) {
  const inputRef = useRef(null);
  const url = useObjectUrl(value);
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      // 换图时删除旧图
      if (value) await deleteImages([value]);
      const id = await putImage(file);
      onChange(id);
    } catch (err) {
      Toast.show({ content: '图片处理失败，请换一张' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (value) await deleteImages([value]);
    onChange('');
  }

  return (
    <div
      className="img-slot"
      onClick={() => {
        if (url) setViewer(true);
        else inputRef.current?.click();
      }}
    >
      {url ? (
        <>
          <img src={url} alt={label} />
          <button className="del" onClick={handleDelete}>×</button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 22 }}>{icon}</div>
          <div>{busy ? '处理中…' : label}</div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <ImageViewer image={url} visible={viewer} onClose={() => setViewer(false)} />
    </div>
  );
}
