# Formulários padronizados — Etapa 2.07

Biblioteca agnóstica de domínio, em React e TypeScript, para editar dados
autorizados. Nenhum componente consulta Firebase, persiste informações ou
realiza navegação sem uma ação expressa da página consumidora.

## Importação

```tsx
import {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  RadioGroupField,
  FormSection,
  FormPanel,
  FormErrorSummary,
  type FormError,
} from '../../components/form';
import { Button } from '../../components/ui';
```

## Componentes

| Componente | Contrato |
| --- | --- |
| `TextField` | `label` obrigatório, props nativas de input, `hint`, `error`, `required` |
| `TextAreaField` | `label`, props nativas de textarea, linhas, ajuda e erro |
| `SelectField` | `label`, opções `{ value, label, disabled? }`, placeholder opcional |
| `CheckboxField` | `label`, checked/onChange nativos, `hint`, `error`, required |
| `RadioGroupField` | `legend`, `name`, `options`, `value`, `onChange(value)` |
| `FormSection` | Agrupamento visual e semântico de campos |
| `FormPanel` | Formulário com cabeçalho, footer e onSubmit obrigatório |
| `FormErrorSummary` | Lista de mensagens com botão que coloca foco em cada campo |

Os componentes `TextField`, `SelectField`, `TextAreaField` e
`CheckboxField` aceitam valor controlado e eventos nativos
(`value/onChange` ou `checked/onChange`). `RadioGroupField` recebe
`value: string` e `onChange(value: string)`. IDs de campos são gerados
com `useId` se não forem informados.

## Validação

- **A biblioteca não inventa regras de validação.** A página define regras de
  domínio, valida no evento de envio e passa `error` aos controles.
- Os controles preservam `required`, `minLength`, `maxLength`,
  `pattern`, tipos nativos e demais atributos HTML quando aplicáveis.
- `error` ativa `aria-invalid="true"`, mostra texto e associa o erro ao
  campo via `aria-describedby`. O `hint` é associado da mesma forma.
- `FormErrorSummary` só aparece quando recebe erros. Cada
  `fieldId` **deve corresponder a um id existente** e único na página.
- `FormPanel` usa `noValidate=true` por padrão para permitir validação
  e mensagens próprias. A página pode optar por `noValidate={false}` e
  usar validação nativa; isso pode impedir que o callback de `onSubmit` seja
  disparado até que os requisitos HTML sejam cumpridos.
- `FormPanel` **sempre impede o submit HTML nativo** antes de chamar
  `onSubmit`, portanto não envia dados automaticamente.
- `FormPanel` não tem `action` nem `method` na API.
- Botão de envio deve ser `<Button type="submit">…</Button>`.
  Os demais `Button` usam `type="button"` por padrão.
- Validação do servidor e autorização por usuário continuam obrigatórias
  nos módulos reais; validação cliente não substitui controle de acesso.

## Exemplo local sem persistência

```tsx
import { useState } from 'react';

function RascunhoLocal() {
  const [titulo, setTitulo] = useState('');
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const erro = tentouEnviar && !titulo.trim()
    ? 'Informe um título.'
    : '';

  return (
    <FormPanel
      title="Novo capítulo fictício"
      description="Demonstração local sem gravação de dados."
      onSubmit={() => setTentouEnviar(true)}
      footer={<Button variant="primary" type="submit">Verificar</Button>}
    >
      <FormErrorSummary
        errors={erro ? [{
          fieldId: 'titulo-exemplo',
          label: 'Título',
          message: erro,
        }] : []}
      />
      <FormSection title="Identificação">
        <TextField
          id="titulo-exemplo"
          label="Título"
          value={titulo}
          onChange={(event) => setTitulo(event.currentTarget.value)}
          error={erro}
          required
        />
      </FormSection>
    </FormPanel>
  );
}
```

O exemplo é uma ilustração documental, **não** foi publicado em uma nova
rota, nem contém fichas/campanhas reais.

## Contrato visual e de uso

- Estilos: `src/styles/forms.css` (tokens da identidade 2.02).
- Import único na entrada `src/app/main.tsx`.
- Controle de foco `focus-visible` com dourado, erro com texto legível
  e vermelho terroso claro; sem depender apenas de cor.
- Campos e agrupamentos reorganizam-se em uma coluna no celular.
- Usar `FormSection` para organização editorial; usar
  `RadioGroupField`/fieldset para uma escolha exclusiva.
- Não usar componentes genéricos de formulário para simular ações que
  o Hub ainda não oferece.

## Limites de escopo

Não há upload de arquivos, calendário, editor rico, máscara, regras
complexas de domínio, integração a servidor ou formulários de RPG reais.
Essas funcionalidades exigem especificação e autorização próprias.

Testes de comportamento ficam em `tests/forms.test.tsx`.
A execução de `npm run check`, análise visual real e auditoria completa
de acessibilidade permanecem pendentes enquanto não houver resultados
efetivamente verificados.
