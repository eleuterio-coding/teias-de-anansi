import { createContext } from 'react';
import type { ToastControls } from './types';

export const ToastContext = createContext<ToastControls | null>(null);
