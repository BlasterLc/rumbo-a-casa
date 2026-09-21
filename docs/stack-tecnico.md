# Stack técnico de Rumbo a Casa

Guía de referencia para entender cada pieza antes de tocarla. Complementa el spec (`docs/superpowers/specs/2026-09-20-rumbo-a-casa-design.md`) y el plan de fundación (`docs/superpowers/plans/2026-09-20-fundacion-aws.md`).

Las cifras de límites y precios cambian con el tiempo. Sirven para dimensionar, y antes de depender de una hay que confirmarla en la documentación oficial de AWS.

## 1. Vista general

```
Familia (navegador)
   │  https://dxxxx.cloudfront.net
   ▼
CloudFront ──── "/*"      ───► S3 (archivos de la web)
   │
   └────────── "/api/*"   ───► Lambda (Function URL)
                                  ├─► Bedrock (modelo de lenguaje)
                                  ├─► Motor de reglas (código propio)
                                  └─► DynamoDB (sesión y perfil)
```

| Pieza | Para qué sirve aquí | Por qué esta y no otra |
|---|---|---|
| React + Vite | Interfaz del chat y las tarjetas | Estándar, con mucha documentación. Vite construye rápido |
| TypeScript | Todo el código, front y back | Un solo lenguaje. El motor de reglas se comparte entre ambos |
| Vitest | Pruebas de todo | Un solo runner para front, back e infra |
| S3 | Guarda los archivos de la web | Es la forma estándar de alojar sitios estáticos en AWS |
| CloudFront | Entrega la web y reparte las peticiones | HTTPS gratis, caché global y una sola puerta de entrada |
| Lambda | Ejecuta el chat y el motor de reglas | Sin servidor que mantener, pago por uso |
| DynamoDB | Guarda sesiones y perfiles | Sin servidor, pago por uso y con TTL para borrar datos solos |
| Bedrock | Da el modelo de lenguaje | Se accede con permisos IAM, sin claves de API que guardar |
| CDK | Describe toda la infraestructura en código | Reproducible y con permisos automáticos |
| IAM / SSO | Controla quién puede hacer qué | Credenciales temporales, sin claves permanentes |
| CloudTrail | Registra cada llamada a AWS | Es la evidencia de que el agente operó la cuenta |
| Zod | Valida el perfil que extrae el modelo | Un dato inválido nunca llega al motor de reglas |

Piezas de extensión, solo si sobra tiempo: SES (email), EventBridge Scheduler (recordatorios programados), Transcribe y Polly (voz), ACM y Route 53 o Cloudflare DNS (dominio propio).

## 2. CloudFront en profundidad

### 2.1 Qué es

CloudFront es una red de servidores de AWS repartidos en cientos de ciudades, llamados **edge locations** (puntos de presencia). Cuando un usuario pide algo, la petición llega al punto más cercano. Ahí puede pasar una de dos cosas:

- **Cache hit:** el punto ya tiene una copia. La devuelve de inmediato, sin molestar a tu origen.
- **Cache miss:** no la tiene. Pide el contenido al **origen** (S3 o Lambda), lo devuelve al usuario y guarda una copia para las siguientes personas.

Entre los puntos de presencia y el origen hay una capa intermedia (*regional edge caches*), que reduce las idas al origen. No la configuras.

### 2.2 Los cuatro conceptos que configuras

**Distribución.** Es la unidad de despliegue: una URL `dxxxx.cloudfront.net` con toda su configuración. Aquí hay una sola.

**Origen (origin).** De dónde saca el contenido CloudFront. En este proyecto son dos:
- Un bucket de S3, para la web.
- Una Function URL de Lambda, para la API.

**Comportamiento (behavior).** Una regla del tipo "si la ruta coincide con este patrón, usa este origen y estas políticas". Aquí hay dos:

| Patrón | Origen | Caché | Métodos |
|---|---|---|---|
| `/api/*` | Lambda | Desactivada | Todos (GET, POST…) |
| Por defecto (`*`) | S3 | Activada | GET y HEAD |

