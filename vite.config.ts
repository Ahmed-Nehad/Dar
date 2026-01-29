import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/Dar/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'دار التحفيظ',
        short_name: 'تحفيظ',
        description: 'System for tracking Quran memorization and attendance',
        theme_color: '#ffffff', // Match your daisyUI theme background
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: command === 'serve' ? '/' : '/Dar/',
        start_url: command === 'serve' ? '/' : '/Dar/',
        dir: 'rtl',
        lang: 'ar',
        icons: [
          {
            src: 'icons/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/newIconForDar.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/newIconForDar.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
}))