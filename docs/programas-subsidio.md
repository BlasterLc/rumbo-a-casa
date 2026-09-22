# Programas de subsidio habitacional — reglas y fuentes

Investigado 2026-09-21/22 contra fuentes oficiales (minvu.gob.cl, chileatiende.gob.cl, folletos oficiales MINVU/Serviu Metropolitana) y verificado con el usuario. Este documento es la fuente de verdad que implementa `backend/src/rules-engine/` — cada regla codificada debe citar el decreto (y, cuando corresponda, la resolución del llamado vigente) listados aquí. Los PDFs originales usados como fuente quedan en `dsDocs/` (no versionado, solo referencia local).

Perfil de entrada compartido para los 4 programas (ver spec técnico): grupo familiar, tramo RSH, ingresos, ahorro acreditado, región/comuna, propiedad existente, objetivo. Cuando falte un dato necesario para evaluar un programa, el motor devuelve `falta_dato` con la lista de campos pendientes — nunca asume.

Los montos de subsidio en UF son **informativos**, no condicionan `elegible`/`no_elegible`: dependen también de características de la vivienda (m², tipo, ubicación exacta) que el perfil de la familia no captura. La elegibilidad se decide solo con los campos del perfil.

---

## DS49 — Fondo Solidario de Elección de Vivienda

**Decreto:** D.S. N°49 (V. y U.) de 2011. **Fuente:** `dsDocs/ds49/DS49-guia-aplicacion-compra-20.pdf` (v/noviembre 2019), minvu.gob.cl.

**Elegibilidad:**
- RSH ≤ 40% (más vulnerable).
- No propietario de vivienda.
- Ahorro mínimo: 10 UF en cuenta de ahorro para la vivienda.
- 18 años o más.
- Grupo familiar acreditado en el RSH. Postulación individual (persona sola) solo con excepción: adulto mayor, viudez, discapacidad certificada (COMPIN), indígena reconocido, o incluido en el Informe Valech.

**Tope de vivienda:** 950 UF. Mayor en comunas de la provincia de Palena (Región de Los Lagos) y en las regiones de Aysén, Magallanes y Antártica Chilena — **sin cifra fija publicada por MINVU**, quien remite a un simulador (ver más abajo).

**Subsidio:** aporte del Estado = subsidio base (**desde 314 UF**, varía según ubicación de la vivienda, sin tabla pública) + complementarios:

| Complementario | Monto |
|---|---|
| Vivienda bien localizada en zona urbana | 200 UF |
| Factibilización (comuna sin el complementario anterior) | 120 UF |
| Vivienda en altura (edificio de 3+ pisos) | 110 UF |
| Discapacidad (obras especiales en la vivienda) | 20 u 80 UF |
| Superficie adicional (vivienda > 37,5 m²) | hasta 50 UF |
| Premio al ahorro adicional (sobre las 10 UF acreditadas) | hasta 30 UF (Estado aporta 1,5 UF por cada UF adicional ahorrada) |

**Simulador oficial para el monto exacto** (especialmente en las 4 zonas sin cifra publicada): `simuladorsubsidiods49.minvu.cl` — ver nota de integración en el spec técnico, sección "Backlog técnico". Es ASP.NET MVC 5 server-rendered; no se puede embeber (`X-Frame-Options: SAMEORIGIN`, CSP `frame-ancestors 'self'`). Para el MVP se linkea, no se scrapea.

**Modalidades:** compra nueva o usada, construcción en nuevo terreno, sitio propio, densificación. Postulación individual o colectiva (comités/cooperativas).

---

## DS1 — Sistema Integrado de Subsidio Habitacional (Sectores Medios)

**Decreto:** D.S. N°1 de 2011. Llamado 2026: Resolución Exenta N°669/2026. **Fuente:** chileatiende.gob.cl, infografía oficial MINVU "Montos de subsidio según alternativa" (aportada por el usuario).

**Elegibilidad general:** 18+, no propietario (ni de un sitio con destino habitacional), cuenta de ahorro con ≥12 meses de antigüedad.

**3 tramos**, con requisitos y montos que varían por zona geográfica:

| Tramo | RSH máx. | Ahorro mín. | Zona Extremo Norte (y Provincia de Chiloé*) | Zona Regular (Coquimbo–Los Lagos) | Zona Extremo Sur e Insular** |
|---|---|---|---|---|---|
| 1 | 60% (90% adultos mayores 60+) | 30 UF | tope 1.200 UF / subsidio fijo 700 UF | tope 1.100 UF / subsidio fijo 600 UF | tope 1.200 UF / subsidio fijo 750 UF |
| 2 | 80% (90% AM) | 40 UF | tope 1.800 UF / subsidio 350–650 UF según precio | tope 1.600 UF / subsidio 250–550 UF | tope 1.800 UF / subsidio 400–700 UF |
| 3 | 90%, o sin tope de RSH si cumple los topes de ingreso familiar de abajo | 80 UF | tope 2.600 UF / subsidio 350–500 UF | tope 2.200 UF / subsidio 250–400 UF | tope 2.600 UF / subsidio 350–550 UF |

