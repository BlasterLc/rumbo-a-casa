# Fundación AWS: URL pública viva — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Modo de ejecución de este plan: guiado.** El usuario nunca ha desplegado en AWS. Antes de cada tarea se explica el concepto en 3-5 líneas (bloque "Concepto"), se ejecuta junto con el usuario y se pausa al terminar la tarea para resolver dudas. Los pasos marcados **[USUARIO]** los hace el usuario en la consola AWS o en su terminal (con `! comando`).

**Goal:** Tener una URL pública `*.cloudfront.net`, servida desde AWS, que muestre una página React y responda `GET /api/hello` desde una Lambda, todo definido con CDK.

**Architecture:** CloudFront sirve la SPA desde S3 (ruta `/*`) y reenvía `/api/*` a una Lambda con Function URL. La infraestructura es un solo stack CDK en TypeScript, en `us-east-1`. Es el esqueleto sobre el que después se montan el motor de reglas y el chat.

**Tech Stack:** Node 20+, TypeScript, npm workspaces, Vitest, AWS CDK v2 (`aws-cdk-lib`), AWS CLI v2, React + Vite, IAM Identity Center (SSO).

**Spec:** `docs/superpowers/specs/2026-09-20-rumbo-a-casa-design.md`

## Global Constraints

- Todo el alojamiento vive en AWS. Cloudflare no hospeda nada.
- Región: `us-east-1`.
- TypeScript en todo, un solo runner de pruebas (Vitest).
- Repositorio nuevo, sin código copiado de proyectos previos.
- Sin login ni CAPTCHA. Nunca pedir Clave Única.
- No usar el usuario raíz de AWS para trabajar. Solo para crear la cuenta y activar MFA.
- Mensajes de commit sin atribución a Claude (sin `Co-Authored-By`, sin "Generated with Claude Code").
- Al escribir en español, sin voseo.

## Desviaciones conocidas respecto al spec

- **Permisos:** el spec pedía permisos acotados. Para `cdk bootstrap` y los primeros despliegues se usa el permission set `AdministratorAccess` en esta cuenta dedicada, con alarma de presupuesto. Se acota después, cuando el conjunto de servicios esté estable.
- **AWS Budgets:** el spec lo lista en `infra`. Aquí se crea a mano en la consola (Task 1) porque es un buen primer contacto con la consola. Pasarlo a CDK es opcional.
- **Function URL pública:** la Lambda queda con `AuthType NONE`, así que también se puede llamar directo sin pasar por CloudFront. Es aceptable para el "hola mundo". El plan del chat debe añadir un secreto compartido desde CloudFront y el tope de uso, antes de exponer Bedrock.

## Estructura de archivos

```
hackathonAWS/
├── package.json                 # workspaces + scripts raíz
├── tsconfig.base.json           # opciones TS compartidas
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/handler.ts           # Lambda: enruta GET /api/hello
│   └── test/handler.test.ts
├── web/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/main.tsx, src/App.tsx
├── infra/
│   ├── package.json
│   ├── tsconfig.json
│   ├── cdk.json
│   ├── bin/app.ts               # punto de entrada CDK
│   ├── lib/rumbo-stack.ts       # S3 + CloudFront + Lambda
│   └── test/rumbo-stack.test.ts
│       └── fixtures/web-dist/index.html
└── docs/evidence/               # evidencia de conexión del agente a AWS
```

---

### Task 1: Cuenta AWS segura y presupuesto [USUARIO, guiado]

**Concepto:** una cuenta AWS tiene un *usuario raíz* (el correo con el que se registró) con poder total. Se protege con MFA y no se usa para el trabajo diario. Para trabajar se usa **IAM Identity Center**, que entrega credenciales temporales por SSO: si se filtran, caducan solas. **AWS Budgets** envía un correo cuando el gasto pasa un umbral, y es la red de seguridad contra sorpresas.

**Files:** ninguno (consola AWS).

