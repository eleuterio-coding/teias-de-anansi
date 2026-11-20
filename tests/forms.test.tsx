import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../src/components/ui';
import {
  CheckboxField,
  FormErrorSummary,
  FormPanel,
  FormSection,
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
} from '../src/components/form';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Formulários padronizados — Etapa 2.07', () => {
  it('vincula rótulo, ajuda e erro ao campo textual', () => {
    render(
      <TextField
        id="nome-tomo"
        name="title"
        label="Nome do tomo"
        hint="Escolha um título para a obra."
        error="O título é obrigatório."
        required
        value=""
        onChange={() => undefined}
      />,
    );

    const input = screen.getByRole('textbox', { name: /Nome do tomo/ });
    expect(input.getAttribute('id')).toBe('nome-tomo');
    expect(input.getAttribute('name')).toBe('title');
    expect(input.getAttribute('required')).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(
      'nome-tomo-hint nome-tomo-error',
    );
    expect(screen.getByText('O título é obrigatório.').id).toBe('nome-tomo-error');
  });

  it('aceita identificador gerado e informação adicional acessível', () => {
    render(
      <>
        <span id="ajuda-externa">Texto auxiliar externo.</span>
        <TextField
          label="Local"
          value="Norte"
          hint="Região fictícia."
          aria-describedby="ajuda-externa"
          onChange={() => undefined}
        />
      </>,
    );

    const input = screen.getByRole('textbox', { name: 'Local' });
    const descriptions = input.getAttribute('aria-describedby') ?? '';
    expect(input.id.length).toBeGreaterThan(0);
    expect(descriptions).toContain('ajuda-externa');
    expect(descriptions).toContain(input.id + '-hint');
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('propaga eventos e atributos nativos de texto', () => {
    const change = vi.fn();
    render(
      <TextField
        label="Endereço de contato"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="contato@exemplo.test"
        onChange={change}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Endereço de contato' });
    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
    fireEvent.change(input, { target: { value: 'teste@exemplo.test' } });
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('exibe área de texto com linhas e erro próprio', () => {
    render(
      <TextAreaField
        id="resumo"
        label="Resumo da aventura"
        rows={6}
        error="Escreva uma descrição."
        value=""
        onChange={() => undefined}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Resumo da aventura' });
    expect(input.getAttribute('rows')).toBe('6');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('resumo-error');
  });

  it('permite selecionar e desabilitar opções de uma lista', () => {
    const change = vi.fn();
    render(
      <SelectField
        id="categoria"
        name="category"
        label="Categoria"
        placeholder="Selecione uma categoria"
        value=""
        required
        options={[
          { value: 'lore', label: 'Conhecimento' },
          { value: 'retired', label: 'Indisponível', disabled: true },
        ]}
        onChange={change}
      />,
    );

    const select = screen.getByRole('combobox', { name: /Categoria/ });
    expect(select.getAttribute('required')).toBe('');
    expect(within(select).getByRole('option', { name: 'Indisponível' }).hasAttribute('disabled')).toBe(
      true,
    );
    fireEvent.change(select, { target: { value: 'lore' } });
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('permite marcar uma escolha com label clicável', () => {
    const change = vi.fn();
    render(
      <CheckboxField
        label="Aceito revisar as informações"
        name="agreement"
        checked={false}
        hint="Obrigatório para continuar."
        onChange={change}
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Aceito revisar as informações' });
    fireEvent.click(checkbox);
    expect(change).toHaveBeenCalledTimes(1);
    expect(checkbox.getAttribute('aria-describedby')).toContain('-hint');
  });

  it('exibe erro de checkbox sem depender somente da cor', () => {
    render(
      <CheckboxField
        id="consentimento"
        label="Confirmo"
        error="Você precisa confirmar."
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Confirmo' });
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    expect(checkbox.getAttribute('aria-describedby')).toBe('consentimento-error');
    expect(screen.getByText('Você precisa confirmar.')).toBeDefined();
  });

  it('agrupa opções de rádio por legenda e nome compartilhado', () => {
    const onChange = vi.fn();
    render(
      <RadioGroupField
        id="origem"
        legend="Origem da história"
        name="origin"
        value="mato"
        required
        hint="Escolha uma origem fictícia."
        onChange={onChange}
        options={[
          { label: 'Floresta', value: 'mato' },
          { label: 'Cidade', value: 'cidade' },
          { label: 'Oculta', value: 'oculta', disabled: true },
        ]}
      />,
    );
    const group = screen.getByRole('group', { name: /Origem da história/ });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios.every((radio) => radio.getAttribute('name') === 'origin')).toBe(true);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect(radios[2].hasAttribute('disabled')).toBe(true);
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledWith('cidade');
  });

  it('desabilita grupo inteiro de opções quando solicitado', () => {
    render(
      <RadioGroupField
        legend="Escolha"
        name="choice"
        value=""
        disabled
        onChange={vi.fn()}
        options={[{ value: 'a', label: 'Primeira opção' }]}
      />,
    );
    expect(screen.getByRole('group', { name: 'Escolha' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('radio', { name: 'Primeira opção' }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  it('organiza seções e mantém a hierarquia editorial', () => {
    render(
      <FormSection title="Identidade do cenário" description="Campos descritivos.">
        <TextField label="Nome" value="" onChange={() => undefined} />
      </FormSection>,
    );
    expect(screen.getByRole('heading', { name: 'Identidade do cenário', level: 3 })).toBeDefined();
    expect(screen.getByText('Campos descritivos.')).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toBeDefined();
  });

  it('impede envio nativo e chama apenas o handler definido pelo consumidor', () => {
    const onSubmit = vi.fn();
    render(
      <FormPanel
        title="Rascunho local"
        description="Nenhum dado será salvo."
        onSubmit={onSubmit}
        footer={<Button type="submit" variant="primary">Verificar</Button>}
      >
        <TextField label="Nome" name="name" required value="" onChange={() => undefined} />
      </FormPanel>,
    );

    const form = screen.getByRole('form', { name: 'Rascunho local' });
    expect(form.getAttribute('novalidate')).toBe('');
    const event = new Event('submit', { cancelable: true, bubbles: true });
    const wasNotCancelled = form.dispatchEvent(event);
    expect(wasNotCancelled).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Verificar' }).getAttribute('type')).toBe('submit');
  });

  it('não mostra resumo de erros quando não há problemas', () => {
    render(<FormErrorSummary errors={[]} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('permite ir diretamente ao campo inválido a partir do resumo', () => {
    render(
      <>
        <FormErrorSummary
          errors={[{ fieldId: 'titulo', label: 'Título', message: 'É obrigatório.' }]}
        />
        <TextField id="titulo" label="Título" error="É obrigatório." />
      </>,
    );
    const summary = screen.getByRole('alert');
    fireEvent.click(within(summary).getByRole('button', { name: /Título: É obrigatório/ }));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Título' }));
  });

  it('liga validação externa e resumo à tentativa real de submissão', () => {
    function Example() {
      const [name, setName] = useState('');
      const [submitted, setSubmitted] = useState(false);
      const error = submitted && !name.trim() ? 'Informe o nome do capítulo.' : '';
      return (
        <FormPanel
          title="Novo capítulo fictício"
          onSubmit={() => setSubmitted(true)}
          footer={<Button type="submit">Validar localmente</Button>}
        >
          <FormErrorSummary
            errors={error ? [{ fieldId: 'chapter', label: 'Capítulo', message: error }] : []}
          />
          <TextField
            id="chapter"
            name="chapter"
            label="Capítulo"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            error={error}
            required
          />
        </FormPanel>
      );
    }

    render(<Example />);
    fireEvent.submit(screen.getByRole('form', { name: 'Novo capítulo fictício' }));
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByRole('textbox', { name: /Capítulo/ }).getAttribute('aria-invalid')).toBe(
      'true',
    );

    fireEvent.change(screen.getByRole('textbox', { name: /Capítulo/ }), {
      target: { value: 'A Primeira Teia' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
