# Netlify Deployment Feasibility & Alternatives Guide

This guide analyzes the feasibility of deploying **LuxEngine** on **Netlify** and provides recommended, production-ready alternative hosting options.

---

## 1. Is LuxEngine set up to deploy on Netlify out-of-the-box?

**No, LuxEngine is not configured for Netlify out-of-the-box, and Netlify is generally a mismatch for this type of application.**

### Technical Barriers in Netlify's Serverless Environment:

1. **Severe Serverless Timeouts:**
   - Netlify Functions (serverless) have a strict execution timeout (usually **10 seconds** on the free tier, and up to **26 seconds** on Pro).
   - LLM requests routed through LuxEngine (especially with reasoning/thinking enabled or complex code generation tasks) frequently take **30 to 120+ seconds**. Your requests would constantly cut off and return timeout errors.
2. **Stateless vs. State-ful Sessions (Claude CLI):**
   - The messaging platform workers (Discord/Telegram bots) maintain active, long-lived background CLI subprocesses (`subprocess.Popen`) and local directory workspaces.
   - Ephemeral serverless containers spin down instantly after a request, meaning they cannot maintain active terminal processes or workspace state across requests.
3. **Response Buffering (Breaks SSE Streaming):**
   - Claude Code relies heavily on real-time Server-Sent Events (SSE) streaming.
   - Most serverless gateways buffer the entire response and return it all at once when finished, which completely breaks real-time console rendering.
4. **Architectural Structure:**
   - LuxEngine is a full, long-lived ASGI application designed to run continuously via `uvicorn`. Running it on Netlify requires adding serverless handler shims like `mangum` and rewriting the app's lifespans.

---

## 2. Recommended Production Alternatives

If you want to host LuxEngine remotely for free or very cheap with a simple push-to-deploy workflow, these platforms fully support long-running ASGI Python servers, Docker containers, and live streaming:

### Alternative 1: Railway (Highly Recommended)
Railway is extremely simple, has a generous free/cheap tier, and supports live streaming and persistent storage out-of-the-box.
* **Why it works:** It reads your `Dockerfile` automatically, runs a long-lived container, and fully supports streaming SSE.
* **How to deploy:**
  1. Create a [Railway.app](https://railway.app/) account.
  2. Click **New Project** > **Deploy from GitHub repo**.
  3. Select your repository. Railway will detect the `Dockerfile` and build it.
  4. Under the project settings, add your `.env` variables (e.g. `NVIDIA_NIM_API_KEY`, `ANTHROPIC_AUTH_TOKEN`).

### Alternative 2: Render
Render is a popular platform that provides free/paid web services for web applications.
* **Why it works:** Supports long-lived Docker or Python FastAPI services with zero-downtime deploys.
* **How to deploy:**
  1. Go to [Render.com](https://render.com/).
  2. Create a new **Web Service** and link your GitHub repo.
  3. Choose **Docker** as the runtime.
  4. Add your Environment Variables in the Render dashboard.

### Alternative 3: Fly.io
Fly.io runs your application as micro-VMs close to your users. It is highly optimized for fast, real-time networking.
* **Why it works:** It runs your `Dockerfile` directly as a persistent VM, making it exceptionally fast for SSE streams.
