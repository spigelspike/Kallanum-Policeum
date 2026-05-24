import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Force Vite restart
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'Kallanum Policeum',
        short_name: 'kallan&police',
        theme_color: '#0a0604',
        background_color: '#0a0604',
        display: 'fullscreen',
        icons: [
          {
            src: 'logo.webp',
            sizes: '192x192 512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
