import { Card, HubLink } from '../../components/ui';
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
            <Card>
              <HubLink to={module.path}>{module.label}</HubLink>
              <span>{module.etapa}</span>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
