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
