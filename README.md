# FE-08 — Error States & Edge Cases

A React + Vite AI chat application focused on handling error states, empty states, loading states, streaming failures, rate limits, and retry flows.

## Live Demo

[Live Demo](https://fe-08-error-states.vercel.app/)

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

## Tech Stack

* React 19
* Vite
* JavaScript
* CSS
* OpenRouter API
* AI SDK
* Vercel Serverless Functions
* ESLint

## Project Structure

```text
fe-08-error-states/
├── api/
│   └── chat.js              # Vercel serverless chat API
├── server/
│   └── index.js             # Local development API server
├── src/
│   ├── components/
│   │   └── ChatSkeleton.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/
├── .env                     # Local environment variables
├── .gitignore
├── package.json
└── vite.config.js
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/laibaharshad/fe-08-error-states.git
cd fe-08-error-states
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

Before deployment, the project was verified with:

```bash
npm run lint
npm run build
```

Both checks pass successfully.

## Assignment

**FE-08 — Error States, Empty States & Edge Cases**

Frontend AI Engineering Internship — Flyrank
