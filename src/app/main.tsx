import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../styles/tokens.css';
import '../styles/index.css';
import '../styles/responsive.css';
import '../styles/components.css';
import '../styles/data.css';
import '../styles/forms.css';
import '../styles/feedback.css';
import '../styles/demo.css';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Elemento raiz da aplicação não encontrado.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
