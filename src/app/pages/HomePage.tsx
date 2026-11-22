import { Card, HubLink } from '../../components/ui';

export default function HomePage() {
  return (
    <section aria-labelledby="home-title" className="hub-login-panel">
      <Card title="Bem-vindo ao Teias de Anansi" variant="ornate">
        <p id="home-title">
          Entre com seu usuário e senha para acessar sua área do Hub de RPG.
        </p>
        <HubLink variant="primary" to="/entrar">
          Entrar no Hub
        </HubLink>
      </Card>
    </section>
  );
}
