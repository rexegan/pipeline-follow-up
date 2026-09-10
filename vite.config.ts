import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Honour PORT when the harness assigns one; otherwise use Vite's default.
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
})
