import type { ReactNode } from 'react';

/**
 * Placeholder mínimo. La implementación real (sesión persistida en localStorage, perfil,
 * historial de chat) la construye Task 26 — este archivo existe desde antes solo porque
 * `web/src/test/utilidades.tsx` (Task 2) lo importa, y Task 9 es el primer test que consume
 * `renderConIdioma` de ese módulo. Task 26 reemplaza este cuerpo por completo.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
