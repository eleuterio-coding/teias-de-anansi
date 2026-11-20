import { Link } from 'react-router-dom';

type Props = {
  label: string;
  etapa: string;
};

export default function SectionPlaceholder({ label, etapa }: Props) {
  return (
    <section aria-labelledby="module-title" className="hub-module-placeholder">
      <p className="hub-section-kicker">Área reservada</p>
      <h2 id="module-title">Módulo em preparação</h2>
      <p>
        O espaço de {label} será implementado na {etapa.toLowerCase()}, seguindo o Design System
        compartilhado.
      </p>
      <p>Esta página não consulta nem apresenta informações reais do Hub.</p>
      <Link to="/">Voltar ao início</Link>
    </section>
  );
}
