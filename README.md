# ScopeMint AI — Clarity Before Checkout

**An explainable AI-powered milestone agreement tool for freelancers and clients.**

ScopeMint AI turns informal project descriptions into transparent, reviewable three-stage project agreements. It categorizes briefs with a locally trained **Multinomial Naive Bayes** classifier, identifies missing terms with deterministic clarity checks, and proposes milestone budgets. A separate **PayPal Sandbox Orders API v2** integration allows a human to authorize test payments; clearly labeled simulated payments are also available when credentials are not configured.

**Live prototype:** https://scopemint-ai-2026.vercel.app/

## Features

- Fully responsive project-workspace UI.
- Five-category trained text classifier: web, branding, marketing, education, consulting.
- Explainable scope and clarity risk scoring: timelines, quantities, revisions, unlimited commitments.
- Exactly balanced three-part USD milestone agreements with human review.
- Separate sandbox checkout and **simulation** flows.
- PayPal sandbox OAuth 2.0, order create, approval redirect, and capture handlers.
- Client-side agreement JSON export, browser-local demo history, accessible reading mode.
- Optional OpenAI enrichment of agreement wording (server-side API key, not needed for ML).
- 12 automated tests, zero npm dependencies.

## Run locally

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/samertall/scopemint-ai.git
cd scopemint-ai
npm test
npm start
```

Open **http://localhost:3000**. The default brief and built-in ML analysis work immediately without API keys. Choose **Analyze with AI**, review the category/clarity score, examine the three milestone amounts, and choose a milestone. With PayPal keys missing, sandbox checkout returns a helpful 503; the clearly labeled demo simulation is a separate action.

No external dependency install or cloud AI service is needed to test the classifier.

## Configure PayPal Sandbox

1. Create a free PayPal Sandbox REST API application and a Sandbox Personal buyer in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Set environment variables locally or in your hosting provider's server environment. Do **not** commit secrets, add keys to client-side JS, or send keys in messages.
3. Configure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `APP_URL` (exact public app origin, HTTPS). See `.env.example`.
4. Restart the local server or redeploy.
5. Review a generated milestone, initiate the PayPal sandbox checkout, approve as a Sandbox Personal test buyer, and return to the app for a server-side capture request.

**PayPal technologies used:**

- **PayPal REST API / OAuth 2.0:** `api/_paypal.cjs` requests a short-lived bearer token from the **sandbox** OAuth endpoint using server-held credentials.
- **PayPal Orders API v2 — Create Order:** `api/create-order.js` creates a `CAPTURE` intent in USD for one explicitly selected milestone and returns the sandbox buyer approval URL.
- **PayPal Orders API v2 — Capture Order:** `api/capture-order.js` handles the return from buyer approval and requests capture. The UI records sandbox capture IDs when returned.
- **Sandbox, not real funds:** The API is hard-coded to `api-m.sandbox.paypal.com`; payment simulations are visibly labeled and are not presented as real transactions.

**Important current testing limitation:** The Sandbox API flow is implemented, but a successful end-to-end capture has **not** been verified with configured developer credentials. This prototype does not implement real-money payments, escrow, merchant accounting, or a legally binding agreement system.

## How the AI works

`lib/ai-engine.cjs` trains a Multinomial Naive Bayes model at process startup from labeled synthetic project descriptions. It tokenizes the brief, scores log-likelihoods for five project categories with Laplace smoothing, converts scores to approximate confidences, and returns a category.

A deterministic review layer checks for deadlines, quantified deliverables, revision-round language, and open-ended commitments. It creates a clarity score and actionable risk findings. Category-specific templates build three agreement milestones, split 30% / 40% / 30% and reconcile rounding so the sum equals the user's total budget.

`api/analyze.js` optionally calls the OpenAI Chat Completions API to refine human-readable descriptions when `OPENAI_API_KEY` is configured. It does not authorize payments or change milestone financial amounts. The application works without OpenAI and identifies the built-in ML mode.

## API

| Route | Method | Purpose |
|---|---|---|
| `/api/status` | GET | Returns whether sandbox credentials are configured, without exposing secrets |
| `/api/analyze` | POST | Accepts `{title, brief, budget}` and produces ML classification, risk findings and three milestones |
| `/api/create-order` | POST | Accepts `{amount, title}`; creates Sandbox order and returns buyer-approval URL |
| `/api/capture-order` | POST | Accepts `{orderId}`; captures an approved Sandbox order |

## Test

```bash
npm test
npm run check
```

The repository includes Node.js `node:test` tests for classification, money parsing, exact milestone budget totals, brief validation, risk flags, API response shape, and sandbox-only safety.

## Deployment

For Vercel, import this repository with **Other / no framework**, root `/`, and no custom build command. The root static files form the UI, while `api/*.js` are Vercel Functions. Set secrets under project environment variables and redeploy; never publish the `.env` file.

## Architecture and safety notes

- Node.js backend, static HTML/CSS/JS frontend; no required package dependencies.
- Demo activity history and agreement snapshots are stored in local browser storage. This is **not** a production payment ledger.
- Project terms and AI-generated milestones must be independently reviewed by people.
- PayPal credentials stay server-side; no live-money or escrow promise.
- Before production use, add authentication, persistent audit logs, CSRF and abuse protections, webhooks, merchant onboarding, legal review, and relevant regulatory/security assessment.
- Only optional third-party AI service: OpenAI; no optional hackathon sponsor integrations are claimed.

## License

MIT — see [LICENSE](LICENSE).

Created for the **PayPal AI Hackathon 2026**.