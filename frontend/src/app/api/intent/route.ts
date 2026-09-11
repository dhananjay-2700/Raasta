import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (query?.toLowerCase().includes('daughter') && query?.toLowerCase().includes('fees')) {
      return NextResponse.json({
        matched_service_id: "SCHOLARSHIP_01",
        service_name: "State Merit Scholarship for Higher Education",
        extracted_entities: {
          fullName: { value: "Rahul Kumar", confidence: 0.9, source: "Citizen Conversation" },
          purpose: { value: "Daughter's college admission fees", confidence: 0.95, source: "Citizen Conversation" },
          annualIncome: { value: "500000", confidence: 0.85, source: "Citizen Conversation" },
        }
      });
    }

    return NextResponse.json({
      matched_service_id: "DEFAULT_7",
      service_name: "Income Certificate",
      extracted_entities: {}
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process intent' }, { status: 500 });
  }
}
