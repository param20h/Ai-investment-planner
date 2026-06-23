import { graph } from "@/lib/agent";

// Bypass TLS certificate validation for corporate proxies/firewalls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Company name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
          } catch (e) {
            console.error("Error enqueuing stream data:", e);
          }
        };

        try {
          console.log(`Starting LangGraph stream for: "${companyName}"`);
          
          // Initial event
          send({
            step: "research",
            message: `Initiating research node for "${companyName}"...`,
          });

          // Run the LangGraph agent
          const eventStream = await graph.stream(
            { companyName: companyName.trim() },
            { streamMode: "updates" }
          );

          let currentTicker = "";
          let currentFinancials = null;
          let currentAnalysis = null;

          for await (const event of eventStream) {
            const nodeName = Object.keys(event)[0];
            const nodeData = (event as any)[nodeName];

            console.log(`Received update from LangGraph node: "${nodeName}"`);

            if (nodeData.error) {
              send({ step: "error", message: nodeData.error });
              controller.close();
              return;
            }

            if (nodeName === "research") {
              currentTicker = nodeData.ticker;
              currentFinancials = nodeData.financials;
              
              send({
                step: "analyze",
                message: `News and financials retrieved for ${currentTicker}. Beginning business signal analysis...`,
                data: {
                  ticker: currentTicker,
                  financials: currentFinancials,
                  newsCount: nodeData.news?.length || 0,
                },
              });
            } else if (nodeName === "analyze") {
              currentAnalysis = nodeData.analysis;
              
              send({
                step: "decide",
                message: `Signals extracted (Sentiment: ${currentAnalysis.sentimentSummary.substring(0, 40)}...). Grounding final investment decision...`,
                data: {
                  analysis: currentAnalysis,
                },
              });
            } else if (nodeName === "decide") {
              send({
                step: "complete",
                message: "Investment thesis generated!",
                data: {
                  ticker: currentTicker,
                  financials: currentFinancials,
                  analysis: currentAnalysis,
                  decision: nodeData.decision,
                },
              });
            }
          }

          controller.close();
        } catch (err: any) {
          console.error("Error during LangGraph stream execution:", err);
          send({ step: "error", message: `Execution failed: ${err.message}` });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("API route error:", err);
    return new Response(
      JSON.stringify({ error: `Server error: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
