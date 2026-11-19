import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Elemento raiz da aplicação não encontrado.');
}

// Entrada técnica sem páginas ou rotas. A navegação só será criada no item 1.05.
createRoot(root).render(<StrictMode />);
