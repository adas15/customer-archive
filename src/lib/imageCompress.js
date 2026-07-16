// 纯函数图片压缩：最大边 1280，质量 0.8，统一输出 jpeg Blob。不依赖任何存储。
// 抽到独立模块，供「档案库」与「客户收集表」两边共用（收集表不落库，也需要压缩拍照图）。
export function compressImage(file, maxEdge = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxEdge || height > maxEdge) {
        if (width >= height) {
          height = Math.round((height * maxEdge) / width);
          width = maxEdge;
        } else {
          width = Math.round((width * maxEdge) / height);
          height = maxEdge;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('压缩失败'));
          resolve({ blob, width, height, mimeType: 'image/jpeg' });
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片解析失败'));
    };
    img.src = url;
  });
}
