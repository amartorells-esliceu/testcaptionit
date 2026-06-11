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

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        round: resolve(__dirname, 'round/index.html'),
        ranking: resolve(__dirname, 'ranking/index.html'),
        podium: resolve(__dirname, 'podium/index.html'),
        room: resolve(__dirname, 'room/index.html'),
        configureRoom: resolve(__dirname, 'configureRoom/index.html'),
        createOrJoinRoom: resolve(__dirname, 'createOrJoinRoom/index.html'),
        answersVotes: resolve(__dirname, 'answersVotes/index.html'),
      },
    },
  },

  server: {
    host: true,
    port: 5173,
  }
})