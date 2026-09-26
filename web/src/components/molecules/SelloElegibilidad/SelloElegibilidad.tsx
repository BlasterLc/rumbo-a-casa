import { Chip } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens, sizePx } from '../../../theme/tokens';

export type EstadoElegibilidad = 'califica' | 'falta' | 'posible' | 'noAplica';

const ESTILO: Record<EstadoElegibilidad, { color: string; icono: NombreIcono }> = {
  califica: { color: 'var(--success)', icono: 'check' },
  falta: { color: 'var(--warning)', icono: 'alerta' },
  posible: { color: 'var(--brand)', icono: 'info' },
  noAplica: { color: 'var(--border-strong)', icono: 'menos' },
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
  const { color, icono } = ESTILO[estado];
  const palabra = t.molecules.selloElegibilidad[estado];
  const texto = programa ? `${programa} · ${palabra}` : palabra;
  return (
    <Chip
      icon={<Icono nombre={icono} tamano={compacto ? 16 : 20} />}
      label={texto}
      sx={{
        height: compacto ? sizePx['size-chip-compacto'] : sizePx['size-touch'],
        backgroundColor: color,
        color: 'var(--ink-on-fill)',
        fontFamily: 'var(--font-sans)',
        fontWeight: compacto ? typeTokens.label.fontWeight : typeTokens['body-strong'].fontWeight,
        fontSize: compacto ? typeTokens.label.fontSize : typeTokens['body-strong'].fontSize,
        letterSpacing: compacto ? typeTokens.label.letterSpacing : undefined,
        '& .MuiChip-icon': { color: 'var(--ink-on-fill)' },
      }}
    />
  );
}