CloudFront elige el patrón más específico que coincida y usa el comportamiento por defecto cuando ninguno lo hace. Por eso `/api/hello` va a Lambda y `/index.html` va a S3.

**Políticas.** Son piezas reutilizables que se enchufan a un comportamiento:
- **Cache policy:** qué forma la *clave de caché* (URL, y opcionalmente cabeceras, cookies o parámetros) y cuánto tiempo se guarda. Si dos peticiones tienen la misma clave, comparten copia.
- **Origin request policy:** qué datos del usuario se reenvían al origen aunque no formen parte de la clave.
- **Response headers policy:** cabeceras que CloudFront añade a la respuesta (por ejemplo, de seguridad o CORS).

### 2.3 Cómo se sirve la web, paso a paso

1. El navegador pide `https://dxxxx.cloudfront.net/`.
2. CloudFront aplica `defaultRootObject: index.html` y pide `/index.html` a S3.
3. S3 solo responde a CloudFront (ver *OAC*, más abajo). Devuelve el archivo.
4. El navegador recibe el HTML, que carga el JavaScript de React. React dibuja la interfaz.
5. El JavaScript hace `fetch('/api/hello')`. Como sale del mismo dominio, la petición vuelve a CloudFront, que aplica el comportamiento `/api/*` y la envía a Lambda.

Los pasos 1-4 son estáticos y se benefician de la caché. El paso 5 nunca se cachea, porque cada conversación es distinta.

### 2.4 Por qué un solo dominio para web y API

Como ambos viven bajo el mismo dominio, el navegador no considera que la API sea otro sitio. No hay problemas de **CORS**, ni hay que exponer la URL de la Lambda, ni configurar cabeceras extra. Es una de las razones principales para poner CloudFront delante de todo.

### 2.5 OAC: cómo S3 queda privado

El bucket bloquea todo acceso público. **Origin Access Control (OAC)** es el mecanismo por el cual CloudFront firma sus peticiones a S3, y una política del bucket permite leer solo a esa distribución. Si alguien intenta abrir la URL del bucket directamente, recibe un error. La única entrada es CloudFront.

### 2.6 Caché e invalidaciones

- Los archivos de la web pueden guardarse un buen tiempo. Vite genera nombres con un hash (`app-3f9a1c.js`), así que un archivo nuevo tiene un nombre nuevo y no choca con la copia vieja.
- El `index.html` es la excepción: su nombre no cambia. Por eso, tras cada despliegue, `BucketDeployment` pide una **invalidación** (`/*`), que le dice a CloudFront que descarte las copias. Sin eso podrías ver la versión antigua durante horas.
- Cada invalidación tarda unos minutos en propagarse. Las primeras 1.000 rutas al mes son gratuitas.

### 2.7 HTTPS y dominio

- `*.cloudfront.net` ya trae certificado. Sirve tal cual para la hackathon.
- Un dominio propio necesita un certificado de **ACM**, que para CloudFront debe crearse en `us-east-1`, y un registro DNS. Es un extra de la segunda semana.

### 2.8 Trampas conocidas

- **Header `Host` con Function URLs.** La Lambda solo responde si el `Host` es el suyo. Si CloudFront reenviara el `Host` del usuario, daría error 403. Por eso el comportamiento `/api/*` usa `ALL_VIEWER_EXCEPT_HOST_HEADER`.
- **Propagación.** Tras crear o cambiar la distribución, hay 1-2 minutos (a veces más) de inestabilidad, con 403 o pantallas viejas. No indica un error.
- **Tiempo de espera hacia el origen.** Por defecto, CloudFront espera 30 segundos la respuesta del origen. Una conversación con Bedrock que llame herramientas puede acercarse a ese límite. Es un valor configurable en el origen (`readTimeout`) y se revisa en el plan del chat.
- **Los errores se cachean brevemente.** Un 404 o 5xx puede quedarse unos segundos.

