import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://ian-hamlin.github.io/practicar/. Routing uses the URL hash
  // (e.g. /practicar/#/verbs/Abrir), so GitHub Pages only ever serves index.html.
  base: '/practicar/',
  plugins: [react()],
})
