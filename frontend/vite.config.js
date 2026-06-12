import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',  
  
  plugins: [
    tailwindcss(),
  ],

  optimizeDeps: {
    include: ['@tailwindcss/vite'],
    esbuildOptions: {
      loader: {
        '.node': 'file',
      },
    },
  },

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        round: resolve(__dirname, 'round/index.html'),
        ranking: resolve(__dirname, 'ranking/index.html'),
        podium: resolve(__dirname, 'podium/index.html'),
        room: resolve(__dirname, 'room/index.html'),
        configureroom: resolve(__dirname, 'configureroom/index.html'),
        createorjoinroom: resolve(__dirname, 'createorjoinroom/index.html'),
        answersvotes: resolve(__dirname, 'answersvotes/index.html'),
      },
    },
  },

  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      ignored: ['**/node_modules/**', '**/.vite/**'],
    },
    fs: {
      allow: ['..']
    }
  }
})
