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
