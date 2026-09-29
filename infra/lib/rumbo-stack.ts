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

const MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
const MODELO_BASE = 'anthropic.claude-haiku-4-5-20251001-v1:0';

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

    const distribution = new cloudfront.Distribution(this, 'Cdn', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
