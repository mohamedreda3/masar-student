import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5199,
    // ملفات الباك اند (صور/فيديو) ترجع بـ Cross-Origin-Resource-Policy: same-origin فيمنعها المتصفح على localhost —
    // نمرّرها عبر بروكسي التطوير لتصبح من نفس النطاق (انظر media() في src/api/client.js)
    proxy: {
      '/backend/uploads': { target: 'https://masar-alarabia.ae', changeOrigin: true, secure: true },
    },
  },
  base: './',
});
