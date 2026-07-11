# GenAI Engineering Guardrails — Bedrock, RAG, and LLM Applications

**Audience:** Engineers building anything that calls an LLM on AWS.
**Status:** These are requirements, not suggestions. "MUST" rules block launch; "SHOULD" rules require a documented reason to skip.
**Companion document:** [AI Adoption Plan](./ai-adoption-plan.md) — governance, risk tiers (T1/T2/T3), and roadmap.

---

## 0. TL;DR checklist

Before shipping any LLM-backed feature:

- [ ] Use case registered and assigned a risk tier (T1/T2/T3)
- [ ] Uses an **allowlisted Bedrock model** via the platform accounts — no personal API keys, no unapproved SaaS LLMs
- [ ] Baseline **Bedrock Guardrail attached** to every invocation (content filters, PII masking, prompt-attack filter)
- [ ] **Model invocation logging** enabled; prompts containing sensitive data have redaction configured
- [ ] Traffic goes over **VPC endpoints (PrivateLink)**; data encrypted with KMS at rest
- [ ] RAG: retrieval enforces the **end user's** permissions; grounding checks enabled; citations shown
- [ ] Retrieved documents and user input treated as **untrusted** (prompt-injection defenses in place)
- [ ] **Eval suite** exists and runs in CI; prompts are versioned
- [ ] Cost tags + application inference profile set; budget alert configured
- [ ] T3 only: red-team review done, kill switch wired, human-in-the-loop or bounded actions
- [ ] `AI_CARD.md` in the repo documents models, data sources, guardrails, and approvals

---

## 1. Model access

1. **MUST** access models only through Amazon Bedrock in the approved platform/workload accounts and approved regions. SCPs enforce this; do not work around them.
2. **MUST NOT** use personal or team-procured LLM API keys (OpenAI, Anthropic direct, etc.) for company data or company products. If you need a model Bedrock doesn't offer, file a request with the AI Review Board.
3. **MUST** use only models on the **allowlist**. IAM policies pin allowed model/inference-profile ARNs; requesting a new model is a lightweight review-board ticket, not an IAM workaround.
4. **SHOULD** use **cross-region inference profiles** for production throughput and **application inference profiles** for cost attribution.
5. **MUST NOT** enable or rely on any model/provider feature that retains prompts for training. (Bedrock does not use your data to train base models; keep it that way by staying inside Bedrock.)

Example of the kind of IAM policy the platform enforces (illustrative):

```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
  "Resource": [
    "arn:aws:bedrock:us-east-1::foundation-model/<allowlisted-model-id>",
    "arn:aws:bedrock:us-east-1:<platform-acct>:inference-profile/<approved-profile>"
  ]
}
```

Everything not allowlisted is denied. `bedrock:CreateModelCustomizationJob`, `PutModelInvocationLoggingConfiguration`, and guardrail management actions are restricted to the platform team.

---

## 2. Data handling

1. **MUST** classify every data source before it goes into a prompt, a RAG corpus, or a fine-tuning set. The workload's risk tier follows the *most sensitive* data it touches.
2. **MUST NOT** send data classified **Restricted** (secrets, credentials, payment data, health data) to any model. Secrets in prompts are treated as leaked: rotate immediately and file an incident.
3. **MUST** mask or pseudonymize customer PII before inference unless the review board approved PII processing for that workload. Use Bedrock Guardrails **sensitive-information filters** (mask mode) as a backstop, not as the only line of defense.
4. **MUST** keep LLM traffic on **VPC interface endpoints** and encrypt corpora, vector stores, and logs with **customer-managed KMS keys**.
5. **MUST NOT** put RAG corpora in public or org-wide-readable S3 buckets. Ingestion buckets follow the same access controls as the source system.
6. **MUST** honor deletion requests: if a source record is deleted (GDPR etc.), the derived chunks/embeddings must be deleted on the next sync, and syncs run at least weekly for corpora containing personal data.

---

## 3. Bedrock Guardrails (the service feature)

Every invocation path — `InvokeModel`, `Converse`, Agents, Knowledge Bases `RetrieveAndGenerate` — **MUST** attach the platform's baseline guardrail (or a stricter derivative):

