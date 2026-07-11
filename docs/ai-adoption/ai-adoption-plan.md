# AI Adoption Plan (AWS)

**Audience:** Engineering leadership, platform teams, security, and product.
**Scope:** Adopting generative AI across the company on AWS, with Amazon Bedrock as the primary managed LLM platform.
**Companion document:** [GenAI Engineering Guardrails](./genai-engineering-guardrails.md) — the concrete rules engineers must follow when using Bedrock and building RAG/LLM applications.

---

## 1. Goals and principles

### Goals

1. Ship AI-assisted product features and internal productivity tools that measurably improve outcomes (speed, quality, cost).
2. Keep company and customer data safe: no data leaves our AWS boundary without an approved contract and architecture review.
3. Make the *safe path the easy path* — engineers get a paved road (approved models, templates, logging, guardrails) instead of a list of prohibitions.
4. Stay auditable: every production model invocation is attributable, logged, and reproducible.

### Principles

- **Managed-first.** Use Amazon Bedrock for model access before considering self-hosted models (SageMaker/EC2). Bedrock gives us model choice, no data retention for training by providers, and native guardrails/logging.
- **One gateway, many teams.** All LLM traffic flows through a shared platform layer (accounts, IAM, logging, budgets) owned by the platform team. Teams build on top; they do not create bespoke model access.
- **Human accountability.** AI assists decisions; a named human owns every AI-influenced outcome that affects customers, money, or employees.
- **Data classification drives everything.** What data a workload may send to a model is determined by its classification tier, not by team preference.
- **Evaluate before and after launch.** No production launch without an eval suite; no eval suite means no launch.

---

## 2. Operating model and governance

### Roles

| Role | Responsibility |
|---|---|
| **AI Platform Team** (part of platform/infra) | Owns Bedrock enablement, shared accounts, IAM, guardrail policies, model allowlist, logging pipeline, cost dashboards, golden templates. |
| **AI Review Board** (security + legal + platform + a rotating senior engineer) | Approves new models, new data-classification usage, external-facing launches, and fine-tuning requests. Meets weekly; async approvals for low-risk requests within 2 business days. |
| **Workload owners** (product teams) | Own their prompts, RAG corpora, evals, and on-call for their AI features. |
| **Security** | Reviews threat models for external-facing AI features; runs periodic red-team exercises. |

### Risk tiers

Every AI use case is registered (a lightweight intake form) and assigned a tier that determines the required controls:

| Tier | Description | Examples | Required controls |
|---|---|---|---|
| **T1 — Internal, low risk** | Internal users, no sensitive data, human reviews all output | Code assistants, doc summarization of public content | Approved model list, logging |
| **T2 — Internal, sensitive data** | Internal users, confidential/customer data in prompts or RAG corpus | Support-ticket triage, internal knowledge base Q&A | T1 + Bedrock Guardrails with PII handling, retrieval ACLs, review board sign-off on data sources |
| **T3 — External-facing** | Output shown to customers or actions taken automatically | Product chatbots, agentic workflows, content generation in-product | T2 + full eval suite, prompt-injection defenses, red-team review, kill switch, human-in-the-loop or bounded action set |

Fine-tuning or training on company data is always at least T2 and requires review-board approval regardless of tier.

---

## 3. Platform architecture on AWS

### Account structure

- **`ai-platform-prod` / `ai-platform-nonprod` accounts** within the existing AWS Organization. Bedrock is enabled *only* in these accounts and in approved workload accounts; Service Control Policies (SCPs) deny `bedrock:*` elsewhere.
- Approved regions only (e.g., `us-east-1`, `us-west-2`) — enforced via SCP — to keep data residency and model availability predictable.
- Workload accounts reach Bedrock through **VPC interface endpoints (PrivateLink)**; no LLM traffic over the public internet.

### Shared services (paved road)

The platform team provides:

1. **Model allowlist** — a curated set of Bedrock models (e.g., a frontier model for complex tasks, a fast/cheap model for high-volume tasks, an embedding model) enforced by IAM policy. New models are added by request through the review board.
2. **Baseline Bedrock Guardrail** — a managed guardrail configuration (content filters, PII masking, denied topics, prompt-attack filter) that every workload attaches by default. Teams may *tighten* it, never loosen it, without review.
3. **Invocation logging pipeline** — Bedrock model invocation logging to S3 + CloudWatch in a central log-archive account, with dashboards for usage, latency, and errors.
4. **Cost controls** — application inference profiles per team, mandatory cost-allocation tags, AWS Budgets with alerts at 50/80/100%.
5. **Golden templates** — reference implementations: a RAG service using Bedrock Knowledge Bases, an agent template using Bedrock Agents/AgentCore with least-privilege tools, and an eval harness. Starting from a template is the default; deviating requires a design doc.

