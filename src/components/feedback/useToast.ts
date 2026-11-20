import { useContext } from 'react';
import { ToastContext } from './toast-context';

export function useToast() {
  const controls = useContext(ToastContext);
  if (controls === null) {
    throw new Error('useToast deve ser usado dentro de ToastProvider.');
  }
  return controls;
}
