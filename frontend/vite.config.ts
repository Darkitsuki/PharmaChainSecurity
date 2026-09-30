import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiOrigin = new URL(env.VITE_API_BASE_URL || 'https://localhost:55198/api/v1').origin;

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api/v1': {
          target: apiOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