| Guardrail capability | Baseline setting | Notes |
|---|---|---|
| Content filters (hate, insults, sexual, violence, misconduct) | Medium+ on input and output | External-facing (T3): High |
| **Prompt attack filter** | Enabled on user input | Tag user/retrieved content with input tags so the filter targets untrusted content |
| Sensitive information (PII) | Mask on output; block on input for Restricted patterns | Add custom regexes for internal identifiers |
| Denied topics | Company-specific list (legal/medical/financial advice as applicable, competitors' confidential info, self-harm) | Tighten per workload |
| **Contextual grounding check** | Enabled for all RAG responses (grounding + relevance thresholds) | Blocks or flags answers not supported by retrieved context |
| Word filters | Profanity + custom list | |

Rules:

1. **MUST NOT** loosen the baseline without review-board approval; tightening is always allowed.
2. **MUST** handle guardrail interventions gracefully in the UX (a clear "can't help with that" state), and **MUST** log intervention events for review.
3. **SHOULD** version guardrail configs and reference the guardrail ID + version in `AI_CARD.md`.

Guardrails are one layer. They do **not** replace input validation, authorization, or output handling in your application.

---

## 4. RAG guardrails

### Ingestion

1. **MUST** run classification checks at ingestion; reject or quarantine documents above the corpus's approved classification.
2. **MUST** capture per-document **metadata for authorization** (owner, ACL groups, tenant ID, classification) alongside embeddings.
3. **SHOULD** deduplicate, strip boilerplate, and chunk semantically (headings/sections) rather than fixed-size only; store source URI and last-modified for citations and freshness.

### Retrieval and authorization — the most common RAG security bug

4. **MUST** filter retrieval results by the **end user's entitlements**, not just the service account's. Use metadata filtering (Knowledge Bases metadata filters, OpenSearch filter queries) with the user's groups/tenant resolved server-side from their session — never from the prompt or client input.
5. **MUST NOT** build a single corpus mixing tenants or classification levels without enforced per-query filters; if you can't enforce them, split the corpus.

### Generation

6. **MUST** enable contextual grounding checks (§3) and **SHOULD** display citations to source documents so users can verify answers.
7. **MUST** treat retrieved document content as **untrusted input** (see §5) — a document in the corpus can contain an injection attack.
8. **SHOULD** return "I don't know / not found in our docs" rather than letting the model answer from parametric memory when retrieval confidence is low, for knowledge-grounded use cases.

### Evaluation

9. **MUST** maintain a golden-question set per corpus and track retrieval metrics (recall/precision on gold passages) and answer metrics (faithfulness/groundedness, relevance) — via Bedrock Evaluations or an equivalent harness — in CI and after every corpus or prompt change.

---

## 5. Prompt injection and untrusted content

Assume every piece of user input, retrieved document, tool result, email, or web page is adversarial.

1. **MUST** separate trusted instructions from untrusted content structurally: system prompt for instructions; user/tool turns for content; delimit retrieved content and tell the model it is data, not instructions.
2. **MUST NOT** interpolate untrusted content into the system prompt.
3. **MUST** enable the Bedrock Guardrails prompt-attack filter on untrusted segments (input tagging).
4. **MUST** validate and constrain **output** before acting on it: parse structured output against a schema; never `eval` or execute model output; treat model-generated URLs, SQL, and shell commands as untrusted.
5. For **agents/tool use**:
   - **MUST** give tools least-privilege IAM roles scoped to the workload — an agent's tool must not be able to do anything the end user themselves isn't allowed to do.
   - **MUST** keep side-effecting actions (writes, sends, purchases, deletes) behind an explicit allowlist; T3 agents either require human confirmation for irreversible actions or operate within a reviewed, bounded action set with rate limits.
   - **MUST NOT** let a model see secrets (API keys, tokens) — tools hold their own credentials server-side.
6. **SHOULD** defend against exfiltration channels: don't render model-controlled markdown images/links from untrusted contexts without sanitization.

---

## 6. Logging, monitoring, and audit

1. **MUST** run with **Bedrock model invocation logging** enabled (it's on by default in platform accounts — don't disable it). Logs go to the central S3/CloudWatch pipeline.
2. **MUST** propagate a request ID from your app into invocation metadata so an answer shown to a user can be traced to the exact prompt, model, guardrail version, and retrieved chunks.
3. **MUST** configure redaction for prompts containing sensitive data so raw PII doesn't sit in logs; log retention follows the data-retention policy of the most sensitive data involved.
4. **SHOULD** monitor and alert on: guardrail intervention rate, error/throttle rate, latency (p50/p99), token usage per feature, and eval-score regressions.
5. T3 **MUST** have a **kill switch**: a config flag that disables the AI feature (falling back to a non-AI path or a maintenance message) without a deploy.

---

## 7. Development lifecycle

1. **MUST** version prompts in git and treat prompt changes like code changes: PR review + eval run. No editing prompts in a console for production.
2. **MUST** have an eval suite before first production deploy: task-specific golden cases, safety cases (injection attempts, PII probes, denied topics), and regression cases from real incidents. Run it in CI on prompt/model/corpus changes.
3. **MUST** pin model IDs/versions in config; a model upgrade is a change that goes through evals, not a silent swap.
4. **SHOULD** start from the platform golden templates (RAG service, agent service, eval harness).
5. **SHOULD** right-size models: default to the cheaper allowlisted model and escalate to the frontier model only where evals show it's needed; use prompt caching and batch inference for offline workloads.
6. Fine-tuning / custom models: **MUST** get review-board approval for the training set (it's a copy of company data with new access semantics), store customization jobs' data KMS-encrypted, and restrict the resulting custom model to the owning workload.

---

## 8. Cost guardrails

1. **MUST** tag all Bedrock-related resources and use the team's **application inference profile** so spend is attributable.
2. **MUST** have an AWS Budget with alerts for your workload before production launch.
3. **MUST** enforce app-level limits: per-user and per-tenant rate limits, max input/output token caps, request timeouts, and bounded agent iteration counts (no unbounded loops).
4. **SHOULD** review the cost dashboard monthly; sustained >20% month-over-month growth without matching usage growth triggers an optimization review.

---

## 9. What gets you paged (anti-patterns)

- Calling an LLM API directly from the browser/client with embedded credentials.
- A RAG corpus readable by the whole company because "the service account needs access."
- Concatenating user input into the system prompt.
- Letting an agent run `bash`/SQL generated by the model against production without constraints.
- Disabling invocation logging or detaching the guardrail "temporarily for debugging."
- Shipping a prompt change on Friday with no eval run.

When in doubt, ask in `#ai-platform` before you build — the platform team's job is to make the safe path faster than the workaround.
