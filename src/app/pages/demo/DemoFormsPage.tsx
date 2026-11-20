import { useState } from 'react';
import {
  CheckboxField,
  FormErrorSummary,
  FormPanel,
  FormSection,
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
  type FormError,
} from '../../../components/form';
import { useToast } from '../../../components/feedback';
import { Button, Card, ConfirmDialog } from '../../../components/ui';
import { DemoScaffold } from './DemoScaffold';

export default function DemoFormsPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('oficina');
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { notify } = useToast();

  const errors: FormError[] = [];
  if (attempted && !title.trim()) {
    errors.push({
      fieldId: 'demo-record-title',
      label: 'Título',
      message: 'Informe um título fictício.',
    });
  }
  if (attempted && !category) {
    errors.push({
      fieldId: 'demo-record-category',
      label: 'Categoria',
      message: 'Selecione uma categoria.',
    });
  }
  if (attempted && !confirmed) {
    errors.push({
      fieldId: 'demo-record-confirmed',
      label: 'Confirmação',
      message: 'Confirme que as informações são inventadas.',
    });
  }

  function clearLocalValues() {
    setTitle('');
    setCategory('');
    setDescription('');
    setOrigin('oficina');
    setConfirmed(false);
    setAttempted(false);
    setConfirmClear(false);
    notify({
      tone: 'info',
      title: 'Exemplo limpo',
      message: 'Somente os campos locais foram reiniciados.',
    });
  }

  function validateExample() {
    setAttempted(true);
    if (!title.trim() || !category || !confirmed) return;
    notify({
      tone: 'success',
      title: 'Validação local concluída',
      message: 'Campos válidos. Nenhuma informação foi enviada ou salva.',
    });
  }

  return (
    <DemoScaffold
      title="Formulários padronizados"
      description="Campos, ajuda contextual e erros demonstrados sem cadastro ou persistência."
    >
      <Card title="Sobre esta experiência">
        <p>
          Os dados digitados ficam apenas na memória da página. A ação
          <strong> Validar exemplo</strong> verifica campos localmente e não cria
          um tomo, personagem ou campanha.
        </p>
      </Card>

      <FormPanel
        title="Ficha editorial fictícia"
        description="Exemplo de formulário para testar os componentes, sem regras de RPG."
        onSubmit={validateExample}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(true)}>
              Limpar campos
            </Button>
            <Button variant="primary" type="submit">
              Validar exemplo
            </Button>
          </>
        }
      >
        <FormErrorSummary errors={errors} />

        <FormSection
          title="Identificação"
          description="Campos com rótulos, instruções e validação textual."
        >
          <TextField
            id="demo-record-title"
            label="Título"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="Ex.: Crônicas do Rio Inventado"
            hint="Use um título criado apenas para esta demonstração."
            error={errors.find((error) => error.fieldId === 'demo-record-title')?.message}
            maxLength={80}
            required
          />
          <SelectField
            id="demo-record-category"
            label="Categoria"
            value={category}
            onChange={(event) => setCategory(event.currentTarget.value)}
            options={[
              { value: 'tomo', label: 'Tomo ilustrativo' },
              { value: 'mapa', label: 'Mapa ilustrativo' },
              { value: 'relato', label: 'Relato ilustrativo' },
            ]}
            placeholder="Escolha uma categoria"
            error={errors.find((error) => error.fieldId === 'demo-record-category')?.message}
            required
          />
          <TextAreaField
            id="demo-record-description"
            label="Descrição fictícia"
            className="ds-form-span-full"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            hint="Campo opcional. Evite dados pessoais ou de campanhas reais."
            rows={4}
            maxLength={500}
          />
        </FormSection>

        <FormSection title="Opções" description="Escolhas associadas a grupos acessíveis.">
          <RadioGroupField
            name="demo-origin"
            legend="Origem do exemplo"
            value={origin}
            onChange={setOrigin}
            options={[
              { value: 'oficina', label: 'Oficina imaginária' },
              { value: 'arquivo', label: 'Arquivo inventado' },
            ]}
            required
          />
          <CheckboxField
            id="demo-record-confirmed"
            label="Confirmo que estas informações são fictícias"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.currentTarget.checked)}
            error={errors.find((error) => error.fieldId === 'demo-record-confirmed')?.message}
            required
          />
        </FormSection>
      </FormPanel>

      <ConfirmDialog
        open={confirmClear}
        title="Limpar os campos da demonstração?"
        description="Apenas os valores locais desta página serão apagados."
        confirmLabel="Limpar campos locais"
        tone="danger"
        onClose={() => setConfirmClear(false)}
        onConfirm={clearLocalValues}
      />
    </DemoScaffold>
  );
}
