import { spacePx } from '../../../theme/tokens';

export interface FranjaProps {
  /** Entre 96 y 120 en pantalla; 24 para la firma de cabecera. */
  alto?: number;
  tono?: 'brand' | 'accent';
  /** A qué canto se pega la banda. */
  borde?: 'abajo' | 'arriba';
  ancho?: number;
}

const PASO = 96;
const RADIO_ARCO = spacePx['space-6'];
const DIAMETRO_DISCO = spacePx['space-4'];

/**
 * Banda decorativa de marca: medios redondeles sentados sobre una línea, más una huella de
 * discos. Siempre toca un borde de la pieza; dos tintas como máximo por banda.
 */
export function Franja({ alto = 96, tono = 'brand', borde = 'abajo', ancho }: FranjaProps) {
  const fondo = tono === 'brand' ? 'var(--surface-brand)' : 'var(--surface-accent-soft)';
  const arco = tono === 'brand' ? 'var(--brand)' : 'var(--accent)';
  const huella = tono === 'brand' ? 'var(--surface-base)' : undefined;
  const yBase = borde === 'abajo' ? alto : 0;
  const yDisco = borde === 'abajo' ? alto - DIAMETRO_DISCO / 2 : DIAMETRO_DISCO / 2;
  const idPatron = `franja-${tono}-${alto}-${borde}`;

  return (
    <svg
      data-testid="franja"
      role="presentation"
      aria-hidden="true"
      width={ancho ?? '100%'}
      height={alto}
      viewBox={`0 0 ${PASO} ${alto}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: ancho ?? '100%', height: alto }}
    >
      <defs>
        <pattern id={idPatron} width={PASO} height={alto} patternUnits="userSpaceOnUse">
          <rect width={PASO} height={alto} fill={fondo} />
          <circle cx={PASO / 2} cy={yBase} r={RADIO_ARCO} fill={arco} />
          {huella &&
            [0.15, 0.5, 0.85].map((f) => (
              <circle key={f} cx={PASO * f} cy={yDisco} r={DIAMETRO_DISCO / 2} fill={huella} />
            ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${idPatron})`} />
    </svg>
  );
}
