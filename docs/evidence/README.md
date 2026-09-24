# Evidence: Rumbo a Casa on AWS

## Live public URL (ship gate)

**SiteUrl:** https://d26duk07atmc3z.cloudfront.net/

Verified 2026-09-22: `GET /` returns 200. `GET /api/hello` returns `{"message":"Hola desde Lambda","region":"us-east-1"}`.

- Stack: `RumboACasa`
- Region: `us-east-1`
- Deployed: 2026-09-22
- Foundation stack (tasks 1-7 of `docs/superpowers/plans/2026-09-20-fundacion-aws.md`): CloudFront + S3 (single-page app) + Lambda Function URL.

## Proof of coding agent connection

- **CloudTrail:** `docs/evidence/cloudtrail-createstack.json` holds `CreateChangeSet`, `ExecuteChangeSet` and `DeleteStack` events on the `RumboACasa` stack, from the IAM user `aws-cdk-augus` (the identity used to deploy through the CDK deployment role), with MFA. Source IP and account ID are redacted; only non-sensitive fields were kept.
- **Screenshots** (from a teammate): `deploy-terminal.png` (the `cdk deploy` log completing the `RumboACasa` stack, cropped so the Stack ARN and account ID are not shown) and `site-live.png` (the site loading in a browser from the CloudFront URL).

## Coding agent connected to AWS from the developer's terminal (2026-09-24)

The coding agent (Claude Code) works against the AWS account with the credentials of the IAM user `blaster`, in two ways, and both are recorded in CloudTrail. Redacted extract (no source IP, account ID, ARN or access keys): `docs/evidence/cloudtrail-agent-calls.json`. Image of the MCP call's event record, taken from the JSON export of the CloudTrail console's *Event history* (us-east-1) and redacted: `docs/evidence/cloudtrail-mcp-event.png`.

- **The official AWS MCP server (`aws-mcp`):** the agent ran a read-only script with the `run_script` tool (status of the `RumboACasa` stack and its Lambda functions). CloudTrail records the `cloudformation:DescribeStacks` call with `userAgent` and `invokedBy` both equal to `aws-mcp.amazonaws.com`, under the user `blaster`.
- **AWS CLI:** 6 read-only calls (`sts`, `cloudformation`, `lambda`, `dynamodb`, `cloudfront`, `logs`) tagged with `app/claude-code-agent` in the user agent, so they can be told apart from the developer's own calls.
- During development the agent also read the Lambda's CloudWatch logs (`logs:FilterLogEvents`) to diagnose the Bedrock `503` errors, and CDK deployed the changes.

## Demo mode (no Bedrock), deployed 2026-09-24

`GET /api/demo` returns a sample conversation with a fictional family. The assistant's lines are fixed, but eligibility and the paperwork checklist are computed by the real rules engine at every step. It works without Bedrock or DynamoDB. The conversation itself is in Spanish, the product's language.

- Commit: `1ca27b3` (`feat: ruta GET /api/demo con conversación de ejemplo sin Bedrock`).
- Screenshot of `cdk deploy RumboACasa` completing the update (36.61 s; only the `ApiFn` Lambda changes): `docs/evidence/deploy-demo-terminal.png`. The account ID and the Stack ARN are redacted.
- Verified against the public URL: `GET /api/demo` returns 200 with `modo: "demo"` and 4 steps. In the last step DS49 is `elegible`, DS1 is `no_elegible`, DS19 is `elegible` and DS52 is `elegible`. `POST /api/demo` returns 405.

## Bedrock

- Chosen model: `us.anthropic.claude-haiku-4-5-20251001-v1:0` (low cost, good tool-use support; used by `chat-handler`).
- `POST /api/chat` was deployed on 2026-09-23 (`Sesiones` table plus IAM permissions). It still answers `503` (`asistente_no_disponible`) because Bedrock rejects the invocation from this account. Error handling works as designed: a clean 503, and no session is saved.
- Cause, according to the CloudWatch logs, which has changed over time:
  - 2026-09-22: `AccessDeniedException` because the account was being verified (resolved).
  - 2026-09-24 22:24 UTC: `AccessDeniedException` because the Anthropic AWS Marketplace subscription was incomplete (the "Anthropic use case details" form was under review).
  - 2026-09-24 22:40 UTC onward: `ThrottlingException: Too many tokens per day` (the account's daily token quota). **Pending:** request an increase in Service Quotas (Bedrock) or through support.
- Meanwhile, the live app relies on `GET /api/demo`.
- To retry the direct invocation:

```
AWS_PROFILE=rumbo aws bedrock-runtime converse --region us-east-1 --model-id "us.anthropic.claude-haiku-4-5-20251001-v1:0" --messages '[{"role":"user","content":[{"text":"Reply only: hello"}]}]'
```
