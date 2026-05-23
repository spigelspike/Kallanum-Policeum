import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Force Vite restart
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
