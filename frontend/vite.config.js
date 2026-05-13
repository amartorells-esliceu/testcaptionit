import { resolve } from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' // 1. Importa el plugin

export default defineConfig({
  root: '.', 
  
  plugins: [
    tailwindcss(), // 2. Activa el plugin aquí
  ],

  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        round: resolve(import.meta.dirname, 'round/index.html'),
        ranking: resolve(import.meta.dirname, 'ranking/index.html'),
        podium: resolve(import.meta.dirname, 'podium/index.html'),
        room: resolve(import.meta.dirname, 'room/index.html'),
        configureRoom: resolve(import.meta.dirname, 'configureRoom/index.html'),
        createOrJoinRoom: resolve(import.meta.dirname, 'createOrJoinRoom/index.html'),
        ansguersVotes: resolve(import.meta.dirname, 'ansguersVotes/index.html'),
        resetGame: resolve(import.meta.dirname, 'resetGame/index.html'),
      },
    },
  },

  server: {
    host: true,
    fs: {
      allow: ['..']
    }
  }
})
