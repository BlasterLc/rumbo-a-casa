import type { SyntheticEvent } from 'react';
import { BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';

export type DestinoBarraInferior = 'hablar' | 'plan' | 'documentos' | 'avisos';

export interface BarraInferiorProps {
  value?: DestinoBarraInferior;
  avisos?: number;
  onChange?: (e: SyntheticEvent, v: string) => void;
}

/**
 * Navegación principal en celular, fija al borde inferior. Cuatro destinos y no crece — cada
 * uno corresponde a una etapa real del trámite, no a una sección del producto.
 */
export function BarraInferior({ value, avisos = 0, onChange }: BarraInferiorProps) {
  const t = useT();
  return (
    <BottomNavigation
      value={value}
      onChange={onChange}
      showLabels
      sx={{
        position: 'sticky',
        bottom: 0,
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--surface-raised)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        '& .Mui-selected': { color: 'var(--brand)', fontWeight: 700 },
      }}
    >
      <BottomNavigationAction label={t.organisms.barraInferior.hablar} value="hablar" icon={<Icono nombre="chat" />} />
      <BottomNavigationAction label={t.organisms.barraInferior.miPlan} value="plan" icon={<Icono nombre="casa" />} />
      <BottomNavigationAction
        label={t.organisms.barraInferior.documentos}
        value="documentos"
        icon={<Icono nombre="papel" />}
      />
      <BottomNavigationAction
        label={t.organisms.barraInferior.avisos}
        value="avisos"
        icon={
          <Badge
            badgeContent={avisos}
            max={9}
            sx={{ '& .MuiBadge-badge': { backgroundColor: 'var(--warning)', color: 'var(--ink-on-fill)' } }}
          >
            <Icono nombre="campana" />
          </Badge>
        }
      />
    </BottomNavigation>
  );
}
