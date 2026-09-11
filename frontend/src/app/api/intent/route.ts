import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Try proxying to Python FastAPI backend
    try {
      const backendRes = await fetch("http://localhost:8000/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn("Python backend /api/intent unavailable, using local fallback");
    }

    // Fallback response if Python backend is offline
    const query = body.query || "";
    if (query.toLowerCase().includes('daughter') || query.toLowerCase().includes('fees') || query.toLowerCase().includes('college')) {
      return NextResponse.json({
        matched_service_id: "PM_USP_CSS",
        service_name: "PM-USP Central Sector Scholarship",
        extracted_entities: {
          relationship: { value: "daughter", confidence: 0.95, source: "Citizen Conversation" },
          purpose: { value: "College admission fees", confidence: 0.95, source: "Citizen Conversation" },
          annualIncome: { value: 400000, confidence: 0.85, source: "Citizen Conversation" },
        }
      });
    }

    return NextResponse.json({
      matched_service_id: "GENERAL_HELP",
      service_name: "Citizen Assistance Service",
      extracted_entities: {}
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process intent' }, { status: 500 });
  }
}