**Interfaces:**
- Produces: un perfil SSO llamado `rumbo` que Task 2 configura en la CLI, y el ID de cuenta de 12 dígitos.

- [ ] **Step 1: Crear la cuenta [USUARIO]**

Registrarse en https://aws.amazon.com y completar el alta. Si el usuario recibe créditos de la hackathon, anotar cuánto y hasta cuándo vencen.

- [ ] **Step 2: Activar MFA en el usuario raíz [USUARIO]**

Consola → esquina superior derecha, nombre de la cuenta → *Security credentials* → *Multi-factor authentication (MFA)* → asignar una app autenticadora.

Esperado: el usuario raíz muestra un dispositivo MFA asignado.

- [ ] **Step 3: Crear una alarma de presupuesto [USUARIO]**

Consola → *Billing and Cost Management* → *Budgets* → *Create budget* → plantilla *Monthly cost budget*, monto 10 USD, correo del usuario.

Esperado: el presupuesto aparece en la lista con estado "OK".

- [ ] **Step 4: Elegir la región [USUARIO]**

Selector de región (arriba a la derecha) → **US East (N. Virginia) us-east-1**. Se usa siempre esta región.

- [ ] **Step 5: Habilitar IAM Identity Center [USUARIO]**

Consola → buscar *IAM Identity Center* → *Enable* (elegir crear una instancia de organización si lo pregunta). Luego:
1. *Users* → *Add user*, **una vez por integrante del equipo** (dos personas): nombre, correo. Cada uno acepta su invitación por correo y fija su propia contraseña + MFA. Nadie comparte credenciales.
2. *Permission sets* → *Create permission set* → predefinido `AdministratorAccess`.
3. *AWS accounts* → seleccionar la cuenta → *Assign users or groups* → **ambos usuarios** + el permission set.
4. En el panel de Identity Center, copiar la **AWS access portal URL** (algo como `https://d-xxxxxxxxxx.awsapps.com/start`).

Esperado: al abrir la access portal URL e iniciar sesión, aparece la cuenta con el rol `AdministratorAccess`. Cada integrante debe comprobarlo con su propio usuario.

- [ ] **Step 6: Acordar reglas de trabajo en equipo [USUARIO]**

- La cuenta la crea y administra **una** persona (dueña del usuario raíz y del presupuesto). Nadie más usa el usuario raíz.
- Solo una persona ejecuta `cdk deploy` a la vez: avisarse por chat antes de desplegar, porque dos despliegues simultáneos sobre el mismo stack se rechazan.
- Antes de desplegar, cada quien hace `git pull` para tener el mismo código.

- [ ] **Step 7: Pausa de revisión**

Confirmar con ambos que entienden: usuario raíz vs. usuario SSO, qué es una región, qué hace el presupuesto. Anotar el ID de cuenta y la access portal URL para Task 2. Cada integrante repite Task 2 en su propia máquina.

---

### Task 2: Herramientas locales y login por SSO

**Concepto:** la **AWS CLI** es el programa que habla con AWS desde la terminal. Un *perfil* guarda a qué cuenta y rol conectarse. Con SSO, `aws sso login` abre el navegador, apruebas el acceso y la CLI obtiene credenciales temporales (duran unas horas). CDK usa esas mismas credenciales.

**Files:**
- Modify: `~/.aws/config` (lo escribe `aws configure sso`)

**Interfaces:**
- Consumes: ID de cuenta y access portal URL de Task 1.
- Produces: perfil `rumbo` funcional. Todos los comandos AWS posteriores usan `AWS_PROFILE=rumbo`.

- [ ] **Step 1: Verificar versiones instaladas**

