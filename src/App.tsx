import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Check,
  CircleHelp,
  Compass,
  Flag,
  Layers3,
  Map,
  ScrollText,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { AppShell } from './components/AppShell';
import { allNavigation, isPageId, libraryTiles, type PageId } from './data/navigation';

function pageFromHash(): PageId {
  const raw = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  return isPageId(raw) ? raw : 'inicio';
}

export default function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [librarySection, setLibrarySection] = useState<string | null>(null);

  useEffect(() => {
    const onChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  function navigate(next: PageId, section?: string) {
    setPage(next);
    setLibrarySection(next === 'biblioteca' ? section ?? null : null);
    window.location.hash = `/${next}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  return (
    <AppShell activePage={page} onNavigate={(next) => navigate(next)}>
      {page === 'inicio' ? (
        <OverviewPage onNavigate={navigate} />
      ) : (
        <ModulePage id={page} section={librarySection} onNavigate={navigate} />
      )}
    </AppShell>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="section-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action}</div>;
}

function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="text-button" onClick={onClick}>{children}<ArrowRight size={16} /></button>;
}

const statItems = [
  { label: 'Campanhas', value: '0', icon: Map, info: 'Nenhuma campanha cadastrada' },
  { label: 'Aventuras', value: '0', icon: ScrollText, info: 'Nenhuma aventura cadastrada' },
  { label: 'Sessões', value: '0', icon: CalendarDays, info: 'Nenhuma sessão cadastrada' },
  { label: 'Personagens', value: '0', icon: UsersRound, info: 'Nenhum personagem cadastrado' },
];

function OverviewPage({ onNavigate }: { onNavigate: (id: PageId, section?: string) => void }) {
  return (
    <div className="page-content">
      <div className="page-intro"><div><span className="eyebrow">SEU UNIVERSO, EM UM SÓ LUGAR</span><h1>Visão geral</h1><p>Organize campanhas, conecte histórias e prepare sua próxima sessão.</p></div><span className="page-date"><Compass size={16} /> O início de uma nova jornada</span></div>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-orbit hero-orbit--one" aria-hidden="true"/><div className="hero-orbit hero-orbit--two" aria-hidden="true"/><div className="hero-lines" aria-hidden="true"/>
        <div className="hero-content"><span className="hero-label"><Sparkles size={13}/> PRIMEIRO CAPÍTULO</span><h2 id="hero-title">Toda grande história<br/>começa com uma ideia.</h2><p>Um espaço para reunir o mundo da sua mesa — da primeira campanha até a última rolagem.</p><button className="button button--light" onClick={() => onNavigate('campanhas')}>Explorar campanhas <ArrowRight size={17}/></button></div>
        <div className="hero-sigil" aria-hidden="true"><div className="sigil-circle sigil-circle--outer"/><div className="sigil-circle sigil-circle--middle"/><div className="sigil-circle sigil-circle--inner"/><span>✦</span></div>
      </section>

      <section className="stats-section" aria-label="Indicadores da mesa">
        {statItems.map(({ label, value, icon: Icon, info }) => <div className="stat-card" key={label}><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon size={19}/></span></div><div className="stat-value">{value}</div><div className="stat-description">{info}</div></div>)}
      </section>

      <div className="content-grid">
        <section className="panel panel--planning" aria-labelledby="planning-title">
          <SectionTitle eyebrow="PLANEJAMENTO" title="Próxima sessão" action={<TextButton onClick={() => onNavigate('sessoes')}>Ver sessões</TextButton>} />
          <div className="empty-session"><div className="empty-illustration"><CalendarDays size={31} strokeWidth={1.4}/><span className="empty-glow" /></div><h3 id="planning-title">Sua próxima aventura espera.</h3><p>Quando suas sessões forem cadastradas, seus planejamentos aparecerão aqui.</p><button className="button button--outline" onClick={() => onNavigate('sessoes')}>Ir para sessões <ArrowRight size={16}/></button></div>
        </section>
        <section className="panel panel--start" aria-labelledby="start-title">
          <SectionTitle eyebrow="ATALHOS" title="Comece por aqui" />
          <div className="quick-list" id="start-title">
            <QuickLink icon={Flag} title="Campanhas" description="Estruture o mundo da sua mesa" onClick={() => onNavigate('campanhas')} />
            <QuickLink icon={UsersRound} title="Personagens" description="Organize fichas e protagonistas" onClick={() => onNavigate('personagens')} />
            <QuickLink icon={BookOpenText} title="Regras" description="Consulte o sistema de jogo" onClick={() => onNavigate('regras')} />
          </div>
          <div className="privacy-callout"><ShieldAlert size={18}/><span>Esta é uma prévia da interface. Não há login nem armazenamento de dados reais nesta etapa.</span></div>
        </section>
      </div>

      <section className="library-section" aria-labelledby="library-title">
        <SectionTitle eyebrow="CONHECIMENTO" title="Explore a biblioteca" action={<TextButton onClick={() => onNavigate('biblioteca')}>Toda a biblioteca</TextButton>} />
        <div className="library-grid" id="library-title">
          {libraryTiles.map(({ label, description, icon: Icon }) => <button className="library-tile" key={label} onClick={() => onNavigate('biblioteca', label)}><span className="library-icon"><Icon size={23} strokeWidth={1.5}/></span><span><strong>{label}</strong><small>{description}</small></span><ArrowRight className="library-arrow" size={16}/></button>)}
        </div>
      </section>
    </div>
  );
}

function QuickLink({ icon: Icon, title, description, onClick }: { icon: typeof Flag; title: string; description: string; onClick: () => void }) {
  return <button className="quick-link" onClick={onClick}><span className="quick-icon"><Icon size={20} strokeWidth={1.6}/></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={17} className="quick-arrow" /></button>;
}

function ModulePage({ id, section, onNavigate }: { id: PageId; section: string | null; onNavigate: (id: PageId) => void }) {
  const module = allNavigation.find((item) => item.id === id)!;
  const Icon = module.icon;
  return <div className="page-content"><div className="page-intro"><div><span className="eyebrow">TEIAS DE ANANSI / MÓDULOS</span><h1>{module.label}</h1><p>{module.description} — esta área será implementada em uma etapa posterior.</p></div><span className="pill"><Layers3 size={15}/> Em estruturação</span></div>
    <div className="module-placeholder"><div className="module-placeholder-icon"><Icon size={38} strokeWidth={1.3}/></div><span className="eyebrow">ÁREA RESERVADA</span><h2>{section ? `${module.label} · ${section}` : module.label}</h2><p>A navegação está pronta, mas as ferramentas e os dados deste módulo ainda não foram implementados. Esta página não salva alterações.</p><div className="placeholder-actions"><button className="button button--primary" onClick={() => onNavigate('inicio')}><Compass size={17}/> Voltar à visão geral</button><button className="button button--outline" onClick={() => onNavigate('biblioteca')}><BookOpenText size={17}/> Explorar biblioteca</button></div></div>
    <div className="step-note"><Check size={17}/><span>Passo 01: estrutura de navegação, componentes e layout responsivo.</span><CircleHelp size={16} className="step-note-end" aria-hidden="true"/></div>
  </div>;
}