### RAG reference architecture

- Amazon Bedrock **Knowledge Bases** (or OpenSearch Serverless / Aurora pgvector for custom needs) as the vector store.
- Ingestion from S3 with data-classification checks at ingestion time.
- **Metadata filtering for authorization** — retrieval results filtered by the *end user's* entitlements, never just the service's.
- Contextual grounding checks (Bedrock Guardrails) on responses to reduce hallucination.

---

## 4. Rollout roadmap

### Phase 0 — Foundations (Weeks 0–6)

- Stand up AI platform accounts, SCPs, PrivateLink endpoints, invocation logging, baseline guardrail, model allowlist.
- Publish the [engineering guardrails](./genai-engineering-guardrails.md) and the use-case intake form.
- Enable approved AI coding assistants for engineers (quick win, T1).

**Exit criteria:** Any engineer can invoke an approved model through the paved road with logging and budget attribution, and cannot invoke anything else.

### Phase 1 — Pilots (Weeks 6–16)

- Select 2–3 pilot use cases: one internal RAG (T2, e.g., internal docs Q&A) and one product-adjacent feature (T3 candidate, launched internally first).
- Build on golden templates; establish eval suites and baseline metrics *before* launch.
- Weekly review of cost, quality metrics, and incidents.

**Exit criteria:** Pilots meet predefined success metrics (see §6); guardrails validated under real traffic; runbook for AI incidents exists.

### Phase 2 — Scale (Weeks 16–36)

- Open intake to all teams; platform team supports onboarding.
- First external-facing (T3) launch after red-team review.
- Introduce agentic workflows with bounded tool access where pilots justify them.
- Quarterly red-team exercise and guardrail-effectiveness review.

### Phase 3 — Optimize (ongoing)

- Model routing and cost optimization (right-size model per task, prompt caching, batch inference for offline jobs).
- Evaluate fine-tuning/distillation only where prompt engineering + RAG demonstrably fall short.
- Deprecate unused use cases; re-certify T2/T3 workloads annually.

---

## 5. People and enablement

- **Training:** required short course for all engineers before Bedrock access is granted — covers the guardrails doc, data classification, prompt-injection basics, and cost awareness. Deeper workshops for teams building T2/T3 workloads.
- **Champions:** each product area names an AI champion who joins a guild run by the platform team.
- **Documentation:** guardrails, templates, and model guidance live in the engineering handbook; the intake form and allowlist are linked from there.

---

## 6. Success metrics

| Area | Metric | Target (first year) |
|---|---|---|
| Adoption | Teams with a registered use case in production | ≥ 5 |
| Quality | Eval pass rate per workload (task-specific) | ≥ agreed baseline per workload, tracked per release |
| Safety | Guardrail intervention rate reviewed; unhandled prompt-injection incidents | 0 unhandled incidents in prod |
| Cost | LLM spend attributable to a team/use case via tags | 100% |
| Velocity | Time from intake approval to first deployed prototype | ≤ 2 weeks for T1/T2 |
| Compliance | T2/T3 workloads with current review-board approval and logging enabled | 100% |

---

## 7. Risk management

| Risk | Mitigation |
|---|---|
| Sensitive data leakage to models or logs | Data classification gates, PII masking in guardrails, log redaction, PrivateLink, SCP-restricted regions |
| Hallucinated output harming customers | Grounding checks, citations required in RAG UX, human-in-the-loop for T3 actions, eval suites |
| Prompt injection / jailbreak of external features | Bedrock Guardrails prompt-attack filter, retrieved-content isolation, least-privilege tools, red teaming |
| Runaway cost | Inference profiles, budgets/alerts, per-team quotas, model right-sizing |
| Shadow AI (unapproved tools/models) | SCP denies Bedrock outside approved accounts; network egress controls; make the paved road genuinely faster than the workaround |
| Vendor/model churn | Bedrock's multi-model abstraction; prompts and evals versioned so model swaps are testable |
| Regulatory change (e.g., EU AI Act exposure) | Use-case registry doubles as an AI inventory; review board tracks obligations per tier |

---

## 8. Decision log conventions

Every T2/T3 workload maintains, in its repo:

- `AI_CARD.md` — model(s) used, data sources and their classification, guardrail configuration, eval suite location, human oversight model, and the review-board approval link.
- Versioned prompts and eval results per release.

This is the audit trail; if it's not written down, it isn't approved.
