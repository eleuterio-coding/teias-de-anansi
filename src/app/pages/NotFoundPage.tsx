import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="page-state" aria-labelledby="not-found-title">
      <p className="status-code">404</p>
      <h2 id="not-found-title">Página não encontrada</h2>
      <p>O endereço informado não corresponde a uma área disponível do Hub.</p>
      <Link to="/">Voltar ao início</Link>
    </section>
  );
}