### 2.9 Costo

Hay un nivel gratuito permanente y generoso (del orden de 1 TB de salida y 10 millones de peticiones al mes). Para este proyecto no debería costar nada apreciable.

## 3. Lambda en profundidad

### 3.1 Qué es

Lambda ejecuta una función tuya cada vez que llega un **evento** (en nuestro caso, una petición HTTP). No hay un servidor encendido esperándola. AWS crea un entorno de ejecución, corre tu código, devuelve la respuesta y, si nadie más llama, lo descarta.

Lo único que tú escribes es la función:

```ts
export const handler = async (event) => {
  return { statusCode: 200, body: '{"ok":true}' };
};
```

### 3.2 Anatomía

- **Runtime:** el lenguaje y su versión (aquí, Node.js 20).
- **Handler:** la función que AWS llama, identificada por archivo y nombre de export.
- **Event:** lo que recibe. Para una Function URL trae `rawPath`, `headers`, `body`, `queryStringParameters`, etc.
- **Respuesta:** un objeto con `statusCode`, `headers` y `body`.
- **Execution role:** un rol de IAM que define qué puede hacer la función. Por defecto, solo escribir sus logs. Para leer DynamoDB o llamar a Bedrock hay que darle permiso explícito, y CDK lo hace con una línea (`grantReadWriteData`, o una política con `bedrock:InvokeModel`).
- **Variables de entorno:** configuración, como el nombre de la tabla. No es el sitio para secretos de larga vida.
- **Logs:** todo lo que imprimes con `console.log` aparece en **CloudWatch Logs**, sin configurar nada. Es tu herramienta principal de depuración.

### 3.3 Cómo se ejecuta: entornos, cold start y concurrencia

Cada **entorno de ejecución** es una micro-máquina aislada que atiende **una petición a la vez**.

- **Cold start (arranque en frío):** si no hay ningún entorno libre, AWS crea uno: descarga tu código, arranca Node y ejecuta el código fuera del `handler` (imports, clientes). Puede sumar desde unas decenas hasta unos cientos de milisegundos a esa petición.
- **Warm (caliente):** después de responder, el entorno se conserva un rato. La siguiente petición lo reutiliza y no paga el arranque.
- **Concurrencia:** si llegan 10 peticiones simultáneas, AWS levanta hasta 10 entornos en paralelo. Escala solo. Cada cuenta tiene un tope de concurrencia (las cuentas nuevas suelen partir con un valor bajo, y se revisa en Service Quotas).

Consecuencia práctica: lo que declares **fuera** del handler (por ejemplo, el cliente de Bedrock o DynamoDB) se crea una vez por entorno y se reutiliza entre peticiones. Lo que declares **dentro** se recrea cada vez.

### 3.4 Sin estado

Lambda no guarda memoria entre peticiones de forma fiable, porque dos peticiones consecutivas pueden caer en entornos distintos. Por eso la sesión de la familia vive en DynamoDB y no en una variable. `/tmp` existe, pero es efímero.

### 3.5 Límites que importan

| Límite | Valor aproximado | Efecto en el proyecto |
|---|---|---|
| Tiempo máximo por ejecución | Hasta 15 min (lo configuras) | El plan de fundación usa 10 s. El chat necesitará más |
| Memoria | 128 MB a 10 GB, y la CPU crece con ella | Más memoria hace más rápido el código |
| Tamaño de petición y respuesta | ~6 MB en modo normal | De sobra para conversaciones de texto |
| Streaming de respuesta | Disponible (modo `RESPONSE_STREAM`) | Permite mostrar el texto del modelo mientras se genera |
| Concurrencia | Tope por cuenta y región | Suficiente. Revisar en cuenta nueva |

### 3.6 Costo

Se paga por número de peticiones y por **GB-segundo** (memoria × tiempo de ejecución). Hay un nivel gratuito permanente de alrededor de 1 millón de peticiones y 400.000 GB-segundo al mes. El costo real del proyecto estará dominado por Bedrock, no por Lambda.

