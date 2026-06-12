// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     host: true,
//   },
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  server: {
    port: 5173,
    host: true,
  },
})

import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

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
});
