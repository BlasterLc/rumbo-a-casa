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
- **Pendiente:** capturas de pantalla de la sesión de Claude Code ejecutando `cdk deploy` y de la consola de CloudFormation mostrando el stack `RumboACasa`. Como el deploy lo corrió Augusto, le corresponde a él tomarlas.

## Bedrock

- Modelo elegido: `us.anthropic.claude-haiku-4-5-20251001-v1:0` (económico, buen soporte de *tool use*, lo usará `chat-handler`).
- **Bloqueado temporalmente:** al invocar (`aws bedrock-runtime converse`) la cuenta devuelve `AccessDeniedException`: *"Your account is currently being verified. Verification normally takes less than 2 hours."* Es una verificación estándar de AWS para cuentas nuevas, no un problema de permisos ni de acceso al modelo — no hace falta pedir acceso en el Model catalog, solo esperar. Reintentar en un par de horas con:

```
AWS_PROFILE=rumbo aws bedrock-runtime converse --region us-east-1 --model-id "us.anthropic.claude-haiku-4-5-20251001-v1:0" --messages '[{"role":"user","content":[{"text":"Responde solo: hola"}]}]'
```
