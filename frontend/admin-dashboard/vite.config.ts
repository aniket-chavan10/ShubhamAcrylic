import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    // Installable admin app. Only the app shell, fonts and uploaded images are
    // cached — API responses always come from the server, so data is never stale.
    VitePWA({
      registerType: 'prompt',
      manifest: {
        id: '/',
        name: 'Astitva Creations Admin',
        short_name: 'Astitva Admin',
        description: 'Orders, invoices, raw-material stock and design studio for Astitva Creations.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0e0e0f',
        background_color: '#f5f3ee',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'New invoice', url: '/invoices/new', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Website orders', url: '/orders', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Raw materials', url: '/inventory', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Product / logo / order preview images served by the API
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'uploads',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
