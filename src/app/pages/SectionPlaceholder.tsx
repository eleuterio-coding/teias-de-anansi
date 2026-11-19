import { Link } from 'react-router-dom';

type Props = {
  label: string;
  etapa: string;
};

export default function SectionPlaceholder({ label, etapa }: Props) {
  return (
    <section aria-labelledby="module-title">
      <h2 id="module-title">{label}</h2>
      <p>Área reservada para implementação na {etapa.toLowerCase()}.</p>
      <p>Esta página não consulta nem apresenta informações reais do Hub.</p>
      <Link to="/">Voltar ao início</Link>
    </section>
  );
}
