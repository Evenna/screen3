import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function forceReloadOnSceneEdit(): Plugin {
  return {
    name: 'force-reload-on-scene-edit',
    handleHotUpdate({ file, server }) {
      if (file.includes('/src/scenes/') || file.includes('/src/App.')) {
        server.ws.send({ type: 'full-reload', path: '*' })
        return []
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/screen3/',
  plugins: [react(), forceReloadOnSceneEdit()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 400,
    },
  },
})
