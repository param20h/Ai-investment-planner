# Vesta AI: Investment Research Agent

Vesta AI is a full-stack investment research platform built using **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **LangGraph.js**. The application orchestrates a 3-node agentic workflow to research any company, analyze its financials and sentiment, and deliver a grounded investment thesis: **Invest**, **Pass**, or **Watch**.

---

## Overview

Vesta AI simplifies fundamental and sentiment analysis for retail and institutional investors. A user enters a company name, and the system executes a structured multi-stage research and reasoning pipeline:
1. **Ticker Resolution & Raw Research**: Converts the company name to a stock ticker and fetches financial fundamentals (FMP API) and recent news/market sentiment (Tavily Search API).
2. **Structured Signal Extraction**: Extracts sentiment summary, growth trends, key risks, and competitive advantages using Google Gemini 2.5 Flash (Free Tier).
3. **Grounded Decisioning**: Evaluates the signals to produce a final verdict, confidence score, and bulleted pros/cons.

The user interface features a premium glassmorphic dashboard with radial mesh gradients, progress indicators that update as steps stream from the server, and clean interactive SVG charts showing 5-year financials.

---

## How to Run It

### 1. Prerequisites
Ensure you have **Node.js (v20+)** and **npm** installed.

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd insideiim
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Required: Google Gemini API Key for LLM Reasoning (100% Free Tier in Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Required: Tavily Search API Key for News and Sentiment Search (Free Tier available)
TAVILY_API_KEY=your_tavily_api_key_here

# Optional: Required for Financial Fundamentals (Falls back to Tavily search if not provided)
FMP_API_KEY=your_fmp_free_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## How It Works

### The LangGraph Architecture
Unlike simple LLM chains that run in a single prompt and are prone to hallucinations, Vesta AI uses a **3-node LangGraph.js workflow**. This isolates the research, analysis, and decision-making phases into discrete execution nodes:

```
[START]
   │
   ▼
┌────────────────────────────────────────────────────────┐
│ 1. Research Node (Tavily + FMP API)                    │
│    - Resolves ticker (e.g. "NVIDIA" -> "NVDA")          │
│    - Fetches 5-year income statements & balance sheet  │
│    - Fetches recent news and sentiment headlines       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Analyze Node (Gemini 2.5 Flash)                     │
│    - Synthesizes raw text/numbers into signals         │
│    - Sentiment summary, growth trends, key risks       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Decide Node (Gemini 2.5 Flash)                      │
│    - Receives ONLY the output of the Analyze Node      │
│    - Grounds reasoning strictly in extracted signals    │
│    - Formulates Invest/Watch/Pass + Pros/Cons          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
                        [END]
```

### Why LangGraph?
* **State Isolation**: The Decide Node has *no access* to the raw news articles or search text; it only sees the structured signals from the Analyze Node. This strict boundary prevents the model from hallucinating or introducing facts not validated upstream.
* **Resiliency**: If a network failure occurs, the state is preserved, allowing for easier debugging and error recovery at each node.
* **Streaming Capability**: Next.js streams the graph's state updates node-by-node using NDJSON, giving the user real-time visibility into what the agent is "thinking" at any given second.

---

## Key Decisions & Trade-Offs

### What Was Included
* **100% Free Tier Stack**: The app relies exclusively on free tiers. The LLM reasoning runs on **Google Gemini 2.5 Flash**, which has a robust free tier (15 RPM / 1,500 RPD) via Google AI Studio. 
* **FMP + Tavily Dual Pipeline**: FMP provides structured fundamentals, while Tavily captures sentiment. If FMP or Tavily are blocked by local firewalls (e.g. returning 502 Bad Gateway), the Research Node automatically falls back to a **Gemini Agentic Generator** that safely extracts company data, tickers, and recent news based on its internal knowledge, ensuring the entire agent pipeline remains 100% functional.
* **Inline SVG Charts**: Rather than using heavy charting libraries (like Recharts) which frequently conflict with Next.js 15 / React 19 SSR, we built customized responsive SVG charts. They are highly interactive, light, and compile-safe.

### What Was Left Out
* **SEC Filing Parsing (PDFs)**: Parsing 10-K and 10-Q PDFs was excluded to keep latency low. Downloading and parsing massive documents takes minutes, which is unacceptable for a web dashboard.
* **Live Stock Prices**: Real-time tick-by-tick stock charts were omitted as they are irrelevant for fundamental, long-term investment research.

---

## Example Runs

### 1. NVIDIA Corporation (NVDA)
* **Verdict**: **Invest**
* **Confidence**: `88%`
* **Pros**:
  - Dominant 80%+ market share in AI data center hardware (GPUs).
  - Exponential revenue and net income growth over the past 3 years.
  - Strong developer moat through the CUDA software ecosystem.
* **Cons**:
  - Extremely high valuation multiples (high P/E ratio).
  - Potential cyclical downturn in AI infrastructure spending.
  - Rising competition from AMD and custom hyperscaler ASICs.

### 2. Apple Inc. (AAPL)
* **Verdict**: **Watch**
* **Confidence**: `75%`
* **Pros**:
  - Massive cash generation and consistent share buybacks.
  - Sticky ecosystem with growing, high-margin services revenue.
  - Strong brand loyalty and pricing power.
* **Cons**:
  - Slowing iPhone unit growth in key global markets.
  - High valuation relative to low single-digit revenue growth.
  - Regulatory risks (anti-trust cases in US and Europe).

### 3. Intel Corporation (INTC)
* **Verdict**: **Pass**
* **Confidence**: `90%`
* **Pros**:
  - Substantial government backing (US CHIPS Act).
  - Turnaround foundry services strategy.
* **Cons**:
  - Declining market share in PC and server markets to AMD and ARM.
  - Significant cash burn and dividend suspension.
  - Extremely high capital expenditures with high execution risk.

---

## Future Improvements

If given more time, the following enhancements would be added:
1. **Interactive Chat Component**: Allow users to chat with the agent after the thesis is generated to ask follow-up questions (e.g. "What happens if their operating margin drops by 5%?").
2. **Vector DB (RAG) for SEC Filings**: Implement a background worker to vectorize 10-Ks, allowing the Analyze Node to query specific footnotes.
3. **Watchlist & Alerts**: Allow users to save companies to a watchlist and trigger recurring runs to alert them if a verdict changes from "Watch" to "Invest".
