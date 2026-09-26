import type { ReactNode } from 'react';

/**
 * El modelo marca énfasis con `**negrita**`. Lo convierte en `<strong>` a través de React (que ya
 * escapa el texto: nunca se interpreta HTML) en vez de mostrar los asteriscos. Un `**` sin pareja
 * se quita. Solo cubre la negrita, que es lo único que el prompt permite usar.
 */
export function TextoConNegritas({ texto }: { texto: string }) {
  const trozos = texto.split(/\*\*([^*]+)\*\*/);
  // El split con un grupo de captura alterna: texto, negrita, texto, negrita, …
  const nodos: ReactNode[] = trozos.map((trozo, i) =>
    i % 2 === 1 ? <strong key={i}>{trozo}</strong> : trozo.replaceAll('**', ''),
  );
  return <>{nodos}</>;
}
