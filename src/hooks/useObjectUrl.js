import { useEffect, useState } from 'react';
import { getImage } from '../db/images.js';

// 传入 image id，返回可用于 <img> 的 objectURL，卸载时自动 revoke
export function useObjectUrl(imageId) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let active = true;
    let current = null;
    if (!imageId) { setUrl(null); return; }
    getImage(imageId).then((rec) => {
      if (!active || !rec?.blob) return;
      current = URL.createObjectURL(rec.blob);
      setUrl(current);
    });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [imageId]);
  return url;
}
