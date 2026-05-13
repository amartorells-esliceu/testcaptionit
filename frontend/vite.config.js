import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'frontend',
  
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'frontend/index.html'),
        
        round: resolve(import.meta.dirname, 'frontend/round/index.html'),
        ranking: resolve(import.meta.dirname, 'frontend/ranking/index.html'),
        podium: resolve(import.meta.dirname, 'frontend/podium/index.html'),
        room: resolve(import.meta.dirname, 'frontend/room/index.html'),
        configureRoom: resolve(import.meta.dirname, 'frontend/configureRoom/index.html'),
        createOrJoinRoom: resolve(import.meta.dirname, 'frontend/createOrJoinRoom/index.html'),
        ansguersVotes: resolve(import.meta.dirname, 'frontend/ansguersVotes/index.html'),
        resetGame: resolve(import.meta.dirname, 'frontend/resetGame/index.html'),
      },
    },
  },

  server: {
    fs: {
      allow: ['..']
    }
  }
})
