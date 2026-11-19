import { Link } from 'react-router-dom';
import { moduleRoutes } from '../routes';

export default function HomePage() {
  return (
    <section aria-labelledby="home-title">
      <h2 id="home-title">Início provisório</h2>
      <p>Esta é a base de navegação do Teias de Anansi 2.0.</p>
      <p>Não há módulos de RPG, autenticação ou dados de campanha disponíveis nesta etapa.</p>
      <h3>Áreas previstas</h3>
      <ul className="module-links">
        {moduleRoutes.map((module) => (
          <li key={module.path}>
            <Link to={module.path}>{module.label}</Link>
            <span>{module.etapa}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
