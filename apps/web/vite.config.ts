import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'OpenFly · Bay trong nắng mới',
        short_name: 'OpenFly',
        description: 'Đặt vé máy bay thông minh cho người Việt — săn vé rẻ tự động với trợ lý Sol.',
        lang: 'vi',
        start_url: '/',
        display: 'standalone',
        background_color: '#EDE6DA',
        theme_color: '#A14B2C',
        // M1: SVG icon only. PNG 192/512 + proper maskable safe-zone come in the PWA milestone.
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