Run: `node --version && npm --version && aws --version`
Expected: Node 20 o superior, npm 10 o superior, `aws-cli/2.x`. Si falta algo, instalarlo antes de seguir (AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

- [ ] **Step 2: Configurar el perfil SSO [USUARIO]**

Run: `! aws configure sso`
Responder: nombre de sesión `rumbo`, start URL = la access portal URL, región SSO `us-east-1`, scopes por defecto, elegir la cuenta y el rol `AdministratorAccess`, región por defecto `us-east-1`, formato `json`, nombre de perfil `rumbo`.

- [ ] **Step 3: Iniciar sesión y comprobar la identidad**

Run: `! aws sso login --profile rumbo`
Run: `AWS_PROFILE=rumbo aws sts get-caller-identity`
Expected: JSON con `Account` = el ID de cuenta y un `Arn` que contiene `AWSReservedSSO_AdministratorAccess`.

- [ ] **Step 4: Pausa de revisión**

Explicar qué devolvió `get-caller-identity` y por qué es la primera llamada que conviene hacer siempre ("¿quién soy para AWS?").

---

### Task 3: Repositorio y esqueleto de workspaces

**Concepto:** un *monorepo* con **npm workspaces** guarda `backend`, `web` e `infra` en un solo repositorio con una sola instalación de dependencias. Permite compartir código (por ejemplo, el motor de reglas) entre front y back más adelante.

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.gitignore`

**Interfaces:**
- Produces: scripts raíz `npm test` (corre las pruebas de todos los workspaces) y `npm run deploy` (construye la web y despliega).

- [ ] **Step 1: Inicializar git**

Run: `git init -b main`
Expected: `Initialized empty Git repository`.

- [ ] **Step 2: Crear `.gitignore`**

```
node_modules/
dist/
cdk.out/
.env
.DS_Store
```

- [ ] **Step 3: Crear `package.json` raíz**

```json
{
  "name": "rumbo-a-casa",
  "private": true,
  "workspaces": ["backend", "infra", "web"],
  "scripts": {
    "test": "npm test --workspaces --if-present",
    "build:web": "npm run build -w web",
    "deploy": "npm run build:web && npm run deploy -w infra"
  }
}
```

- [ ] **Step 4: Crear `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore package.json tsconfig.base.json docs
git commit -m "chore: esqueleto del monorepo y documentos de diseño"
```

- [ ] **Step 6: Crear el repositorio compartido en GitHub [USUARIO]**

Crear un repositorio nuevo y **privado** en GitHub (sin README ni `.gitignore`), invitar al compañero como colaborador y conectarlo:

```bash
git remote add origin git@github.com:<usuario>/<repositorio>.git
git push -u origin main
```

Esperado: el compañero puede clonarlo con `git clone` y ejecutar `npm install`. El repositorio queda privado hasta decidir si se hace público para la hackathon. Nunca se suben credenciales: `.env` ya está en `.gitignore` y AWS usa SSO, así que no hay claves que guardar.

---

### Task 4: Lambda `hello` (TDD)

**Concepto:** una **Lambda** es una función que AWS ejecuta solo cuando llega una petición; no hay servidor que mantener y se paga por uso. Una **Function URL** le da a esa función una dirección HTTPS propia. El evento que recibe trae la ruta en `rawPath`.

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/src/handler.ts`
- Test: `backend/test/handler.test.ts`

**Interfaces:**
- Produces: `handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2>` exportado desde `backend/src/handler.ts`. Task 6 lo referencia como `entry` de la Lambda.
- Contrato HTTP: `GET /api/hello` → 200 `{"message":"Hola desde Lambda","region":"<AWS_REGION o local>"}`. Cualquier otra ruta → 404 `{"error":"not_found"}`.

- [ ] **Step 1: Crear `backend/package.json`**

```json
{
  "name": "@rumbo/backend",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run" },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.145",
    "@types/node": "^20.14.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Crear `backend/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Instalar dependencias**

Run: `npm install`
Expected: termina sin errores y crea `node_modules/` y `package-lock.json` en la raíz.

- [ ] **Step 4: Escribir la prueba que falla**

`backend/test/handler.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/handler';

const evento = (rawPath: string) => ({ rawPath }) as APIGatewayProxyEventV2;

describe('handler', () => {
  it('responde 200 con un mensaje en GET /api/hello', async () => {
    const res = await handler(evento('/api/hello'));
    expect(res.statusCode).toBe(200);
    const cuerpo = JSON.parse(res.body as string);
    expect(cuerpo.message).toBe('Hola desde Lambda');
    expect(cuerpo.region).toBe('local');
  });

  it('responde 404 en una ruta desconocida', async () => {
    const res = await handler(evento('/api/otra-cosa'));
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'not_found' });
  });
});
```

- [ ] **Step 5: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../src/handler`.

- [ ] **Step 6: Implementar el mínimo**

`backend/src/handler.ts`:

```ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

const json = (
  statusCode: number,
  body: unknown,
): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.rawPath === '/api/hello') {
    return json(200, {
      message: 'Hola desde Lambda',
      region: process.env.AWS_REGION ?? 'local',
    });
  }
  return json(404, { error: 'not_found' });
};
```

- [ ] **Step 7: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 2 pruebas PASS.

- [ ] **Step 8: Commit**

```bash
git add backend package.json package-lock.json
git commit -m "feat: Lambda hello con pruebas"
```

---

### Task 5: SPA React mínima

**Concepto:** la **SPA** (single page application) es HTML, CSS y JavaScript estáticos. No necesitan servidor: se suben a **S3** (almacenamiento de archivos) y **CloudFront** (la red de distribución de AWS) los entrega por HTTPS desde el punto más cercano al usuario. `vite build` genera esos archivos en `web/dist/`.

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/vite.config.ts`, `web/index.html`, `web/src/main.tsx`, `web/src/App.tsx`

