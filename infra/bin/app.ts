import { join } from 'node:path';
import { App } from 'aws-cdk-lib';
import { RumboStack } from '../lib/rumbo-stack';

const app = new App();

new RumboStack(app, 'RumboACasa', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  webDistPath: join(__dirname, '../../web/dist'),
  backendEntry: join(__dirname, '../../backend/src/handler.ts'),
});