\* Así aparece en la fuente oficial: la Provincia de Chiloé se agrupa con la zona extremo norte pese a su ubicación geográfica (tratamiento especial por aislamiento).
\** Aysén, Magallanes y Antártica Chilena, Provincia de Palena, Isla de Pascua, Juan Fernández.

**Tramo 3 sin cumplir RSH ≤ 90%:** puede postular igual si no supera estos topes de **ingreso mensual familiar**: 1 integrante $2.589.712 — 2 integrantes $3.386.546 — 3 integrantes $3.705.280 — 4 o más integrantes $4.024.014.

**Pendiente (no afecta el MVP):** MINVU anunció para 2026 un nuevo tramo hasta 4.000 UF, sin detalle público del ahorro/RSH exigido al momento de esta investigación. No se codifica hasta que se publique.

---

## DS19 — Programa de Integración Social y Territorial

**Decreto:** D.S. N°19 (V. y U.) de 2016, modificado por D.S. N°16 (V. y U.) de 2020. **Fuente:** minvu.gob.cl, `dsDocs/ds19/DS19-diptico.pdf` (v/diciembre 2022).

La elegibilidad **no** es un solo corte de RSH: depende de si la familia ya tiene otro subsidio.

**Ruta A — con subsidio previo** (DS49, DS1 Tramo 1, o subsidio a damnificados desde 2014):
- Compra una vivienda de 1.200 / 1.300 / 1.400 UF (según tipología, región y comuna) **pagada en su totalidad**, sin crédito hipotecario.
- Gastos operacionales y de escrituración cubiertos (el subsidio incluye hasta 10 UF para eso).
- Cupos limitados: representan al menos el 25% del total de viviendas del proyecto.

**Ruta B — sin subsidio previo** (o con DS1 Tramo 1/2/3 ya en trámite):
- RSH ≤ 90%.
- Ahorro mínimo familiar (monto no fijo — depende del proyecto específico al que se postule, MINVU no publica una cifra única).
- No propietario (postulante, cónyuge, conviviente civil, o integrantes del núcleo familiar declarado).
- Vivienda entre 1.400 y 2.800 UF según región/comuna de desplazamiento (rangos publicados: 1.400–1.600, 1.500–1.700, >1.600–2.400, >1.600–2.600, >1.700–2.800 UF).
- Puede requerir crédito hipotecario complementario (el subsidio no cubre el 100% en estos rangos).
- El beneficiario paga los gastos de escrituración (a diferencia de la Ruta A).

No se encontró edad mínima explícita en la fuente; se asume 18+ por ser requisito general de postulación RSH en todos los programas.

---

## DS52 — Subsidio de Arriendo de Vivienda

**Decreto:** D.S. N°52 de 2013. Llamado 2026 (RM): Resolución Exenta N°809/2026. **Fuente:** chileatiende.gob.cl, `dsDocs/ds52/Diptico-Subsidio-de-Arriendo.pdf` (Serviu Metropolitana).

**Elegibilidad:**
- No contar con vivienda propia ni con un subsidio habitacional anterior.
- RSH ≤ 70%.
- Ahorro mínimo: 4 UF en cuenta de ahorro para la vivienda.
- Ingreso familiar mensual: entre 7 y 25 UF (+8 UF por cada integrante adicional desde el 4°).
- 18 años o más. Mayores de 60 no necesitan acreditar núcleo familiar.
- Postular al menos con cónyuge, conviviente civil, conviviente (no formalizado) o hijo (según conste en el RSH) — excepto mayores de 60.

**Beneficio:** 170 UF totales, entregadas mensualmente con tope de 4,2 UF (hasta 4,9 UF/mes en RM y zonas especiales), utilizables de forma consecutiva o fragmentada en un plazo máximo de 8 años.

**Tope de valor del arriendo:** 13 UF en la Región Metropolitana. En el resto del país varía según la comuna — cifra exacta no disponible; **las cifras de este documento son las de Serviu Metropolitana (RM)**, otras regiones publican su propia resolución de llamado con posibles variaciones.

---

## Notas para la implementación del rules-engine

- Cada función de evaluación por programa debe devolver `elegible | no_elegible | falta_dato`, con un objeto `regla` que cite: decreto, y cuando aplique, resolución del llamado y fecha de esta investigación (2026-09-21/22) como fecha de la fuente.
- DS19 no es un tramo de RSH simple: la función debe primero determinar la ruta (A: ya tiene otro subsidio: DS49 / DS1-T1 / damnificado 2014+; B: RSH ≤90% sin subsidio previo) antes de evaluar el resto.
- Los montos en UF de la tabla de DS1 sí son exactos y completos (3 tramos × 3 zonas) — se pueden codificar como tabla de datos, no como aproximación.
- Para DS49 y DS52 fuera de RM, cualquier monto exacto que se muestre debe ir acompañado de la nota "puede variar según tu región/comuna, verifica en minvu.gob.cl" — no se debe presentar como cifra cerrada.
- Zonas de DS1 (para mapear región → zona): Extremo Norte = Arica y Parinacota, Tarapacá, Antofagasta, Atacama + Provincia de Chiloé; Regular = Coquimbo a Los Lagos (excepto Chiloé); Extremo Sur e Insular = Aysén, Magallanes y Antártica Chilena, Provincia de Palena, Isla de Pascua, Juan Fernández.