### 3.7 Function URL

Es una dirección HTTPS asociada a una función (`https://xxxx.lambda-url.us-east-1.on.aws/`). Es la forma más simple de exponerla, sin API Gateway. Va con `authType: NONE` en la fundación, así que cualquiera que conozca esa URL puede llamarla sin pasar por CloudFront. El plan del chat lo cierra con un secreto compartido y un tope de uso.

### 3.8 Cómo se ve una petición de chat

1. `POST /api/chat` llega a CloudFront, que la reenvía a Lambda.
2. Si hay un entorno libre, lo usa (warm). Si no, arranca uno (cold).
3. El handler carga la sesión de DynamoDB, llama a Bedrock, ejecuta las herramientas que el modelo pida (motor de reglas), guarda el estado y responde.
4. CloudFront entrega la respuesta al navegador.

El tiempo total lo domina la llamada a Bedrock (segundos), no el arranque de Lambda (milisegundos).

## 4. Lambda frente a Cloudflare Workers

**Respuesta corta:** sirven para lo mismo (ejecutar una función por petición, sin servidor que administrar y con pago por uso), pero funcionan distinto por dentro. Lo que más cambia es *dónde* corren y *cómo* aíslan el código.

| | Cloudflare Workers | AWS Lambda |
|---|---|---|
| Dónde corre | En la red de Cloudflare, en la ciudad más cercana al usuario | En la región que eliges (`us-east-1`) |
| Aislamiento | *V8 isolates*: muchos scripts comparten un proceso, con arranque de milisegundos | Micro-máquinas por entorno de ejecución |
| Arranque en frío | Prácticamente inexistente | Perceptible: decenas a cientos de ms en Node |
| Lenguajes | JavaScript, TypeScript y WebAssembly (Python en beta) | Node, Python, Java, .NET, Go, Ruby o contenedores |
| Librerías | APIs web estándar (`fetch`, `Request`, `Response`) y compatibilidad parcial con Node | Node completo y cualquier paquete de npm, incluidos los nativos |
| Límite de ejecución | Basado en tiempo de CPU, con margen menor | Hasta 15 minutos de reloj |
| Memoria | ~128 MB por isolate | Hasta 10 GB |
| Datos cercanos | KV, D1, R2, Durable Objects | DynamoDB, S3, RDS, dentro de la región |
| Permisos a otros servicios | Tokens y bindings | IAM: sin claves, con roles |

**Qué significa para Rumbo a Casa**
- Workers destaca cuando importa la latencia mínima en cualquier parte del mundo. Aquí la latencia no es el cuello de botella: la llamada al modelo tarda segundos y eso eclipsa los ~150-200 ms extra de ir hasta `us-east-1` desde Chile.
- Lambda destaca cuando el código necesita hablar con otros servicios de AWS. Bedrock, DynamoDB y S3 se usan con permisos IAM, sin guardar ninguna clave de API. Además, las reglas de la hackathon piden que todo esté en AWS.
- Por eso Lambda es la elección natural aquí. No es "mejor", es la que encaja con el resto del stack.

**El equivalente AWS de los Workers.** Si lo que buscas es código que corra en el borde de la red, AWS tiene dos opciones, y ninguna reemplaza a los Workers por completo:
- **CloudFront Functions:** JavaScript muy liviano (del orden de 1 ms) que corre en cada punto de presencia. Sirve para reescribir URLs o cabeceras, pero no tiene acceso a red ni librerías.
- **Lambda@Edge:** Lambda ejecutada desde CloudFront, con más capacidad pero más lenta y con límites más estrictos.

No usaremos ninguna de las dos.

## 5. Otras piezas

### 5.1 S3
Almacenamiento de objetos. Un **bucket** es la carpeta raíz y cada archivo es un **objeto** con una clave (su ruta). Se cobra por almacenamiento y peticiones, y para una web pequeña es prácticamente cero.

