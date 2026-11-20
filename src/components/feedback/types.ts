export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

export type ToastInput = {
  tone?: NoticeTone;
  title: string;
  message: string;
  /**
   * Duração em milissegundos. Zero mantém o aviso até dispensa.
   * Avisos de erro/atenção permanecem por padrão.
   */
  durationMs?: number;
};

export type ToastRecord = {
  id: string;
  tone: NoticeTone;
  title: string;
  message: string;
  durationMs: number;
};

export type ToastControls = {
  notify: (notice: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};
