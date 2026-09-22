# Rumbo a Casa: diseño técnico

Fecha: 2026-09-20. Hackathon AWS Zero to Shipped, cierre 2026-10-02 23:59 PT.
Nombre provisorio. Categoría Social Good, track Community.

## Objetivo

Agente conversacional que orienta a familias chilenas sobre subsidios habitacionales (DS49, DS19, DS1 y arriendo DS52). Entrevista a la familia, decide elegibilidad por programa, entrega un plan de papeles y fechas de llamados en formato `.ics`.

Usuario principal: la familia. La vista para asistentes sociales queda fuera del alcance.

## Reglas de diseño

- La elegibilidad la decide un motor determinista con la regla citada. El LLM solo conversa y explica.
- Nunca se pide Clave Única. Sin login ni CAPTCHA.
- El estado de postulación lo marca el usuario.
- Cuando falta un dato, el motor devuelve `falta dato` con la lista de pendientes. Nunca adivina.
- Interfaz en español con opción en inglés. Sin logos de MINVU ni Serviu.
- Repositorio nuevo, sin código copiado de proyectos previos.
- **Es una web app, no una app móvil nativa.** SPA React responsive, mobile-first (la mayoría de las familias van a entrar desde el navegador del teléfono), pero sin empaquetado para App Store/Play Store — eso no entra en el presupuesto de ~20 h. Decidido 2026-09-21.

## Stack

- TypeScript en todo: SPA React con Vite, Lambdas en Node, infraestructura con AWS CDK.
- Todo el alojamiento vive en AWS. Cloudflare solo sirve como DNS opcional (CNAME sin proxy hacia CloudFront) si hay dominio propio.
- Región: `us-east-1`, por disponibilidad de modelos en Bedrock.

## Arquitectura

```
Familia (navegador)
   │
CloudFront ── /*      → S3 (SPA React)
   │       └─ /api/*  → Lambda Function URL (TypeScript)
                            ├─ Bedrock Converse (LLM + tool use)
                            ├─ Motor de reglas (módulo TS puro)
                            └─ DynamoDB (sesión y perfil)
```

Extensión, solo si sobra tiempo: EventBridge Scheduler → Lambda `reminders` → SES (email).

### Unidades

| Unidad | Propósito | Depende de |
|---|---|---|
| `rules-engine` | TypeScript puro. Perfil → por programa `elegible`, `no elegible` o `falta dato`, con regla citada (decreto, artículo, fecha de la fuente) | nada de AWS |
| `chat-handler` | Lambda que conduce la conversación con Bedrock Converse y tres herramientas | `rules-engine`, Bedrock, DynamoDB |
| `web` | SPA: chat, tarjetas de resultado por programa, plan de papeles, descarga `.ics` | API `/api/*` |
| `infra` | Stack CDK: S3, CloudFront, Lambda, DynamoDB, Budgets | — |
| `reminders` | Extensión: recordatorios por email vía SES | DynamoDB, SES |

## Flujo de conversación

1. La SPA envía `POST /api/chat` con `{sessionId, mensaje}`.
2. La Lambda carga perfil e historial desde DynamoDB.
3. Llama a Bedrock Converse con prompt de sistema, historial y herramientas: `actualizar_perfil`, `evaluar_elegibilidad`, `generar_plan`.
4. Si el modelo pide una herramienta, la Lambda la ejecuta (las dos últimas invocan al motor) y devuelve el resultado al modelo. Se repite hasta que responde con texto.
5. Se guarda el estado. La respuesta incluye texto y datos estructurados (perfil, resultados por programa, plan) para que la SPA muestre tarjetas.

## Datos

Perfil validado con Zod: grupo familiar (integrantes, edades, discapacidad), tramo del Registro Social de Hogares, ingresos, ahorro y cuenta de ahorro, región y comuna, propiedad existente, objetivo (comprar, construir o arrendar). Cada campo admite `desconocido`.

Tabla `Sesiones`: perfil, historial y contador de mensajes, con TTL de 30 días. Las reglas viven en el código, en archivos versionados con su fuente, no en la base.

## Recordatorios

- Base: la Lambda genera un archivo `.ics` con las fechas de los llamados y la SPA lo descarga. No depende de SES.
- Opcional: email por SES. Una cuenta nueva parte en *sandbox* y solo envía a direcciones verificadas. En modo demo va a una dirección verificada. Solo se activa si la salida del sandbox llega a tiempo.

## Manejo de errores y límites

- Si Zod rechaza un valor del modelo, se descarta y se pide reformular.
- Si Bedrock falla o se alcanza el límite de uso, la SPA muestra un mensaje claro y ofrece el modo demo.
- Tope de mensajes por sesión y alarma en AWS Budgets.
- Modo demo con familia ficticia, para que los evaluadores no ingresen datos reales.

## Pruebas

- `rules-engine`: tablas de casos por programa, con bordes (ingreso en el límite, cambio de tramo del RSH).
- `chat-handler`: test de integración con Bedrock simulado.
- Manual: flujo completo en la URL desplegada.

## Puesta en marcha de la cuenta (día 1)

1. Usuario IAM o IAM Identity Center con permisos acotados para el agente. No se usa el usuario raíz.
2. AWS Budgets con alarma.
3. Región `us-east-1`.
4. Acceso al modelo en Bedrock (paso de consola, puede tardar).
5. `cdk bootstrap`.

## Evidencia del agente conectado a AWS

Claude Code opera con credenciales de AWS y cada llamada queda en CloudTrail. Se guarda desde el día 1 la configuración usada, capturas de la sesión y eventos de CloudTrail. Pendiente confirmar en la página oficial qué cuenta como "coding agent conectado a la consola" y si Social Good tiene criterios propios.

## Cronograma (~20 h)

- **Días 1-3 (hasta el 23 de septiembre):** cuenta, CDK, esqueleto SPA + Lambda y URL pública viva. Es el requisito eliminatorio.
- **Semana 1:** motor de reglas con los 4 programas y sus citas, chat con herramientas, tarjetas de resultado.
- **Semana 2:** `.ics`, modo demo, límites de uso, pulido visual (paleta pendiente) y artículo en inglés para Builder Center (~2 h).
- **Extras:** email SES, voz (Transcribe y Polly), dominio propio.

## Riesgos

- Investigar y codificar las reglas de los cuatro decretos consume más tiempo y define la calidad. Se codifican con su fuente oficial y se entrega una lista de verificación antes de publicar.
- El acceso a Bedrock puede demorar, por eso va el día 1.
- URL viva hasta después de la semana del 12 de octubre. Enviar también la URL `*.cloudfront.net` a Builder Center.

## Pendientes fuera de este diseño

- Paleta de colores (el usuario no está conforme con la actual).
- Revisar proyectos de otros participantes cuando lleguen los links.
