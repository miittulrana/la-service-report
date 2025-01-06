import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['jspdf', 'jspdf-autotable'],
      output: {
        globals: {
          jspdf: 'jsPDF',
          'jspdf-autotable': 'jspdf-autotable'
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable']
  }
});