### 5.2 DynamoDB
Base de datos clave-valor sin servidor. Cada elemento se identifica por una **clave de partición** (aquí, el `sessionId`). Se usará en modo **bajo demanda**, donde se paga por lectura y escritura sin reservar capacidad. Tiene **TTL**: se marca un campo con una fecha y DynamoDB borra el elemento solo. Lo usaremos para eliminar sesiones a los 30 días, lo que además ayuda con la privacidad.

### 5.3 Bedrock
Servicio para invocar modelos de lenguaje con una API y permisos IAM. Lo usaremos con la **Converse API**, una interfaz común para todos los modelos, con soporte de **tool use**: el modelo puede pedir que se ejecute una herramienta (por ejemplo, `evaluar_elegibilidad`) y recibe el resultado para seguir la conversación. Algunos modelos se invocan mediante **inference profiles**, que enrutan la petición entre regiones. El ID que hay que usar sale de `aws bedrock list-inference-profiles`.

### 5.4 IAM
Todo permiso en AWS se expresa como **política**: "esta identidad puede hacer estas acciones sobre estos recursos". Una **identidad** puede ser un usuario, un rol o una función Lambda. El principio de **mínimo privilegio** manda que cada una tenga solo lo que necesita.

### 5.5 CDK, CloudFormation y stacks
- Un **stack** agrupa recursos que se crean y se borran juntos.
- `cdk synth` genera la plantilla de CloudFormation sin desplegar nada.
- `cdk diff` muestra qué cambiaría.
- `cdk deploy` aplica los cambios, y `cdk destroy` borra el stack completo.
- Los **constructs** son bloques de CDK. Los de nivel alto (como `NodejsFunction`) resuelven por ti detalles como el empaquetado con esbuild.

### 5.6 Motor de reglas
No es un servicio de AWS: es un módulo TypeScript puro, sin dependencias de la nube. Recibe un perfil y devuelve, por programa, `elegible`, `no elegible` o `falta dato`, con la regla citada. Es el corazón del proyecto y el que más pruebas necesita, porque una decisión equivocada afecta a una familia real.

## 6. Cómo leer los errores más comunes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `AccessDenied` o `not authorized` | Falta un permiso IAM | Ver a qué acción y recurso se refiere el mensaje y añadir el permiso |
| `ExpiredToken` o sesión caducada | Las credenciales SSO expiraron | `aws sso login --profile rumbo` |
| 403 o página vieja justo tras desplegar | Propagación de CloudFront o invalidación pendiente | Esperar 1-2 minutos y refrescar |
| 403 solo en `/api/*` | El `Host` del usuario llega a la Lambda | Revisar la origin request policy |
| Bucket, Lambda o tabla "no existe" | Región equivocada | Confirmar `us-east-1` en la consola y en la CLI |
| `AccessDeniedException` al invocar Bedrock | No se ha habilitado el acceso al modelo | Solicitar acceso en el catálogo de Bedrock |
| Timeout de Lambda o error 504 | La ejecución supera el límite de la función o de CloudFront | Subir el `timeout` y el `readTimeout` |

## 7. Cómo depurar

- **Logs de Lambda:** consola → CloudWatch → *Log groups* → `/aws/lambda/<nombre de la función>`.
- **Qué se desplegó:** consola → CloudFormation → el stack `RumboACasa` → pestañas *Resources* y *Events*.
- **Quién hizo qué:** consola → CloudTrail → *Event history*.
- **Costos:** consola → Billing and Cost Management → *Budgets* y *Cost Explorer*.

## 8. Costos esperados

| Servicio | Esperado |
|---|---|
| S3, CloudFront, Lambda, DynamoDB | Dentro del nivel gratuito o centavos |
| Bedrock | El único gasto relevante. Depende del modelo y del número de conversaciones |
| CloudTrail (historial de eventos) | Gratis |

Por eso el presupuesto con alarma y el tope de mensajes por sesión son obligatorios antes de publicar la URL.
