import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Payment Rebuild Step 4: contractContent.js glob-imports the
      // versioned Basic Agreement snapshots from docs/legal/versions/,
      // which lives outside this Vite project's root (frontend/). Vite's
      // dev server otherwise refuses to serve/transform files outside
      // root -- this allowlist is scoped to the repo root, not opened
      // wider than needed.
      allow: [path.resolve(dirname, '..')],
    },
  },
})
