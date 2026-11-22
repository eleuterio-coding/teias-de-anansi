import { Link } from 'react-router-dom';

type Props = {
  label: string;
  etapa: string;
};

export default function SectionPlaceholder({ label, etapa }: Props) {
  return (
    <section aria-labelledby="module-title" className="hub-module-placeholder">
      <p className="hub-section-kicker">Teias de Anansi</p>
      <h2 id="module-title">{label}</h2>
      <p>Esta área ainda não possui conteúdo disponível.</p>
      <Link to="/">Voltar ao início</Link>
    </section>
  );
}