**Interfaces:**
- Consumes: `GET /api/hello` de Task 4 (respuesta `{message, region}`).
- Produces: `web/dist/` con `index.html`. Task 6 lo empaqueta y lo sube a S3.

- [ ] **Step 1: Crear `web/package.json`**

```json
{
  "name": "@rumbo/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Crear `web/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "lib": ["ES2022", "DOM"], "noEmit": true },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: Crear `web/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });
```

- [ ] **Step 4: Crear `web/index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rumbo a Casa</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Crear `web/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Crear `web/src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';

type Estado = { message: string; region: string } | 'cargando' | 'error';

export function App() {
  const [estado, setEstado] = useState<Estado>('cargando');

  useEffect(() => {
    fetch('/api/hello')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setEstado)
      .catch(() => setEstado('error'));
  }, []);

  return (
    <main>
      <h1>Rumbo a Casa</h1>
      {estado === 'cargando' && <p>Conectando con el servidor…</p>}
      {estado === 'error' && <p>No se pudo conectar con el servidor.</p>}
      {typeof estado === 'object' && (
        <p>
          {estado.message} (región: {estado.region})
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 7: Instalar y construir**

Run: `npm install && npm run build -w web`
Expected: termina sin errores de tipos y crea `web/dist/index.html`.

- [ ] **Step 8: Commit**

```bash
git add web package.json package-lock.json
git commit -m "feat: SPA React mínima que llama a /api/hello"
```

---

### Task 6: Stack CDK (TDD con aserciones)

**Concepto:** **CDK** convierte este código TypeScript en una plantilla de **CloudFormation**, el servicio de AWS que crea y actualiza recursos a partir de una plantilla. Un **stack** es el conjunto de recursos que se crean y se borran juntos. Las pruebas de CDK no despliegan nada: sintetizan la plantilla y verifican que contiene lo esperado, y eso las hace rápidas y gratuitas.

Recursos que crea este stack:
- **Bucket S3 privado** con la web. Solo CloudFront puede leerlo (*Origin Access Control*).
- **Lambda** `hello` con **Function URL**.
- **Distribución CloudFront**: `/*` va a S3 y `/api/*` va a la Lambda, sin caché en la API.
- **Despliegue de la web**: sube `web/dist` al bucket y limpia la caché de CloudFront.

**Files:**
- Create: `infra/package.json`, `infra/tsconfig.json`, `infra/cdk.json`, `infra/bin/app.ts`, `infra/lib/rumbo-stack.ts`
- Test: `infra/test/rumbo-stack.test.ts`, `infra/test/fixtures/web-dist/index.html`

**Interfaces:**
- Consumes: `backend/src/handler.ts` (export `handler`, Task 4) y `web/dist/` (Task 5).
- Produces: `class RumboStack extends cdk.Stack` con constructor `(scope: Construct, id: string, props: RumboStackProps)`, donde `RumboStackProps extends cdk.StackProps { webDistPath: string; backendEntry: string }`. Emite el output `SiteUrl` (`https://<dominio>.cloudfront.net`).

- [ ] **Step 1: Crear `infra/package.json`**

```json
{
  "name": "@rumbo/infra",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "synth": "cdk synth",
    "deploy": "cdk deploy"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.170.0",
    "constructs": "^10.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "aws-cdk": "^2.170.0",
    "esbuild": "^0.24.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Crear `infra/tsconfig.json` y `infra/cdk.json`**

`infra/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "include": ["bin", "lib", "test"]
}
```

`infra/cdk.json`:

```json
{
  "app": "npx tsx bin/app.ts"
}
```

- [ ] **Step 3: Instalar dependencias**

Run: `npm install`
Expected: sin errores. Si `S3BucketOrigin` no existe más adelante, confirmar con `npm ls aws-cdk-lib` que la versión es 2.156 o superior.

- [ ] **Step 4: Crear el fixture de la web para las pruebas**

`infra/test/fixtures/web-dist/index.html`:

```html
<!doctype html><html><body>fixture</body></html>
```

- [ ] **Step 5: Escribir las pruebas que fallan**

`infra/test/rumbo-stack.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { RumboStack } from '../lib/rumbo-stack';

const sintetizar = () => {
  const app = new App();
  const stack = new RumboStack(app, 'RumboTest', {
    env: { account: '123456789012', region: 'us-east-1' },
    webDistPath: join(__dirname, 'fixtures/web-dist'),
    backendEntry: join(__dirname, '../../backend/src/handler.ts'),
  });
  return Template.fromStack(stack);
};

describe('RumboStack', () => {
  it('crea una sola distribución CloudFront con comportamiento /api/*', () => {
    const t = sintetizar();
    t.resourceCountIs('AWS::CloudFront::Distribution', 1);
    t.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({ PathPattern: '/api/*' }),
        ]),
      }),
    });
  });

  it('expone la Lambda con una Function URL', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::Lambda::Url', { AuthType: 'NONE' });
  });

  it('mantiene el bucket de la web privado', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('emite la URL del sitio como output', () => {
    const t = sintetizar();
    t.hasOutput('SiteUrl', {});
  });
});
```

- [ ] **Step 6: Ejecutar y ver que falla**

Run: `npm test -w infra`
Expected: FAIL, no se puede resolver `../lib/rumbo-stack`.

- [ ] **Step 7: Implementar el stack**

`infra/lib/rumbo-stack.ts`:

```ts
import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface RumboStackProps extends cdk.StackProps {
  /** Carpeta con la web ya construida (web/dist). */
  webDistPath: string;
  /** Archivo TypeScript que exporta `handler`. */
  backendEntry: string;
}

