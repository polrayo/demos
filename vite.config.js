import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'dist'
  },
  plugins: [
    {
      name: 'copy-config',
      closeBundle() {
        fs.copyFileSync(
          path.resolve(__dirname, 'staticwebapp.config.json'),
          path.resolve(__dirname, 'dist/staticwebapp.config.json')
        );
      }
    }
  ]
})
