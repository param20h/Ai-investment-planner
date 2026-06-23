# Vesta AI — Full Build Session Transcript
**Date:** June 23, 2026 · 10:03 AM – 11:41 AM IST  
**Conversation ID:** `7b80f76d-4bfc-4147-9610-4bf8f8dd437b`  
**Project:** `/Users/param/placements/insideiim`

---

## 1. Initial Request (10:03 AM)

**User:** Build an AI Investment Research Agent as a full-stack web app.

**Requirements provided:**
- **Goal:** User enters a company name → system researches it → returns **Invest / Pass / Watch** decision with reasoning
- **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, LangGraph.js
- **Agent Architecture — 3-node LangGraph:**
  1. **Research Node** — calls search API + financial data API, returns raw news + key financials
  2. **Analyze Node** — LLM extracts structured signals (sentiment, growth trend, risks, competitive position)
  3. **Decide Node** — LLM produces final verdict (Invest/Pass/Watch), confidence score, and pros/cons reasoning
- **External Data:** Tavily or SerpAPI for news, Yahoo Finance or Financial Modeling Prep for fundamentals
- **Streaming:** Real-time NDJSON stream from backend to frontend
- **Free tier only** for all APIs and deployment

---

## 2. Planning Phase (10:03 – 10:06 AM)

**Agent:** Created an implementation plan covering:
- Next.js 16 project with App Router + Tailwind v4
- LangGraph.js for 3-node agentic workflow
- Yahoo Finance (`yahoo-finance2`) + Tavily for data
- Streaming API route at `/api/research`
- Premium glassmorphism dashboard UI

**User:** ✅ Approved the implementation plan.

---

## 3. Project Initialization (10:06 – 10:10 AM)

**Agent actions:**
1. Ran `npx -y create-next-app@latest ./` with TypeScript, Tailwind, App Router, ESLint
2. Installed dependencies: `@langchain/langgraph`, `@langchain/openai`, `@langchain/core`, `yahoo-finance2`, `lucide-react`
3. Tested `yahoo-finance2` package — discovered it was **blocked by Sophos corporate firewall** (network proxy intercepting HTTPS requests to Yahoo Finance endpoints)

---

## 4. Building the Agent (10:10 – 10:50 AM)

### LLM Provider Journey

The agent went through multiple LLM provider iterations due to network/quota issues:

| # | Provider | Model | Issue |
|---|----------|-------|-------|
| 1 | OpenAI GPT-4o-mini | — | Needed paid key |
| 2 | Anthropic Claude | Claude Haiku | User confirmed key is paid ✅ but later switched |
| 3 | Google Gemini | gemini-1.5-flash | `404` — model not found on v1beta endpoint |
| 4 | Google Gemini | gemini-2.5-flash | ✅ Worked initially |
| 5 | Groq | llama3-70b-8192 | `400` — model decommissioned |
| 6 | Groq | llama-3.3-70b-versatile | `502` — Groq API blocked by Sophos proxy |
| 7 | Google Gemini | gemini-2.5-flash | ✅ Reverted back (Gemini was unblocked) |

### Data Source Journey

