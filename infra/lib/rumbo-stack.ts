import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';

const MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
const MODELO_BASE = 'anthropic.claude-haiku-4-5-20251001-v1:0';

export interface RumboStackProps extends cdk.StackProps {
  /** Carpeta con la web ya construida (web/dist). */
  webDistPath: string;
  /** Archivo TypeScript que exporta `handler`. */
  backendEntry: string;
  /** Correo que recibe las alarmas. Si falta, las alarmas existen pero no avisan a nadie. */
  correoAlertas?: string;
}

/**
 * Solo lo que la web usa: su propio origen, las fuentes de Google (hoja de estilos y archivos),
 * estilos en línea (MUI/emotion los inyecta) y el audio de Polly como data:. Si la web suma otro
 * origen (imágenes, analítica, fuentes), hay que agregarlo aquí o el navegador lo bloquea.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "media-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export class RumboStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RumboStackProps) {
    super(scope, id, props);

    const webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const tablaSesiones = new dynamodb.Table(this, 'Sesiones', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiraEn',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiFn = new NodejsFunction(this, 'ApiFn', {
      entry: props.backendEntry,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      // CloudFront corta el origen a los 30 s; el bucle de herramientas hace varias llamadas a Bedrock.
      timeout: cdk.Duration.seconds(28),
      memorySize: 512,
      environment: {
        TABLA_SESIONES: tablaSesiones.tableName,
        MODEL_ID,
      },
    });
    tablaSesiones.grantReadWriteData(apiFn);
    apiFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/${MODEL_ID}`,
          // El perfil de inferencia cross-region enruta a varias regiones de EE. UU.
          `arn:aws:bedrock:*::foundation-model/${MODELO_BASE}`,
        ],
      }),
    );
    apiFn.addToRolePolicy(
      new iam.PolicyStatement({
        // Los modelos de Anthropic en Bedrock se distribuyen vía AWS Marketplace:
        // la primera invocación completa una suscripción y necesita que el rol
        // que invoca tenga estos permisos (no soportan resource-level, requieren "*").
        actions: ['aws-marketplace:ViewSubscriptions', 'aws-marketplace:Subscribe'],
        resources: ['*'],
      }),
    );
    // Voz de "Escuchar" (POST /api/voz). SynthesizeSpeech no admite permisos por recurso salvo léxicos.
    apiFn.addToRolePolicy(new iam.PolicyStatement({ actions: ['polly:SynthesizeSpeech'], resources: ['*'] }));
    const apiUrl = apiFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // La SPA usa rutas reales (/resultado, /plan/DS49): al recargar o abrir un enlace directo, S3
    // no tiene ese objeto y respondería 403. Se reescribe a index.html solo en el comportamiento
    // de la web (los archivos con extensión pasan tal cual), para no enmascarar errores de /api/*.
    const rutasDeLaSpa = new cloudfront.Function(this, 'RutasDeLaSpa', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (request.uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}`),
    });

    const cabecerasDeSeguridad = new cloudfront.ResponseHeadersPolicy(this, 'CabecerasDeSeguridad', {
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        contentSecurityPolicy: { contentSecurityPolicy: CSP, override: true },
      },
    });

    const distribution = new cloudfront.Distribution(this, 'Cdn', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cabecerasDeSeguridad,
        functionAssociations: [
          {
            function: rutasDeLaSpa,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.FunctionUrlOrigin(apiUrl),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          responseHeadersPolicy: cabecerasDeSeguridad,
        },
      },
    });

    // Alarmas. La cuenta tiene un tope de 10 ejecuciones concurrentes (no admite reservar
    // concurrencia), así que el gasto por abuso se vigila aquí en vez de limitarlo.
    const avisos = new sns.Topic(this, 'Alertas');
    if (props.correoAlertas) {
      avisos.addSubscription(new subscriptions.EmailSubscription(props.correoAlertas));
    }
    const accionAviso = new cwActions.SnsAction(avisos);
    const erroresApi = new cloudwatch.Alarm(this, 'ErroresApi', {
      alarmDescription: 'La Lambda de la API terminó con error (fallo no controlado o timeout).',
      metric: apiFn.metricErrors({ period: cdk.Duration.minutes(5), statistic: 'Sum' }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    erroresApi.addAlarmAction(accionAviso);
    const volumenApi = new cloudwatch.Alarm(this, 'VolumenApi', {
      alarmDescription:
        'Más de 600 llamadas a la API en una hora: uso inusual o abuso (cada mensaje del chat puede costar Bedrock y Polly).',
      metric: apiFn.metricInvocations({ period: cdk.Duration.hours(1), statistic: 'Sum' }),
      threshold: 600,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    volumenApi.addAlarmAction(accionAviso);

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
