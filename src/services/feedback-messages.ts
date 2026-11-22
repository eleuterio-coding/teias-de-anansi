/**
 * Apenas textos previamente aprovados podem sair de exceções de autenticação
 * para o usuário. Mensagens arbitrárias podem conter UID, caminho de dados,
 * stack, e-mail técnico ou configuração do SDK.
 */
const ALLOWED_AUTH_MESSAGES = new Set([
  'Usuário ou senha incorretos.',
  'Este acesso está desativado. Fale com o Mestre.',
  'Muitas tentativas de entrada. Tente novamente mais tarde.',
  'Não foi possível conectar. Confira sua internet e tente novamente.',
  'O acesso online está indisponível nesta instalação do Hub.',
  'Não foi possível concluir o acesso agora. Tente novamente.',
  'Informe seu usuário e sua senha.',
]);

export const GENERIC_AUTH_FAILURE = 'Não foi possível concluir o acesso agora. Tente novamente.';

export function safeAuthFeedback(message: unknown): string {
  return typeof message === 'string' && ALLOWED_AUTH_MESSAGES.has(message)
    ? message
    : GENERIC_AUTH_FAILURE;
}
