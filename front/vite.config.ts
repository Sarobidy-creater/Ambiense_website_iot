import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Isole les grosses librairies dans des chunks separes
        manualChunks(id) {
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'vendor-charts';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
        },
      },
    },
    // Augmente le seuil d'avertissement chunk (recharts est naturellement gros)
    chunkSizeWarningLimit: 600,
  },
})
