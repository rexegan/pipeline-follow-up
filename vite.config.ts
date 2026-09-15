import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5173 is permanently occupied by another project on this machine, so pin
  // a fixed port here rather than letting Vite pick a new one every run —
  // otherwise the dev URL changes every session. Honour PORT when the
  // harness assigns one.
  server: { port: Number(process.env.PORT) || 5688, strictPort: false },
})