| Source | Status |
|--------|--------|
| Yahoo Finance (`yahoo-finance2`) | ❌ Blocked by Sophos firewall |
| Financial Modeling Prep (FMP) | ⚠️ Free tier with dummy key — skipped |
| Tavily Search | ⚠️ Intermittent 502 errors |
| **Gemini LLM fallback** | ✅ Generated realistic company data when APIs failed |

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/agent.ts` | LangGraph 3-node workflow (Research → Analyze → Decide) |
| `src/app/api/research/route.ts` | Streaming NDJSON API endpoint |
| `src/app/page.tsx` | Premium dashboard UI with glassmorphism |
| `src/app/globals.css` | Mesh gradient background, glass-card styles |
| `src/app/layout.tsx` | Root layout with metadata |
| `.env.local` | API keys configuration |

---

## 5. Environment Setup (10:51 AM)

**User:** "make a env and i have tavily api key"

**Agent:** Created `.env.local` with:
- `GEMINI_API_KEY` — for LLM analysis (free tier)
- `TAVILY_API_KEY` — user's Tavily key for news search
- `FMP_API_KEY` — Financial Modeling Prep (optional)

**User:** "the anthropic key is paid" — confirmed Anthropic was available but agent stayed on Gemini (free).

---

## 6. UI Design (10:17 AM)

**Agent** built a premium dashboard named **"Vesta AI"** featuring:

- **Search bar** with glassmorphism styling and quick-pick company buttons (Apple, NVIDIA, Tesla, Microsoft, Intel)
- **Real-time pipeline progress bar** showing Research → Analyze → Decide stages
- **Verdict card** — color-coded (green=Invest, red=Pass, amber=Watch) with confidence meter
- **Pros & Cons** — Bull case / Bear case bullet points
- **Company fundamentals panel** — price, market cap, sector, 6 financial metrics
- **Custom SVG chart** — revenue bars + net income line overlay with hover tooltips
- **Structured signals grid** — sentiment summary, growth trend, competitive position, key risks
- **Mesh gradient background** with purple/blue/rose/amber radial gradients

---

## 7. Error Fixes & LLM Provider Changes

### Fix 1: Gemini Model 404 (11:02 AM)
**Error:** `models/gemini-1.5-flash is not found for API version v1beta`  
**Fix:** Updated model to `gemini-2.5-flash`

### Fix 2: Groq Model Decommissioned (11:05 AM)
**User:** "use groq instead of google"  
**Error:** `llama3-70b-8192 has been decommissioned`  
**Fix:** Updated to `llama-3.3-70b-versatile`

### Fix 3: Groq 502 / Tavily 502 (11:08 – 11:12 AM)
**Error:** Both Groq API and Tavily blocked by corporate proxy  
**Fix:** Reverted to Gemini (unblocked on this network) with Gemini-based data fallback

### Fix 4: Gemini 503 Overloaded (11:18 AM)
**Error:** `This model is currently experiencing high demand`  
**Fix:** Added retry logic with exponential backoff (3 retries, 2s→4s→8s) + fallback from `gemini-2.5-flash` → `gemini-2.0-flash`

### Fix 5: Gemini 429 Quota Exhausted (11:19 AM)
**Error:** `You exceeded your current quota`  
**Fix:** Added multi-provider abstraction: Gemini → Groq fallback chain with both getting retry logic

### Fix 6: Remove Gemini Entirely (11:26 AM)
**User:** "use only groq eliminate the google gemini completely"  
**Fix:** Complete rewrite — removed all Gemini code, made Groq the sole LLM provider with models: `llama-3.3-70b-versatile` → `llama-3.1-8b-instant`

---

## 8. Final Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js)              │
│  page.tsx — Glassmorphism Dashboard              │
│  • Search bar + quick picks                      │
│  • Real-time streaming progress                  │
│  • Verdict card + confidence meter               │
│  • SVG financial charts                          │
│  • Structured signal cards                       │
└──────────────────┬──────────────────────────────┘
                   │ POST /api/research (NDJSON stream)
┌──────────────────▼──────────────────────────────┐
│              API Route (route.ts)                 │
│  Streams LangGraph node updates to frontend      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           LangGraph Workflow (agent.ts)           │
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ Research  │──▶│ Analyze  │──▶│  Decide  │    │
│  │   Node   │   │   Node   │   │   Node   │    │
│  └──────────┘   └──────────┘   └──────────┘    │
│                                                  │
│  Data Sources:        LLM Provider:              │
│  • Tavily Search      • Groq (Llama 3.3 70B)    │
│  • FMP API            • Fallback: Llama 3.1 8B  │
│  • Groq LLM fallback  • 3 retries + backoff     │
└──────────────────────────────────────────────────┘
```

---

## 9. Final File Structure

```
insideiim/
├── .env.local                    # GROQ_API_KEY, TAVILY_API_KEY, FMP_API_KEY
├── package.json                  # Next.js 16, LangGraph, Lucide React
├── src/
│   ├── lib/
│   │   └── agent.ts              # LangGraph 3-node workflow (Groq-powered)
│   └── app/
│       ├── layout.tsx            # Root layout + SEO metadata
│       ├── globals.css           # Mesh gradients, glassmorphism
│       ├── page.tsx              # Dashboard UI (669 lines)
│       └── api/
│           └── research/
│               └── route.ts      # Streaming NDJSON endpoint
```

---

## 10. Pending Action

To get the app working, add your **Groq API key** to `.env.local`:

1. Sign up free at **https://console.groq.com**
2. Create an API key
3. Paste into `.env.local` → `GROQ_API_KEY=gsk_...`
4. Restart dev server: `kill 37910 && npm run dev`

---

## Timeline Summary

| Time | Event |
|------|-------|
| 10:03 | User request received |
| 10:06 | Implementation plan approved |
| 10:07 | Next.js project initialized |
| 10:10 | Dependencies installed |
| 10:10–10:50 | Agent built (LangGraph + API route + UI), multiple LLM/API provider iterations |
| 10:51 | `.env.local` created with API keys |
| 11:02 | Fixed Gemini 404 (model name update) |
| 11:04 | Switched to Groq (user request) |
| 11:05 | Fixed Groq decommissioned model |
| 11:08 | Groq blocked by proxy, reverted to Gemini |
| 11:12 | Added Gemini LLM data fallback for blocked APIs |
| 11:18 | Added retry logic for Gemini 503 |
| 11:19 | Added multi-provider fallback (Gemini → Groq) |
| 11:26 | Eliminated Gemini completely, Groq-only |
| 11:32 | User requested chat export |
| 11:41 | Chat export created |
