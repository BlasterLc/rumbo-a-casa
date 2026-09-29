const ARCHIVO = {
  color: '/marca/rumbo-simbolo.svg',
  claro: '/marca/rumbo-simbolo-oscuro.svg',
  mono: '/marca/rumbo-simbolo-monocromo.svg',
} as const;

export interface SimboloProps {
  tamano?: number;
  tono?: 'color' | 'claro' | 'mono';
  /** Sube el dibujo para que su centro visual (no el de su caja de 64×64) quede a la altura del texto vecino. */
  alinearConTexto?: boolean;
}

/** El símbolo de marca. Se usa tal cual — nunca se redibuja. Ver guidelines/10-marca.md. El
 * nombre "Rumbo a Casa" es un nombre propio y no se traduce en ningún idioma. */
export function Simbolo({ tamano = 24, tono = 'color', alinearConTexto = false }: SimboloProps) {
  // Las barras y la casita ocupan de y=23 a y=56 en el lienzo de 64: el dibujo queda ~12% más abajo
  // que el centro de su caja, y junto a un texto se ve desalineado.
  const estilo = alinearConTexto ? { transform: `translateY(${-tamano * 0.12}px)` } : undefined;
  return <img src={ARCHIVO[tono]} alt="Rumbo a Casa" width={tamano} height={tamano} style={estilo} />;
}
