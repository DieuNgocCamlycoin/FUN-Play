import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore "use client" directive warnings from Web3 packages
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "images/funplay-icon-192.png", "images/funplay-icon-512.png"],
      manifest: {
        name: "FUN Play",
        short_name: "FUN Play",
        description: "The place where every soul turns value into digital assets forever – Rich Rich Rich",
        theme_color: "#00E7FF",
        background_color: "#000833",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/images/funplay-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/images/funplay-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        // Chỉ cache assets tĩnh (không cache JS/CSS để luôn lấy bản mới)
        globPatterns: ["**/*.{ico,png,svg,woff,woff2}"],
        globIgnores: ["**/index.html", "**/*.html", "**/*.js", "**/*.css"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Force SW mới kích hoạt ngay
        skipWaiting: true,
        clientsClaim: true,
        // Không dùng fallback cho navigation
        navigateFallback: null,
        runtimeCaching: [
          // JS files - Network First để luôn lấy bản mới nhất
          {
            urlPattern: /\.js$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "js-cache-v3",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 3
            }
          },
          // CSS files - Network First
          {
            urlPattern: /\.css$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "css-cache-v3",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 3
            }
          },
          // Google Fonts - Cache First (ít thay đổi)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // CRITICAL: Dedupe React to prevent "Invalid hook call" errors
    // when @reown/appkit bundles its own React copy
    dedupe: [
      'react', 
      'react-dom', 
      'viem', 
      'wagmi', 
      '@wagmi/core', 
      '@walletconnect/ethereum-provider',
      '@tanstack/react-query'
    ]
  },
}));
