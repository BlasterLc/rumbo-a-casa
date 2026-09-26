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

  it('reescribe las rutas de la SPA a index.html solo en el comportamiento de la web, no en /api/*', () => {
    const t = sintetizar();
    t.resourceCountIs('AWS::CloudFront::Function', 1);
    t.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({
          FunctionAssociations: [Match.objectLike({ EventType: 'viewer-request' })],
        }),
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({
            PathPattern: '/api/*',
            FunctionAssociations: Match.absent(),
          }),
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

  it('crea la tabla de sesiones con clave sessionId, pago por uso y TTL en expiraEn', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
      TimeToLiveSpecification: { AttributeName: 'expiraEn', Enabled: true },
    });
  });

  it('pasa la tabla y el modelo a la Lambda de la API, con timeout bajo el de CloudFront', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 28,
      Environment: {
        Variables: Match.objectLike({
          TABLA_SESIONES: Match.anyValue(),
          MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
        }),
      },
    });
  });

  it('permite invocar Bedrock en el perfil de inferencia y en el modelo base', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'bedrock:InvokeModel',
            Effect: 'Allow',
            Resource: Match.arrayWith([
              'arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0',
            ]),
          }),
        ]),
      },
    });
  });

  it('da a la Lambda permisos de lectura y escritura en la tabla', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['dynamodb:GetItem', 'dynamodb:PutItem']),
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });
});
