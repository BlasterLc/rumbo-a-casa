# Live chat run against the public URL

Date: 2026-09-25 00:38 UTC (after the fix in commit `11de6b1` was deployed).
Endpoint: `POST https://d26duk07atmc3z.cloudfront.net/api/chat`, one session, four messages.
The family is fictional (the same one as `GET /api/demo`); no personal data was used.

| Turn | User message (Spanish, abridged) | HTTP | Time | Profile fields known | Verdicts (DS49 / DS1 / DS19 / DS52) | Checklist for |
|---|---|---|---|---|---|---|
| 1 | Family of 4 in Santiago, wants to buy a first home | 200 | 3.7 s | 0/13 | all `falta_dato` | none |
| 2 | Age 34, partner 33, children 8 and 5, no disability | 200 | 4.7 s | 4/13 | all `falta_dato` | none |
| 3 | RSH bracket 40%, no property, no previous subsidy | 200 | 3.4 s | 7/13 | `falta_dato` / `falta_dato` / `elegible` / `falta_dato` | DS19 |
| 4 | 12 UF saved, account open 18 months, income about 22 UF/month | 200 | 7.5 s | 11/13 | `elegible` / `no_elegible` / `elegible` / `elegible` | DS49, DS19, DS52 |

The verdicts come from the deterministic rules engine, not from the model: the model asks questions, saves the answers through the `actualizar_perfil` tool and explains the result.

Final assistant message (turn 4), verbatim:

> ¡Excelentes noticias! Ustedes son elegibles para **tres subsidios**:
>
> 1. **DS49** (Fondo Solidario de Elección de Vivienda): Es para familias en mayor vulnerabilidad. Cumplen todos los requisitos: tramo RSH 40%, ahorro de 12 UF (mínimo 10), no tienen propiedad y es su primer subsidio. **Este es el más accesible para ustedes.**
>
> 2. **DS19** (Integración Social y Territorial): Aplican por la "Ruta B" porque no han tenido subsidio antes, están en RSH ≤90% y no tienen propiedad. Este programa financia viviendas nuevas en proyectos específicos. El ahorro mínimo dependerá del proyecto concreto.
>
> 3. **DS52** (Arriendo): Cumplen los requisitos, pero ustedes quieren **comprar**, no arrendar, así que probablemente no les interese.
>
> **DS1** (sectores medios) no aplica en su caso porque requiere más ahorro o un tramo RSH más alto.
>
> Dado que quieren **comprar**, les recomiendo enfocarse en **DS49** o **DS19**.
>
> ¿Les gustaría que les prepare la lista de documentos que necesitan para postular a estos programas?
