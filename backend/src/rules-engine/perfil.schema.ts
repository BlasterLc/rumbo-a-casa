import { z } from 'zod';

export const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
] as const;

export const ZONAS_ESPECIALES = [
  'chiloe', 'palena', 'isla_de_pascua', 'juan_fernandez', 'ninguna',
] as const;

const conDesconocido = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal('desconocido')]);

export const IntegranteSchema = z.object({
  edad: z.number().int().min(0).max(120),
  discapacidadCertificada: z.boolean(),
});

export const PerfilSchema = z.object({
  postulanteEdad: conDesconocido(z.number().int().min(0).max(120)),
  region: conDesconocido(z.enum(REGIONES)),
  zonaEspecial: conDesconocido(z.enum(ZONAS_ESPECIALES)),
  tramoRSH: conDesconocido(z.number().min(0).max(100)),
  tienePropiedad: conDesconocido(z.boolean()),
  ahorroUF: conDesconocido(z.number().min(0)),
  antiguedadCuentaAhorroMeses: conDesconocido(z.number().min(0)),
  ingresoFamiliarMensualUF: conDesconocido(z.number().min(0)),
  ingresoFamiliarMensualCLP: conDesconocido(z.number().min(0)),
  integrantesGrupoFamiliar: conDesconocido(z.array(IntegranteSchema)),
  excepcionPostulacionIndividualDS49: conDesconocido(z.boolean()),
  subsidioPrevio: conDesconocido(
    z.enum(['DS49', 'DS1_T1', 'damnificado_2014', 'ninguno']),
  ),
  objetivo: conDesconocido(z.enum(['comprar', 'construir', 'arrendar'])),
});

export type Perfil = z.infer<typeof PerfilSchema>;
