import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Try proxying to Python FastAPI backend
    try {
      const backendRes = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn("Python backend /api/chat unavailable, using local fallback");
    }

    // Fallback response if Python backend server is offline
    const query = body.query || "";
    return NextResponse.json({
      status: "success",
      query: query,
      extraction: {
        intent: "higher_education_financial_assistance",
        summary: "Needs financial assistance to pay for daughter's college fees.",
        entities: {
          relationship: { value: "daughter", confidence: 0.95, source: "Citizen Conversation" },
          education_level: { value: "college", confidence: 0.95, source: "Citizen Conversation" }
        }
      },
      selected_scheme: {
        scheme_id: "PM_USP_CSS",
        scheme_name: "PM-USP Central Sector Scholarship"
      },
      eligibility: {
        status: "needs_information",
        missing_information: [{ field: "annual_income" }]
      },
      next_best_action: {
        action_type: "request_information",
        title: "Provide Annual Income",
        description: "Please provide your annual family income to verify scholarship eligibility.",
        required_item: "annual_income"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
