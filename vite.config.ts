import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages publica projetos em /<repositorio>/, não na raiz do domínio.
  base: '/teias-de-anansi/',
});
