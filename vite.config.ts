import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo12.png', 'offline.html'],
      // Use existing public/manifest.webmanifest referenced in index.html
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            // Supabase REST/Storage endpoints
            urlPattern: /https:\/\/[\w.-]*supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Static images and fonts
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
