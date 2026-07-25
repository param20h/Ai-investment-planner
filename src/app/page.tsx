"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Layers,
  Newspaper,
  ShieldAlert,
  Loader2,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  PieChart as ChartIcon,
  HelpCircle,
} from "lucide-react";
import { CompanyFinancials } from "@/lib/agent";

interface StreamStep {
  step: "research" | "analyze" | "decide" | "complete" | "error";
  message: string;
  data?: any;
}

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "research" | "analyze" | "decide" | "complete" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  
  // Accumulated data from stream
  const [ticker, setTicker] = useState("");
  const [financials, setFinancials] = useState<CompanyFinancials | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [decision, setDecision] = useState<any | null>(null);

  const startAnalysis = async (name: string) => {
    if (!name.trim()) return;
    
    setLoading(true);
    setCurrentStep("research");
    setStatusMessage("Initializing agentic workflow...");
    setError("");
    setTicker("");
    setFinancials(null);
    setAnalysis(null);
    setDecision(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyName: name }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to start analysis");
      }

      if (!response.body) {
        throw new Error("Response body is not readable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const update = JSON.parse(line) as StreamStep;
            setCurrentStep(update.step);
            setStatusMessage(update.message);

            if (update.step === "analyze" && update.data) {
              setTicker(update.data.ticker);
              setFinancials(update.data.financials);
            } else if (update.step === "decide" && update.data) {
              setAnalysis(update.data.analysis);
            } else if (update.step === "complete" && update.data) {
              setTicker(update.data.ticker);
              setFinancials(update.data.financials);
              setAnalysis(update.data.analysis);
              setDecision(update.data.decision);
              setLoading(false);
            } else if (update.step === "error") {
              setError(update.message);
              setLoading(false);
            }
          } catch (e) {
            console.error("Failed to parse stream line:", line, e);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
      setCurrentStep("error");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startAnalysis(companyName);
  };

  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case "Invest":
        return {
          bg: "bg-emerald-50/70 border-emerald-200/50 text-emerald-700",
          text: "text-emerald-700",
          badge: "bg-emerald-500/10 text-emerald-700 border-emerald-200/30",
          icon: <ThumbsUp className="w-5 h-5 text-emerald-600" />,
        };
      case "Pass":
        return {
          bg: "bg-rose-50/70 border-rose-200/50 text-rose-700",
          text: "text-rose-700",
          badge: "bg-rose-500/10 text-rose-700 border-rose-200/30",
          icon: <ThumbsDown className="w-5 h-5 text-rose-600" />,
        };
      case "Watch":
      default:
        return {
          bg: "bg-amber-50/70 border-amber-200/50 text-amber-700",
          text: "text-amber-700",
          badge: "bg-amber-500/10 text-amber-700 border-amber-200/30",
          icon: <Eye className="w-5 h-5 text-amber-600" />,
        };
    }
  };

  const formatAmount = (amount: number) => {
    if (!amount) return "N/A";
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    return `$${amount.toLocaleString()}`;
  };

  // Helper to render customized SVG chart for financials
  const renderFinancialChart = () => {
    if (!financials || !financials.revenueHistory || financials.revenueHistory.length === 0) return null;

    const data = financials.revenueHistory;
    const padding = 40;
    const width = 500;
    const height = 240;

    const maxRev = Math.max(...data.map((d) => d.revenue)) * 1.1;
    const minRev = 0;
    const maxIncome = Math.max(...data.map((d) => d.netIncome)) * 1.2;
    const minIncome = Math.min(0, ...data.map((d) => d.netIncome));

    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
    const getYRev = (val: number) => height - padding - ((val - minRev) * (height - 2 * padding)) / (maxRev - minRev);
    const getYIncome = (val: number) => height - padding - ((val - minIncome) * (height - 2 * padding)) / (maxIncome - minIncome || 1);

    // Line path for Net Income
    const incomePoints = data.map((d, i) => `${getX(i)},${getYIncome(d.netIncome)}`).join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto mt-4 overflow-visible">
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* X Axis base line */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Revenue Bars */}
        {data.map((d, i) => {
          const x = getX(i);
          const barWidth = 24;
          const y = getYRev(d.revenue);
          const barHeight = height - padding - y;
          return (
            <g key={i} className="group">
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                fill="url(#revGrad)"
                rx="4"
                className="transition-all duration-300 group-hover:opacity-85"
              />
              <title>{`Revenue (${d.year}): ${formatAmount(d.revenue)}`}</title>
            </g>
          );
        })}

        {/* Net Income Line */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={incomePoints}
        />

        {/* Net Income Nodes */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getYIncome(d.netIncome);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth="3"
                className="transition-all duration-300 hover:r-7"
              />
              <title>{`Net Income (${d.year}): ${formatAmount(d.netIncome)}`}</title>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-[10px] fill-gray-500 font-medium"
          >
            {d.year}
          </text>
        ))}

        {/* Legends */}
        <g transform={`translate(${padding}, 15)`} className="text-xs">
          <rect width="12" height="12" fill="url(#revGrad)" rx="2" />
          <text x="18" y="10" className="text-[11px] fill-gray-600 font-medium">Revenue</text>

          <line x1="90" y1="6" x2="105" y2="6" stroke="#10b981" strokeWidth="3" />
          <circle cx="97.5" cy="6" r="3" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
          <text x="113" y="10" className="text-[11px] fill-gray-600 font-medium">Net Income</text>
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.85" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const getProgressPercentage = () => {
    switch (currentStep) {
      case "research": return 25;
      case "analyze": return 55;
      case "decide": return 85;
      case "complete": return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen mesh-gradient py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Vesta AI</h1>
              <p className="text-xs text-gray-500 font-medium">Investment Research Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs text-gray-600 font-semibold bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              LangGraph Active
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-12">
          
          {/* Search Section */}
          <section className="text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
              Budgeting & Investing <br />
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                Reimagined for Today's World
              </span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-base font-medium max-w-lg mx-auto">
              Vesta researches fundamentals, parses market sentiment, and delivers institutional-grade Invest, Watch, or Pass metrics in real-time.
            </p>

            <form onSubmit={handleSubmit} className="relative mt-8">
              <div className="relative rounded-2xl shadow-xl overflow-hidden glass-card">
                <input
                  type="text"
                  placeholder="Enter company name or ticker (e.g. Apple, Tesla, NVDA)..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-32 py-4 bg-transparent outline-none border-none text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <button
                  type="submit"
                  disabled={loading || !companyName.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition-all duration-300 disabled:opacity-50 disabled:hover:bg-purple-600 flex items-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Researching</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["Apple", "NVIDIA", "Tesla", "Microsoft", "Intel"].map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setCompanyName(name);
                    startAnalysis(name);
                  }}
                  disabled={loading}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 bg-white/40 hover:bg-white/70 border border-white/40 rounded-full transition-all duration-300 backdrop-blur-sm cursor-pointer disabled:opacity-50"
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

          {/* Loading / Progress Section */}
          {loading && (
            <section className="max-w-md mx-auto glass-card p-6 rounded-2xl space-y-4 shadow-lg animate-fade-in">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Agent Pipeline</span>
                <span className="text-purple-600 animate-pulse">{currentStep}...</span>
              </div>
              <div className="h-2 w-full bg-gray-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              {/* Step indicator dots */}
              <div className="flex justify-between px-2">
                {(["research", "analyze", "decide"] as const).map((step, i) => {
                  const stepLabels = ["Research", "Analyze", "Decide"];
                  const isActive = currentStep === step;
                  const isPast = getProgressPercentage() > (i + 1) * 30;
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        isActive ? "bg-indigo-500 ring-4 ring-indigo-200 scale-110" :
                        isPast ? "bg-emerald-500" : "bg-gray-300"
                      }`}></div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${
                        isActive ? "text-indigo-600" : isPast ? "text-emerald-600" : "text-gray-400"
                      }`}>{stepLabels[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-start gap-3 pt-1 text-sm text-gray-700">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{statusMessage}</p>
              </div>
            </section>
          )}

          {/* Error Message */}
          {error && (
            <section className="max-w-md mx-auto bg-rose-50/70 border border-rose-200/50 backdrop-blur-md p-6 rounded-2xl flex gap-3 text-sm text-rose-700 shadow-md">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
              <div>
                <h4 className="font-bold text-rose-800 mb-1">Research pipeline error</h4>
                <p className="font-semibold leading-relaxed">{error}</p>
              </div>
            </section>
          )}

          {/* Results Dashboard */}
          {decision && !loading && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              
              {/* Left Column: Verdict, Pros & Cons */}
              <div className="space-y-6 lg:col-span-1">
                
                {/* Verdict Card */}
                {(() => {
                  const style = getVerdictStyles(decision.verdict);
                  return (
                    <div className={`glass-card p-6 rounded-2xl border-l-4 ${style.bg} shadow-md space-y-6 flex flex-col justify-between`}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Agent Verdict
                          </span>
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${style.badge}`}>
                            {decision.verdict}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {style.icon}
                          <h3 className={`text-3xl font-black ${style.text}`}>
                            {decision.verdict} Thesis
                          </h3>
                        </div>
                      </div>
                      
                      {/* Confidence Meter */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-end text-xs font-bold text-gray-600">
                          <span>Confidence Score</span>
                          <span className="text-base text-gray-900 font-extrabold">{decision.confidence}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-200/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              decision.verdict === "Invest"
                                ? "bg-emerald-500"
                                : decision.verdict === "Pass"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${decision.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Pros & Cons Card */}
                <div className="glass-card p-6 rounded-2xl space-y-6 shadow-md">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Investment Justification
                  </h4>
                  
                  {/* Pros */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <ThumbsUp className="w-4 h-4 text-emerald-600" />
                      <span>Bull Case (Pros)</span>
                    </div>
                    <ul className="space-y-2.5 pl-1">
                      {decision.reasoning?.pros?.map((pro: string, i: number) => (
                        <li key={i} className="flex gap-2.5 items-start text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                      <ThumbsDown className="w-4 h-4 text-rose-600" />
                      <span>Bear Case (Cons)</span>
                    </div>
                    <ul className="space-y-2.5 pl-1">
                      {decision.reasoning?.cons?.map((con: string, i: number) => (
                        <li key={i} className="flex gap-2.5 items-start text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0"></span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Middle & Right Columns: Metrics, Charts, Structured Signals, News */}
              <div className="space-y-6 lg:col-span-2">
                
                {/* Fundamentals & SVG Chart Card */}
                {financials && (
                  <div className="glass-card p-6 rounded-2xl shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-2 border-b border-gray-100">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                          <Building2 className="w-6 h-6 text-indigo-500" />
                          <span>{financials.companyName}</span>
                          <span className="text-sm text-gray-400 font-extrabold bg-gray-100/70 border border-gray-200/50 px-2.5 py-0.5 rounded-md">
                            {financials.symbol}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold mt-1">
                          {financials.sector} &bull; {financials.industry}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-2xl font-black text-gray-900">
                          {financials.price ? `$${financials.price.toFixed(2)}` : "N/A"}
                        </div>
                        <p className="text-xs text-gray-500 font-semibold mt-1">
                          Market Cap: {formatAmount(financials.marketCap)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                      {financials.description}
                    </p>

                    {/* Financial Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { label: "P/E Ratio", value: financials.metrics.peRatio, icon: <Layers className="w-4 h-4 text-purple-500" /> },
                        { label: "Debt-to-Equity", value: financials.metrics.debtToEquity, icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> },
                        { label: "Return on Equity", value: financials.metrics.returnOnEquity, icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
                        { label: "Operating Margin", value: financials.metrics.operatingMargin, icon: <ActivityIcon className="w-4 h-4 text-indigo-500" /> },
                        { label: "Profit Margin", value: financials.metrics.profitMargin, icon: <DollarSign className="w-4 h-4 text-amber-500" /> },
                        { label: "Revenue Growth", value: financials.metrics.revenueGrowth, icon: <TrendingUp className="w-4 h-4 text-cyan-500" /> },
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          <div className="text-sm font-extrabold text-gray-800">{item.value || "N/A"}</div>
                        </div>
                      ))}
                    </div>

                    {/* Interactive SVG Chart */}
                    <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/40">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        <span>Financial History</span>
                        <span className="text-[10px] text-gray-400 lowercase">(hover elements for details)</span>
                      </div>
                      {renderFinancialChart()}
                    </div>
                  </div>
                )}

                {/* Structured Signals Grid */}
                {analysis && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Sentiment, Growth & Competitive Position */}
                    <div className="space-y-6">
                      
                      {/* Sentiment & Growth Summary */}
                      <div className="glass-card p-6 rounded-2xl space-y-4 shadow-md">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                          <Newspaper className="w-4 h-4 text-indigo-600" />
                          <span>Sentiment Summary</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed">
                          {analysis.sentimentSummary}
                        </p>
                      </div>

                      {/* Growth Trend */}
                      <div className="glass-card p-6 rounded-2xl space-y-4 shadow-md">
                        <div className="flex items-center gap-2 text-cyan-700 font-bold text-sm">
                          <TrendingUp className="w-4 h-4 text-cyan-600" />
                          <span>Growth & Competitive Position</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed mb-3">
                          <strong>Trajectory:</strong> {analysis.growthTrend}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed border-t border-gray-100 pt-3">
                          <strong>Moat:</strong> {analysis.competitivePosition}
                        </p>
                      </div>
                    </div>

                    {/* Key Risks */}
                    <div className="glass-card p-6 rounded-2xl space-y-4 shadow-md flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Key Market Risks</span>
                        </div>
                        <ul className="space-y-3.5">
                          {analysis.keyRisks?.map((risk: string, i: number) => (
                            <li key={i} className="flex gap-2.5 items-start text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed">
                              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-right">
                        Structured upstream analysis
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </section>
          )}

        </main>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center space-y-3">
          <div className="flex justify-center gap-2 flex-wrap">
            {["Next.js", "LangGraph", "Groq", "Tailwind CSS", "TypeScript"].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/40 backdrop-blur-sm border border-white/50 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Vesta AI &middot; Built with LangGraph.js &middot; Powered by Groq
          </p>
        </footer>
      </div>
    </div>
  );
}

// Inline fallback icon for Activity
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
