import { Card, HubLink } from '../../components/ui';
import { moduleRoutes } from '../routes';

export default function HomePage() {
  return (
    <section aria-labelledby="home-title">
      <h2 id="home-title">Início provisório</h2>
      <p>Esta é a base de navegação do Teias de Anansi 2.0.</p>
      <p>Não há módulos de RPG, autenticação ou dados de campanha disponíveis nesta etapa.</p>
      <Card
        title="Laboratório de interface — prévia"
        description="Páginas para testar o Design System com informações inventadas."
        variant="ornate"
      >
        <p>
          Explore os componentes, a apresentação de dados, os formulários e os
          estados de sistema sem criar registros ou ativar módulos do RPG.
        </p>
        <HubLink variant="primary" to="/laboratorio">
          Acessar demonstrações
        </HubLink>
      </Card>
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
