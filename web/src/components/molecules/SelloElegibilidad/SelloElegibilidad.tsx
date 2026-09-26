import { Chip } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';

export type EstadoElegibilidad = 'califica' | 'falta' | 'posible' | 'noAplica';

const ESTILO: Record<EstadoElegibilidad, { fondo: string; tinta: string; icono: NombreIcono }> = {
  califica: { fondo: 'var(--success)', tinta: 'var(--ink-on-fill)', icono: 'check' },
  falta: { fondo: 'var(--warning)', tinta: 'var(--ink-on-fill)', icono: 'alerta' },
  posible: { fondo: 'var(--brand)', tinta: 'var(--ink-on-fill)', icono: 'info' },
  noAplica: { fondo: 'var(--surface-sunken)', tinta: 'var(--ink-muted)', icono: 'menos' },
};

export interface SelloElegibilidadProps {
  estado: EstadoElegibilidad;
  programa?: string;
  compacto?: boolean;
}

/**
 * El resultado del motor de reglas para un programa. Solo existen estos cuatro valores y no se
 * agregan más sin cambiar el motor. El sello nunca viaja solo: junto a él van la razón y la
 * regla citada (ver `TarjetaPrograma`, Task 22).
 */
export function SelloElegibilidad({ estado, programa, compacto = false }: SelloElegibilidadProps) {
  const t = useT();
  const { fondo, tinta, icono } = ESTILO[estado];
  const palabra = t.molecules.selloElegibilidad[estado];
  const texto = programa ? `${programa} · ${palabra}` : palabra;
  return (
    <Chip
      icon={<Icono nombre={icono} tamano={compacto ? 16 : 20} />}
      label={texto}
      sx={{
        height: compacto ? 26 : 'var(--size-touch)',
        backgroundColor: fondo,
        color: tinta,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: compacto ? '13px' : '16px',
        letterSpacing: compacto ? '0.04em' : undefined,
        '& .MuiChip-icon': { color: tinta },
      }}
    />
  );
}
