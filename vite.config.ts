import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // O subcaminho do GitHub Pages será configurado apenas no item 1.06.
});
