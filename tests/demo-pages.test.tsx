import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../src/app/App';
import { demoRoutes } from '../src/app/demo-routes';


// Sem entrar no Firebase real: essas suítes validam o shell público e o bloqueio padrão.
vi.mock('../src/services/session', () => ({
  getHubAuthSession: () => ({
    observe: (onSession: (user: null) => void) => {
      onSession(null);
      return () => undefined;
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>,
  );
}

describe('Páginas demonstrativas — Etapa 2.10', () => {
  it.each(demoRoutes)('abre $label sem dados reais', async ({ path, label }) => {
    mount(path);
    expect(await screen.findByRole('heading', { level: 1, name: label })).toBeDefined();
    expect(await screen.findByRole('navigation', { name: 'Páginas demonstrativas' })).toBeDefined();
    expect(screen.getByText('Demonstração · dados fictícios')).toBeDefined();
    expect(screen.getByRole('main', { name: label })).toBeDefined();
  });

  it('mantém os módulos do RPG em preparação', async () => {
    mount('/personagens');
    expect(await screen.findByText(/Esta área exige uma sessão autenticada do Hub/)).toBeDefined();
    expect(screen.queryByText('Demonstração · dados fictícios')).toBeNull();
  });

  it('permite entrar no laboratório pela página inicial', async () => {
    mount('/');
    await screen.findByRole('heading', { name: 'Início provisório' });
    fireEvent.click(screen.getByRole('link', { name: 'Acessar demonstrações' }));
    expect(
      await screen.findByRole('heading', { name: 'Laboratório de interface', level: 1 }),
    ).toBeDefined();
  });

  it('preserva as rotas e os breadcrumbs da galeria', async () => {
    mount('/laboratorio');
    const nav = await screen.findByRole('navigation', { name: 'Páginas demonstrativas' });
    fireEvent.click(within(nav).getByRole('link', { name: 'Formulários' }));
    expect(await screen.findByRole('heading', { name: 'Formulários', level: 1 })).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Localização da página' }).textContent).toContain(
      'Laboratório de interface',
    );
  });

  it('altera e reinicia contador exclusivamente local', async () => {
    mount('/laboratorio/componentes');
    await screen.findByRole('heading', { name: 'Componentes de interação', level: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Somar ponto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Somar ponto' }));
    expect(screen.getByText('Contador local:').parentElement?.textContent).toContain('2');
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.getByText('Contador local:').parentElement?.textContent).toContain('0');
  });

  it('executa ações locais de menu e modal', async () => {
    mount('/laboratorio/componentes');
    await screen.findByRole('heading', { name: 'Componentes de interação', level: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Ações do tomo de exemplo' }));
    const menu = screen.getByRole('menu', { name: 'Ações do tomo de exemplo' });
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Inspecionar' }));
    expect(screen.getByText('Inspeção local selecionada.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir janela' }));
    const dialog = screen.getByRole('dialog', { name: 'Janela de demonstração' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Entendi' }));
    expect(screen.queryByRole('dialog', { name: 'Janela de demonstração' })).toBeNull();
  });

  it('exibe paginação e busca sobre registros inventados', async () => {
    mount('/laboratorio/dados');
    const table = await screen.findByRole('table', {
      name: 'Acervo demonstrativo de tomos e mapas',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(screen.getByText('Exibindo 1–5 de 12 resultados')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByText('Exibindo 6–10 de 12 resultados')).toBeDefined();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar registros' }), {
      target: { value: 'mapa' },
    });
    expect(screen.getByText('Exibindo 1–4 de 4 resultados')).toBeDefined();
  });

  it('diferencia carregamento simulado e coleção vazia', async () => {
    mount('/laboratorio/dados');
    await screen.findByRole('table', { name: 'Acervo demonstrativo de tomos e mapas' });
    fireEvent.click(screen.getByRole('button', { name: 'Coleção vazia' }));
    expect(screen.getByText('Nenhum registro disponível')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Simular carregamento' }));
    expect(screen.getByText('Carregando registros…')).toBeDefined();
    expect(screen.queryByText('Nenhum registro disponível')).toBeNull();
  });

  it('valida formulário sem enviar dados nem salvar registros', async () => {
    mount('/laboratorio/formularios');
    await screen.findByRole('heading', { name: 'Formulários padronizados', level: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Validar exemplo' }));
    const errors = screen.getByRole('alert');
    expect(within(errors).getAllByRole('listitem')).toHaveLength(3);
    fireEvent.change(screen.getByRole('textbox', { name: /Título/ }), {
      target: { value: 'Tomo de demonstração' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /Categoria/ }), {
      target: { value: 'tomo' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /Confirmo que estas informações são fictícias/,
      }),
    );
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Validar exemplo' }));
    expect(screen.getByText('Validação local concluída')).toBeDefined();
    expect(
      screen.getByText('Campos válidos. Nenhuma informação foi enviada ou salva.'),
    ).toBeDefined();
  });

  it('só gera notificação de erro fictício após uma ação', async () => {
    mount('/laboratorio/estados');
    await screen.findByRole('heading', { name: 'Estados e mensagens', level: 2 });
    expect(screen.queryByText('Esta falha foi criada para testar o feedback.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Erro simulado' }));
    expect(screen.getByText('Esta falha foi criada para testar o feedback.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar todas' }));
    expect(screen.queryByText('Esta falha foi criada para testar o feedback.')).toBeNull();
  });

  it('preserva resposta 404 em rota desconhecida', async () => {
    mount('/laboratorio/nao-existe');
    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada', level: 2 }),
    ).toBeDefined();
  });
});
