import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Badge } from '../../../components/ui';
import { demoRoutes } from '../../demo-routes';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export function DemoScaffold({ title, description, children }: Props) {
  return (
    <section className="hub-demo" aria-labelledby="demo-section-title">
      <div className="hub-demo-intro">
        <Badge tone="gold">Demonstração · dados fictícios</Badge>
        <h2 id="demo-section-title">{title}</h2>
        <p>{description}</p>
        <p className="hub-demo-disclaimer">
          Ambiente local de avaliação do Design System. Os controles não consultam, alteram ou
          salvam dados reais do RPG.
        </p>
      </div>

      <nav className="hub-demo-links" aria-label="Páginas demonstrativas">
        {demoRoutes.map((route) => (
          <NavLink
            key={route.path}
            end
            to={route.path}
            className={({ isActive }) => 'hub-demo-link' + (isActive ? ' is-active' : '')}
          >
            {route.label}
          </NavLink>
        ))}
      </nav>

      <div className="hub-demo-body">{children}</div>
    </section>
  );
}
