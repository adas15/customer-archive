import { useEffect, useRef, useState } from 'react';
import { Toast, ImageViewer } from 'antd-mobile';
import { compressImage } from '../lib/imageCompress.js';

// 收集表专用图片上传位：图片仅存于内存（imagesRef Map<id, Blob>），不落 IndexedDB。
// 满足「数据不留存」诉求——关闭页面即可，无需清理。
export default function ImageFieldCollect({ label, icon = '📷', value, onChange, imagesRef }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [url, setUrl] = useState(null);

  // 由 value(id) 从内存 Map 取 blob 生成预览 url
  useEffect(() => {
    if (value && imagesRef.current?.has(value)) {
      const blob = imagesRef.current.get(value);
      const u = URL.createObjectURL(blob);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setUrl(null);
  }, [value]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      // 换图时删除旧图
      if (value && imagesRef.current?.has(value)) {
        imagesRef.current.delete(value);
      }
      const { blob } = await compressImage(file);
      const id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      imagesRef.current.set(id, blob);
      onChange(id);
    } catch (err) {
      Toast.show({ content: '图片处理失败，请换一张' });
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(e) {
    e.stopPropagation();
    if (value && imagesRef.current?.has(value)) imagesRef.current.delete(value);
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
