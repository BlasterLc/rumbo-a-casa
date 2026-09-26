const ARCHIVO = {
  color: '/marca/rumbo-simbolo.svg',
  claro: '/marca/rumbo-simbolo-oscuro.svg',
  mono: '/marca/rumbo-simbolo-monocromo.svg',
} as const;

export interface SimboloProps {
  tamano?: number;
  tono?: 'color' | 'claro' | 'mono';
}

/** El símbolo de marca. Se usa tal cual — nunca se redibuja. Ver guidelines/10-marca.md. El
 * nombre "Rumbo a Casa" es un nombre propio y no se traduce en ningún idioma. */
export function Simbolo({ tamano = 24, tono = 'color' }: SimboloProps) {
  return <img src={ARCHIVO[tono]} alt="Rumbo a Casa" width={tamano} height={tamano} />;
}
