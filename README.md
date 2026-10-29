# AquaGuard

AquaGuard is a capstone aquarium monitoring application. Approved users can view the team’s aquariums, inspect live readings, manage their own tank, and ask an AI assistant to explain current water conditions.

## MVP scope

The MVP focuses on three capabilities:

- A protected web application with Firebase Authentication and an email allowlist.
- A shared aquarium dashboard where approved users can view every tank but edit and simulate only their own tank.
- An AI chat assistant that reads the selected tank’s current Firestore data and explains warnings in plain language.

There is no hardware integration, predictive analytics, autonomous maintenance, or complex species database in the MVP.

## Architecture

| Area | Technology | Purpose |
| --- | --- | --- |
| User interface | React + Vite | Dashboard, tank cards, readings, and chat |
| Site hosting | Cloudflare Workers Static Assets | Public HTTPS website alongside the API |
| Backend | Cloudflare Worker | API endpoints, validation, threshold checks, and secured data retrieval |
| AI | Cloudflare Workers AI with Gemma 4 26B A4B | Conversational explanations of tank readings |
| Database | Cloud Firestore | Tank data, current readings, and reading history |
| User access | Firebase Authentication and Firestore Security Rules | Login and per-user tank access |
| Versioning and delivery | GitHub and GitHub Actions | Source control, checks, and automated deployment |

The application uses React and Cloudflare for the frontend, API, and AI layer, and Firebase for authentication and Firestore. It does not require a traditional server or a locally hosted language model.

## Design alternatives considered

| Option | Decision |
| --- | --- |
| Firestore vs. Realtime Database | Firestore supports structured tank and history documents while still supporting realtime listeners. |
| Workers AI vs. Gemini API | Workers AI keeps the AI integration inside Cloudflare. |
| OpenRouter free models | A possible alternative, but it adds another platform, key, and external quota. |
| Ollama or LM Studio | Useful locally, but a public demo would need an always-available model server. |
| River | Useful for streaming ML and anomaly detection, but unnecessary for this conversational MVP. |

## Data flow

```text
React frontend
    ├── Firebase SDK → live tank subscriptions and authorized simulation writes
    └── Cloudflare Worker → authenticated Firestore read → Workers AI response
```

The React frontend uses the Firebase SDK for live dashboard subscriptions and authorized simulation writes. When a user sends a chat message, the Cloudflare Worker uses the user’s Firebase ID token to retrieve the selected tank and prepare the AI request.

The AI model never receives unrestricted database access. JavaScript determines whether readings exceed predefined thresholds, and the AI explains the result rather than deciding the warning status.

## Authentication and authorization

The application requires login before any aquarium data is shown. Firebase Authentication handles email-and-password accounts. A Firestore allowlist determines which authenticated email addresses may use AquaGuard.

Access must be enforced in three places:

1. The frontend login flow.
2. Firestore Security Rules.
3. The Cloudflare Worker before it processes an AI request.

All approved users can view every tank. Only the owner of a tank can edit readings, start or stop its simulation, inject an anomaly, or change its details.

## Simulated readings

The application does not require aquarium hardware. When the owner starts a simulation:

- JavaScript makes small changes to the current readings at a fixed interval.
- A low-probability event can create an ammonia spike, heater fault, or pH shift.
- An anomaly persists for several updates so it is visible on the dashboard.
- Firestore listeners update viewers automatically.
- An **Inject Anomaly** button provides a reliable demonstration path.
- The simulation stops when its controlling browser session closes.

Only one session controls a tank simulation at a time. Other approved users can view the same readings but cannot write to another user’s tank. AI chat runs only after user interaction and does not make automatic requests.

## AI chat flow

1. The user asks a question such as, “Why is my tank showing a warning?”
2. The Worker validates the request and the user’s Firebase ID token.
3. The Worker retrieves the user-authorized tank readings from Firestore.
4. JavaScript evaluates the configured thresholds.
5. The Worker sends the readings, detected warnings, and question to Gemma 4.
6. The assistant returns a conversational explanation and possible next steps.

AI output is informational and does not replace aquarium-specific guidance.

## Local development

From the repository root:

```bash
npm run install:all
npm run format
```

To run the frontend:

```bash
cd Frontend
npm run dev
```

Useful frontend checks:

```bash
npm run lint
npm run build
```

The backend folder contains the backend workspace and its formatting configuration. Firebase and Cloudflare credentials should be stored in local environment files and never committed.

## Team responsibilities

### Gregory Chambers — Lead Architect and System Design

- Own the overall architecture diagram.
- Identify the frontend, backend, database, and AI modules.
- Show component communication, data flow, system boundaries, and external services.
- Coordinate with the other roles so the architecture remains consistent.
- Deliver the system architecture diagram.

### Joshua Cohen — Interface Designer and API Contracts

- Define how application components communicate.
- Specify API endpoints such as `GET /api/tanks`.
- Define JSON request and response formats.
- Document component methods, data types, validation rules, and error handling.
- Deliver the interface contracts and data structures.

### Rhyanna Bosch — Integration Lead and AI Architecture

- Plan how the AI feature connects to the system.
- Define what data is sent to the AI and what it returns.
- Document how AI failures or unavailable services are handled.
- Ensure AI integration does not interfere with normal application functions.
- Deliver the AI integration strategy in coordination with the architecture and interface contracts.

### Ronnie Allen — Interface Designer and API Contracts

- Define how application components communicate.
- Specify API endpoints such as `GET /api/tanks`.
- Define JSON request and response formats.
- Document component methods, data types, validation rules, and error handling.
- Deliver the interface contracts and data structures.

All team members peer-review the documentation, architecture, code, and final product to keep them aligned.


## References

- Cloudflare. (n.d.-a). *gemma-4-26b-a4b-it (Google).* Cloudflare Workers AI. Retrieved October 27, 2026, from <https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/>
- Cloudflare. (n.d.-b). *React + Vite.* Cloudflare Workers. Retrieved October 27, 2026, from <https://developers.cloudflare.com/workers/framework-guides/web-apps/react/>
- Cloudflare. (2026a, October 12). *Limits.* Cloudflare Workers. <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare. (2026b, October 20). *Pricing.* Cloudflare Workers AI. <https://developers.cloudflare.com/workers-ai/platform/pricing/>
- Firebase. (n.d.-a). *Usage and limits.* Retrieved October 27, 2026, from <https://firebase.google.com/docs/firestore/quotas>
- Firebase. (n.d.-b). *Use the Cloud Firestore REST API.* Retrieved October 27, 2026, from <https://firebase.google.com/docs/firestore/use-rest-api>
- OpenRouter. (n.d.). *Models.* Retrieved October 27, 2026, from <https://openrouter.ai/models?order=top-weekly&output_modalities=text&variant=free>
