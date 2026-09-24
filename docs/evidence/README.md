# Evidencia — Fundación AWS

## URL pública viva (ship gate)

**SiteUrl:** https://d26duk07atmc3z.cloudfront.net/

Verificada 2026-09-22: `GET /` → 200. `GET /api/hello` → `{"message":"Hola desde Lambda","region":"us-east-1"}`.

- Stack: `RumboACasa`
- Región: `us-east-1`
- Desplegado: 2026-09-22
- Corresponde a la fundación técnica (Tasks 1-7 de `docs/superpowers/plans/2026-09-20-fundacion-aws.md`): CloudFront + S3 (SPA) + Lambda Function URL.

## Evidencia de conexión del coding agent

- **CloudTrail:** `docs/evidence/cloudtrail-createstack.json` — eventos `CreateChangeSet`/`ExecuteChangeSet`/`DeleteStack` sobre el stack `RumboACasa`, usuario `aws-cdk-augus` (identidad propia del agente para desplegar, vía el rol de despliegue de CDK), con MFA. IP y ID de cuenta redactados; solo se guardaron campos no sensibles.
- **Capturas** (Augusto): `deploy-terminal.png` (log de `cdk deploy` completando el stack `RumboACasa`, recortado para no mostrar el Stack ARN/ID de cuenta) y `site-live.png` (el sitio ya cargando en el navegador desde la URL de CloudFront).

## Conexión del coding agent a AWS desde la terminal del desarrollador (2026-09-24)

El coding agent (Claude Code) opera contra la cuenta de AWS con las credenciales del usuario IAM `blaster`, por dos vías, y ambas quedan registradas en CloudTrail. Extracto redactado (sin IP, ID de cuenta, ARN ni claves): `docs/evidence/cloudtrail-agente-blaster.json`. Imagen del registro del evento del MCP, tomada del export JSON del *Event history* de la consola de CloudTrail (us-east-1) y redactada: `docs/evidence/cloudtrail-evento-mcp.png`.

- **Servidor MCP oficial de AWS (`aws-mcp`):** el agente ejecutó un script de solo lectura con la herramienta `run_script` (estado del stack `RumboACasa` y sus Lambdas). CloudTrail registra la llamada `cloudformation:DescribeStacks` con `userAgent` e `invokedBy` iguales a `aws-mcp.amazonaws.com`, a nombre del usuario `blaster`.
- **AWS CLI:** 6 llamadas de solo lectura (`sts`, `cloudformation`, `lambda`, `dynamodb`, `cloudfront`, `logs`) marcadas con `app/claude-code-agent` en el user agent, para poder distinguirlas de las del desarrollador.
- Además, durante el desarrollo el agente leyó los logs de CloudWatch de la Lambda (`logs:FilterLogEvents`) para diagnosticar los `503` de Bedrock, y CDK desplegó los cambios.

## Modo demo (sin Bedrock) — desplegado 2026-09-24

`GET /api/demo` devuelve una conversación de ejemplo con una familia ficticia; el texto del asistente es fijo, pero la elegibilidad y el plan de papeles los calcula el motor de reglas real. Funciona sin Bedrock ni DynamoDB.

- Commit: `1ca27b3` (`feat: ruta GET /api/demo con conversación de ejemplo sin Bedrock`).
- Captura del `cdk deploy RumboACasa` completando el update (36,61 s; solo cambia la Lambda `ApiFn`): `docs/evidence/deploy-demo-terminal.png`. El ID de cuenta y el Stack ARN están redactados.
- Verificado contra la URL pública: `GET /api/demo` → 200, `modo: "demo"`, 4 pasos; en el último, DS49 `elegible`, DS1 `no_elegible`, DS19 `elegible`, DS52 `elegible`. `POST /api/demo` → 405.

## Bedrock

- Modelo elegido: `us.anthropic.claude-haiku-4-5-20251001-v1:0` (económico, buen soporte de *tool use*; lo usa `chat-handler`).
- `POST /api/chat` se desplegó el 2026-09-23 (tabla `Sesiones` + permisos IAM). Sigue respondiendo `503` (`asistente_no_disponible`) porque Bedrock rechaza la invocación desde la cuenta; el manejo de errores funciona como está diseñado (503 limpio, no guarda sesión).
- Causa, según los logs de CloudWatch, que fue cambiando:
  - 2026-09-22: `AccessDeniedException` por verificación de cuenta (ya resuelta).
  - 2026-09-24 22:24 UTC: `AccessDeniedException` por la suscripción de AWS Marketplace de Anthropic (formulario "Anthropic use case details" en revisión).
  - 2026-09-24 22:40 UTC en adelante: `ThrottlingException: Too many tokens per day` (cuota diaria de tokens de la cuenta). **Pendiente:** pedir aumento en Service Quotas → Bedrock o por soporte.
- Mientras tanto, la app viva se apoya en `GET /api/demo`.
- Reintento de la invocación directa:

```
AWS_PROFILE=rumbo aws bedrock-runtime converse --region us-east-1 --model-id "us.anthropic.claude-haiku-4-5-20251001-v1:0" --messages '[{"role":"user","content":[{"text":"Responde solo: hola"}]}]'
```
