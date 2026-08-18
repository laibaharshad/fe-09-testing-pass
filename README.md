# FE-09 — Testing Pass

A React + Vite AI chat application with a full automated testing setup: Vitest + React Testing Library component tests, Playwright end-to-end tests, and GitHub Actions CI. Built on top of the FE-08 error-states chat application.

## Features

* AI chat with streaming responses
* First-run empty state with suggested prompts
* Empty input handling
* Loading skeleton while waiting for a response
* Network and server error handling
* Rate-limit error handling
* Empty AI response handling
* Unexpected stream termination handling
* Retry failed requests
* Responsive chat interface
* Serverless API deployment with Vercel
* **Automated component tests (Vitest + React Testing Library)**
* **End-to-end test (Playwright) with a mocked AI API**
* **GitHub Actions CI that runs the full suite**

## Tech Stack

* React 19
* Vite
* JavaScript
* CSS
* OpenRouter API
* AI SDK
* Vercel Serverless Functions
* ESLint
* Vitest
* React Testing Library
* Playwright
* GitHub Actions

## Project Structure

```text
fe-09-testing-pass/
├── .github/
│   └── workflows/
│       └── tests.yml          # GitHub Actions CI
├── api/
│   └── chat.js                # Vercel serverless chat API
├── server/
│   └── index.js               # Local development API server
├── src/
│   ├── components/
│   │   ├── ChatMessage.jsx    # Reusable chat message renderer
│   │   ├── ChatMessage.test.jsx
│   │   ├── ChatSkeleton.jsx
│   │   ├── ToolResult.jsx     # Presentational tool-result UI
│   │   └── ToolResult.test.jsx
│   ├── test/
│   │   ├── setup.js           # Vitest setup (jest-dom, cleanup)
│   │   └── helpers.js         # Mock streaming response helpers
│   ├── App.jsx
│   ├── App.test.jsx           # Form / streaming / error / retry tests
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── tests/
│   └── chat.spec.js           # Playwright E2E test
├── public/
├── .env                       # Local environment variables
├── .gitignore
├── package.json
├── playwright.config.js
└── vite.config.js
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/laibaharshad/fe-09-testing-pass.git
cd fe-09-testing-pass
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add the environment variable

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_api_key_here
```

Never commit your API key. The `.env` file is included in `.gitignore`.

The API key is **only** needed to run the real AI API locally. It is **never** required to run the tests — all tests mock the `/api/chat` request.

### 4. Start the local API server

```bash
npm run server
```

### 5. Start the Vite development server

In another terminal:

```bash
npm run dev
```

The application will be available at the local Vite URL shown in the terminal.

## Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run server`  | Start the local Express API server   |
| `npm run build`   | Create a production build            |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |
| `npm test`        | Run Vitest in watch mode             |
| `npm run test:run`| Run the Vitest component suite once  |
| `npm run test:e2e`| Run the Playwright E2E suite         |

## Testing

### Unit / Component Tests

Component tests use **Vitest** with **React Testing Library**, **jest-dom** matchers, and **user-event** for realistic interaction. They run in a **jsdom** environment.

```bash
npm run test:run
```

The suite covers the highest-risk UI:

* `ChatMessage` — user messages, assistant messages, the pending/empty assistant state, and tool-result messages.
* `ChatMessage`'s message model: the FE-08 app does not have a formal streaming "part" model, so the component is tested against the application's existing message shape (`{ role, content }`). The pending assistant state (empty `content`) and streaming updates are covered via App-level tests using mocked readable streams.
* `ToolResult` — a small, purely presentational component representing a tool-result UI state (success, error, loading) that could exist in the chat interface. It calls no external API.
* `App` — the validated chat form (empty/whitespace rejection, valid submission, request body, input clearing), the loading state (disabled controls), streaming responses (partial content then the final response), and all error states (failed request + retry, rate limit, empty response, interrupted stream).

Tests query elements through accessible semantics only — roles, labels, text, and accessible names (`getByRole("button", { name: /send/i })`). No `data-testid` or CSS class queries are used, so visual/CSS refactoring will not break the tests.

### Mocked API behavior

Every test mocks the AI/API interaction. The frontend calls `fetch("/api/chat", ...)`, and component tests stub `global.fetch` with deterministic mock responses:

* successful streamed output via a `ReadableStream`/`Response` body (including a gated stream to verify partial content renders mid-stream),
* failed responses (`500`), rate limits (`429`), empty responses, and interrupted streams.

No test calls OpenRouter, the Vercel API, or any real network endpoint, and no `.env` API key is required.

### End-to-End Tests

End-to-end tests use **Playwright** (Chromium) and live in `tests/`.

```bash
npm run test:e2e
```

`playwright.config.js` starts the Vite dev server automatically. The single primary-flow test:

1. Opens the application and verifies the initial/empty state.
2. Enters a user message and submits it.
3. Verifies the message appears.
4. Verifies the assistant reaches a streamed response state.

The `/api/chat` request is intercepted with Playwright request routing and answered with a deterministic fake response — the E2E test never calls the real AI API and needs no API key. The Express API server is not required.

Locally, Playwright uses the system-installed Chrome browser; on CI it uses the Playwright-managed Chromium bundle (installed via `npx playwright install --with-deps chromium`).

### CI

A GitHub Actions workflow (`.github/workflows/tests.yml`) runs on every push:

```bash
npm ci
npx playwright install --with-deps chromium
npm run lint
npm run build
npm run test:run
npm run test:e2e
```

The workflow fails the build if any step fails, so CI is red whenever the test suite is red. It requires no secrets and runs entirely from the repository contents.

## Error & Edge Cases

The application handles several failure scenarios:

### Empty Input

Submitting an empty or whitespace-only message does nothing.

### Rate Limit

A `429` response displays a rate-limit message and allows the user to retry.

### Network / Server Failure

Failed API requests display a user-friendly error instead of leaving the interface in a broken state.

### Empty Response

If the AI returns no usable content, the user is informed and can retry.

### Interrupted Stream

If the response stream ends before completion, the partial assistant response is removed and the user can retry.

### Loading State

A skeleton is displayed while waiting for the AI response.

### Retry

Failed requests can be retried using the **Try again** button.

## Deployment

The application is deployed on Vercel.

The production deployment uses:

```text
src/App.jsx
      ↓
/api/chat
      ↓
api/chat.js
      ↓
OpenRouter API
```

The OpenRouter API key is configured as a Vercel environment variable and is not stored in the repository.

## Validation

The project is verified with:

```bash
npm run lint
npm run build
npm run test:run
npm run test:e2e
```

## Assignment

**FE-09 — Testing Pass**

Frontend AI Engineering Internship — Flyrank
