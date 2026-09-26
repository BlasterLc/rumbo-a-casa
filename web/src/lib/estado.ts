import type { EstadoElegibilidad as EstadoBackend } from '../types/dominio';
import type { EstadoElegibilidad as EstadoUI } from '../components/molecules/SelloElegibilidad/SelloElegibilidad';

/**
 * El motor de reglas del backend solo conoce 3 estados. El design system define un cuarto,
 * 'posible' (una condición que depende de algo aún no verificado contra el llamado), que
 * ninguna regla del motor produce hoy — no se simula. Si el backend lo agrega, se mapea aquí.
 */
export function mapEstado(estado: EstadoBackend): EstadoUI {
  switch (estado) {
    case 'elegible':
      return 'califica';
    case 'falta_dato':
      return 'falta';
    case 'no_elegible':
      return 'noAplica';
  }
}
