import type { z } from 'zod';
import { PerfilSchema, type Perfil } from '../rules-engine/index';

export const VALOR_UF = {
  clp: 40_991.75,
  fecha: '2026-09-22',
  fuente: 'mindicador.cl/api/uf',
} as const;

export const PERFIL_VACIO: Perfil = {
  postulanteEdad: 'desconocido',
  region: 'desconocido',
  zonaEspecial: 'desconocido',
  tramoRSH: 'desconocido',
  tienePropiedad: 'desconocido',
  ahorroUF: 'desconocido',
  antiguedadCuentaAhorroMeses: 'desconocido',
  ingresoFamiliarMensualUF: 'desconocido',
  ingresoFamiliarMensualCLP: 'desconocido',
  integrantesGrupoFamiliar: 'desconocido',
  excepcionPostulacionIndividualDS49: 'desconocido',
  subsidioPrevio: 'desconocido',
  objetivo: 'desconocido',
};

export interface CampoRechazado {
  campo: string;
  error: string;
}

export interface ResultadoCambios {
  perfil: Perfil;
  aceptados: string[];
  rechazados: CampoRechazado[];
}

const aUF = (clp: number) => Math.round((clp / VALOR_UF.clp) * 100) / 100;
const aCLP = (uf: number) => Math.round(uf * VALOR_UF.clp);

/**
 * El RSH agrupa a los hogares en tramos de 40, 50, ..., 100 %. El más bajo es el 40: quien dice
 * "30 %" está dentro del primer 40 %; un valor entre tramos (45 %) pertenece al siguiente (50 %).
 * Sin esto el modelo rechaza el dato y la conversación se atasca pidiéndolo una y otra vez.
 */
function normalizarTramoRSH(valor: unknown): unknown {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor > 100) return valor;
  return Math.max(40, Math.ceil(valor / 10) * 10);
}

const esCampoPerfil = (campo: string): campo is keyof Perfil => campo in PerfilSchema.shape;

export function aplicarCambios(perfil: Perfil, cambios: Record<string, unknown>): ResultadoCambios {
  const nuevo: Record<string, unknown> = { ...perfil };
  const aceptados: string[] = [];
  const rechazados: CampoRechazado[] = [];

  for (const [campo, valor] of Object.entries(cambios)) {
    if (campo === 'ahorroCLP') {
      if ('ahorroUF' in cambios) continue;
      if (typeof valor === 'number' && Number.isFinite(valor) && valor >= 0) {
        nuevo.ahorroUF = aUF(valor);
        aceptados.push('ahorroUF');
      } else {
        rechazados.push({ campo, error: 'Debe ser un número mayor o igual a 0, en pesos chilenos.' });
      }
      continue;
    }
    if (!esCampoPerfil(campo)) {
      rechazados.push({ campo, error: 'Campo desconocido.' });
      continue;
    }
    const esquema: z.ZodType = PerfilSchema.shape[campo];
    const resultado = esquema.safeParse(campo === 'tramoRSH' ? normalizarTramoRSH(valor) : valor);
    if (resultado.success) {
      nuevo[campo] = resultado.data;
      aceptados.push(campo);
    } else {
      rechazados.push({ campo, error: resultado.error.issues.map((i) => i.message).join('; ') });
    }
  }

  // DS52 evalúa el ingreso en UF y DS1 en pesos: si llega uno solo, se deriva el otro.
  const llegoCLP = aceptados.includes('ingresoFamiliarMensualCLP');
  const llegoUF = aceptados.includes('ingresoFamiliarMensualUF');
  if (llegoCLP && !llegoUF) {
    const clp = nuevo.ingresoFamiliarMensualCLP;
    nuevo.ingresoFamiliarMensualUF = typeof clp === 'number' ? aUF(clp) : 'desconocido';
  }
  if (llegoUF && !llegoCLP) {
    const uf = nuevo.ingresoFamiliarMensualUF;
    nuevo.ingresoFamiliarMensualCLP = typeof uf === 'number' ? aCLP(uf) : 'desconocido';
  }

  return { perfil: nuevo as Perfil, aceptados, rechazados };
}
