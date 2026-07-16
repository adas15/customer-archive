import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// 纯静态产物，base 用相对路径，方便丢到任意子目录 / CDN
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    // 多入口：档案库（index.html）+ 客户收集表（collect.html）
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        collect: fileURLToPath(new URL('./collect.html', import.meta.url)),
      },
    },
  },
});
