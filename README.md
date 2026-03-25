# AI Status

Real-time status and latency monitoring for major LLM providers — OpenAI, Anthropic, and Google.

Combines official status page data with independent API probes to give you the full picture.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBoldOrion%2FAIStatus&env=OPENAI_API_KEY,ANTHROPIC_API_KEY,GOOGLE_API_KEY&envDescription=API%20keys%20for%20active%20probing%20(all%20optional))

## How It Works

- **Official status**: Fetches each provider's public status page API (Statuspage.io for OpenAI/Anthropic, Google Cloud Status for Google)
- **Active probes**: Sends a tiny request (`"ok"`, minimal tokens) to multiple models per provider to independently verify availability and measure latency
- **Split caching**: Status pages refresh every 60s (free, fast). API probes refresh every 5 minutes (costs tokens). Both use Next.js ISR — probes only run when someone is looking
- **Progressive loading**: Status page data renders instantly; probe results stream in as they complete
- **Adaptive polling**: Client polls every 30s normally, 10s when stale data is detected. Polling pauses entirely when the tab is not visible
- **Smart grouping**: OpenAI's 25+ services are grouped into ChatGPT, API, Sora, and FedRAMP — only troubled services are expanded

## Providers

| Provider | Status Source | Models Probed |
|----------|--------------|---------------|
| OpenAI | status.openai.com | GPT 5.4, GPT 5.4 Mini, GPT 5.4 Nano |
| Anthropic | status.anthropic.com | Opus 4.6, Sonnet 4.6, Haiku 4.5 |
| Google | status.cloud.google.com | Gemini 3.1 Pro Preview, Gemini 3.1 Flash Preview |

## Setup

```bash
git clone https://github.com/BoldOrion/AIStatus.git
cd AIStatus
npm install
cp .env.example .env.local
# Edit .env.local with your API keys (all optional)
npm run dev
```

## Environment Variables

All optional — the dashboard shows official status data without any keys. Add keys to enable active probing.

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Enables probes for OpenAI models |
| `ANTHROPIC_API_KEY` | Enables probes for Anthropic models |
| `GOOGLE_API_KEY` | Enables probes for Google models |

## Adding a Provider

1. Add status and probe functions in `src/lib/providers.ts` following the existing pattern
2. Register the cached fetchers in `src/lib/get-status.ts`
3. Add an icon to `public/icons/`

Each provider has two functions: `fetchXxxStatus()` (fast, status page only) and `fetchXxxProbes()` (slow, API calls). They're cached independently.

## Tech Stack

- **Next.js** (App Router, TypeScript, ISR)
- **Tailwind CSS**
- **Vercel** (hosting, edge caching)

## License

[MIT](LICENSE.md)
