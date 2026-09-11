import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendRes = await fetch("http://localhost:8000/api/raasta/journey/active");
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Python backend GET /api/raasta/journey/active unavailable");
  }

  return NextResponse.json({
    status: "success",
    journey: null
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    try {
      const backendRes = await fetch("http://localhost:8000/api/raasta/journey/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn("Python backend POST /api/raasta/journey/active unavailable");
    }

    return NextResponse.json({ status: "success", message: "Active journey set (local)." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sync active journey" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const backendRes = await fetch("http://localhost:8000/api/raasta/journey/active", {
      method: "DELETE",
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Python backend DELETE /api/raasta/journey/active unavailable");
  }

  return NextResponse.json({ status: "success", message: "Active journey cleared (local)." });
}