export class RumboStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RumboStackProps) {
    super(scope, id, props);

    const webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const apiFn = new NodejsFunction(this, 'ApiFn', {
      entry: props.backendEntry,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
    });
    const apiUrl = apiFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const distribution = new cloudfront.Distribution(this, 'Cdn', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.FunctionUrlOrigin(apiUrl),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    });

    new s3deploy.BucketDeployment(this, 'DeployWeb', {
      sources: [s3deploy.Source.asset(props.webDistPath)],
      destinationBucket: webBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'SiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
```

- [ ] **Step 8: Ejecutar y ver que pasa**

Run: `npm test -w infra`
Expected: 4 pruebas PASS. La primera vez tarda unos segundos porque esbuild empaqueta la Lambda.

- [ ] **Step 9: Crear el punto de entrada `infra/bin/app.ts`**

```ts
import { join } from 'node:path';
import { App } from 'aws-cdk-lib';
import { RumboStack } from '../lib/rumbo-stack';

const app = new App();

new RumboStack(app, 'RumboACasa', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  webDistPath: join(__dirname, '../../web/dist'),
  backendEntry: join(__dirname, '../../backend/src/handler.ts'),
});
```

- [ ] **Step 10: Sintetizar de verdad**

Run: `AWS_PROFILE=rumbo npm run synth -w infra`
Expected: imprime una plantilla YAML de CloudFormation sin errores. Recorrerla con el usuario y señalar el bucket, la Lambda y la distribución.

- [ ] **Step 11: Commit**

```bash
git add infra package.json package-lock.json
git commit -m "feat: stack CDK con S3, CloudFront y Lambda"
```

---

### Task 7: Bootstrap y primer despliegue [USUARIO + agente]

**Concepto:** `cdk bootstrap` se ejecuta **una sola vez por cuenta y región**. Crea un bucket y unos roles que CDK usa para subir archivos y aplicar plantillas. `cdk deploy` construye la plantilla, muestra los cambios de permisos IAM y pide confirmación antes de crear nada. Ese aviso es una función de seguridad, no un error.

**Files:** ninguno.

**Interfaces:**
- Consumes: perfil `rumbo` (Task 2), `web/dist/` (Task 5), stack (Task 6).
- Produces: output `SiteUrl` y un stack `RumboACasa` en CloudFormation.

- [ ] **Step 1: Renovar la sesión si caducó [USUARIO]**

Run: `! aws sso login --profile rumbo`

- [ ] **Step 2: Bootstrap**

Run: `AWS_PROFILE=rumbo npx -w infra cdk bootstrap aws://<ID_DE_CUENTA>/us-east-1`
Expected: termina con `✅ Environment aws://.../us-east-1 bootstrapped`. Mostrar al usuario el stack `CDKToolkit` en la consola de CloudFormation.

- [ ] **Step 3: Construir la web y desplegar [USUARIO confirma]**

Run: `AWS_PROFILE=rumbo npm run deploy`
Expected: muestra una tabla de cambios de IAM. Leerla con el usuario y responder `y`. Tras unos minutos termina con `Outputs: RumboACasa.SiteUrl = https://dxxxx.cloudfront.net`.

- [ ] **Step 4: Verificar la URL pública**

Run: `curl -s -o /dev/null -w "%{http_code}\n" <SiteUrl>`
Expected: `200`.

Run: `curl -s <SiteUrl>/api/hello`
Expected: `{"message":"Hola desde Lambda","region":"us-east-1"}`.

Abrir `<SiteUrl>` en el navegador. Esperado: "Rumbo a Casa" y "Hola desde Lambda (región: us-east-1)". Si aparece un 403 justo después del despliegue, esperar 1-2 minutos a que CloudFront propague y reintentar.

- [ ] **Step 5: Anotar la URL y confirmar el cumplimiento del ship gate**

Guardar `SiteUrl` en `docs/evidence/README.md`. Esta es la URL pública viva que exige la hackathon.

- [ ] **Step 6: Commit**

```bash
git add docs/evidence/README.md
git commit -m "docs: URL pública viva de la fundación"
```

---

### Task 8: Evidencia de conexión del agente y Bedrock

**Concepto:** **CloudTrail** registra cada llamada a la API de AWS (quién, cuándo, qué). La hackathon pide prueba de que un coding agent operó la cuenta, y estos eventos, junto con las capturas de la sesión, sirven de evidencia. **Bedrock** es el servicio que da acceso a modelos de lenguaje. En una cuenta nueva el acceso a algunos modelos requiere un paso previo y puede tardar, así que se hace ahora.

**Files:**
- Create: `docs/evidence/cloudtrail-createstack.json`, `docs/evidence/README.md` (ampliar)

**Interfaces:**
- Produces: evidencia guardada, y el ID del modelo de Bedrock que usará el plan del chat (anotado en `docs/evidence/README.md`).

- [ ] **Step 1: Confirmar el requisito en la página oficial [USUARIO]**

Abrir la página de la hackathon y copiar al chat el texto exacto sobre qué cuenta como "coding agent conectado a la consola AWS" y si Social Good tiene criterios propios. La página carga con JavaScript y WebFetch no la ve. Ajustar el resto de este task según lo que diga.

- [ ] **Step 2: Extraer los eventos de despliegue de CloudTrail**

Run: `AWS_PROFILE=rumbo aws cloudtrail lookup-events --region us-east-1 --lookup-attributes AttributeKey=EventName,AttributeValue=CreateStack --max-results 5 > docs/evidence/cloudtrail-createstack.json`
Expected: el archivo contiene al menos un evento `CreateStack` con el `Username` del usuario SSO. Los eventos pueden tardar hasta unos 15 minutos en aparecer. Si sale vacío, reintentar más tarde.

- [ ] **Step 3: Capturar la sesión del agente [USUARIO]**

Guardar en `docs/evidence/` capturas de esta sesión de Claude Code ejecutando `cdk deploy` y de la consola de CloudFormation mostrando el stack `RumboACasa`.

- [ ] **Step 4: Solicitar acceso a modelos de Anthropic en Bedrock [USUARIO]**

Consola → *Amazon Bedrock* (región us-east-1) → *Model catalog* → elegir un modelo de Anthropic → completar el formulario de caso de uso si lo pide.
Esperado: el modelo aparece como disponible para invocar.

- [ ] **Step 5: Listar los modelos disponibles**

Run: `AWS_PROFILE=rumbo aws bedrock list-foundation-models --region us-east-1 --by-provider anthropic --query 'modelSummaries[].modelId' --output text`
Run: `AWS_PROFILE=rumbo aws bedrock list-inference-profiles --region us-east-1 --query 'inferenceProfileSummaries[].inferenceProfileId' --output text`
Expected: listas de IDs. Elegir con el usuario un modelo económico con buen soporte de *tool use*. Muchos modelos actuales solo se invocan mediante un *inference profile*, así que usar el ID que aparezca ahí.

- [ ] **Step 6: Probar una invocación**

Run: `AWS_PROFILE=rumbo aws bedrock-runtime converse --region us-east-1 --model-id <ID_ELEGIDO> --messages '[{"role":"user","content":[{"text":"Responde solo: hola"}]}]'`
Expected: JSON con `output.message.content[0].text` que contiene una respuesta. Si falla por permisos de modelo (`AccessDeniedException`), volver al Step 4.

- [ ] **Step 7: Registrar el modelo y confirmar el cierre**

Anotar el ID de modelo en `docs/evidence/README.md`. Confirmar el estado de la fundación: URL viva, evidencia guardada, Bedrock invocable.

- [ ] **Step 8: Commit**

```bash
git add docs/evidence
git commit -m "docs: evidencia de despliegue por agente y modelo Bedrock elegido"
```

---

## Planes siguientes

Cada uno se escribe cuando se cierra el anterior, con el spec como referencia.

1. **Motor de reglas** (`rules-engine`): los 4 programas con fuentes citadas, con pruebas de tabla.
2. **Chat con Bedrock:** `chat-handler`, herramientas, sesión en DynamoDB, secreto CloudFront→Lambda y tope de uso.
3. **Interfaz:** chat, tarjetas de resultado, plan de papeles y `.ics`, con la paleta definitiva.
4. **Cierre:** modo demo, artículo en inglés y verificación de reglas contra fuentes.
