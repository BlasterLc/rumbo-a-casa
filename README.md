# Rumbo a Casa

**Which housing subsidy fits your family, and the exact papers to bring.**

Rumbo a Casa guides Chilean families through four state housing subsidy programs (DS49, DS1, DS19 and DS52). It interviews the family in plain Spanish, decides which programs they qualify for with a deterministic rules engine that cites the decree behind every answer, and builds a checklist of the papers to bring for each program they qualify for.

- **Live app:** https://d26duk07atmc3z.cloudfront.net
- **Category:** Social Good · **Track:** Community (AWS Zero to Shipped hackathon)
- **Proof of coding agent connection to AWS:** [`docs/evidence/`](docs/evidence/README.md)

## The design decision that matters

An LLM should not decide whether a family is entitled to a state benefit. So the model talks and the code decides:

- The rules live in a plain TypeScript **rules engine** ([`backend/src/rules-engine/`](backend/src/rules-engine)) with no AWS or model dependency. Every rule cites its source: decree, call resolution and consultation date. Sources and figures are collected in [`docs/programas-subsidio.md`](docs/programas-subsidio.md).
- The model (Claude Haiku 4.5 on Amazon Bedrock, Converse API with tool use) only asks natural questions, understands messy answers and explains results. It fills a validated family profile through three tools (`actualizar_perfil`, `evaluar_elegibilidad`, `generar_plan`). Anything the Zod schema rejects is discarded and asked again.
- When data is missing, the engine says exactly which fields are missing (`falta_dato`) instead of guessing.
- The assistant never asks for a Clave Única, RUT, full name, address or bank details.

The same input always produces the same verdict, and the verdict is covered by tests.

## What works today

| Piece | What it does |
|---|---|
| Rules engine | Eligibility for DS49, DS1, DS19 and DS52, each with a cited decree and a reason. Edge cases (income at the limit, RSH bracket changes, unknown answers) are tested. |
| Paper checklist | Per-program list of documents, generated only for the programs the family qualifies for, based on the official application forms. |
| `POST /api/chat` | Conversation over Bedrock Converse with tool use. Session profile and history in DynamoDB (expire after 30 days). Cap of 40 messages per session, request-size limits, clean `400`, `405`, `429`, `503` and `500` responses. |
| `GET /api/demo` | A replayable sample conversation with a **fictional family**. The assistant's lines are fixed, but every verdict and checklist is computed by the real rules engine at each step. It needs no Bedrock or DynamoDB, so it works without entering any personal data. |
| Infrastructure | The whole stack as code with AWS CDK (TypeScript). |

## Architecture

```
Browser ──► CloudFront ──┬─► S3 (single-page app)
                         └─► /api/*  ─► Lambda ─┬─► Amazon Bedrock (Claude Haiku 4.5, Converse API)
                                                ├─► DynamoDB (session state only)
                                                └─► Rules engine + paper checklist (pure TypeScript)
```

- **Amazon CloudFront + S3** serve the app and one public URL.
- **AWS Lambda** (Function URL behind CloudFront at `/api/*`) runs the chat handler, rules engine, checklist and demo.
- **Amazon Bedrock** provides the model through a cross-region inference profile.
- **Amazon DynamoDB** stores session state (profile and history) only. It stores no code and no identity data.
- **AWS CDK** defines everything in `us-east-1`.

## Repository layout

```
backend/   Lambda handler, chat loop, rules engine, paper checklist, demo, tests
infra/     CDK stack (CloudFront, S3, Lambda, DynamoDB, IAM) and its tests
web/       Single-page app served from S3
docs/      Programs reference, technical guide, design spec and implementation plans, evidence
```

The design spec and the step-by-step plans the coding agent worked from are in [`docs/superpowers/`](docs/superpowers).

## Run the tests

```bash
npm install
npm test
```

The backend suite (147 tests) covers the rules engine, tools, chat loop, session repository, handler and demo. It runs against fakes, without calling AWS. The infra suite (8 tests) checks the synthesized stack.

## Deploy

```bash
npm run deploy        # builds the web app and runs `cdk deploy` (needs AWS credentials)
```

## Current status

- `GET /api/demo` and the rules engine are live and verified against the public URL.
- `POST /api/chat` is deployed and its error handling is verified. Live model responses depend on the Bedrock quota of the AWS account, which is being raised (details in [`docs/evidence/`](docs/evidence/README.md)).

## Limits

Rumbo a Casa is an orientation tool. It does not replace MINVU, Serviu or a social worker, and every result points to its official source. The DS52 figures are those of the Metropolitan Region call; outside it they may vary by region or commune, and the result says so.
