import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');

    if (!text) {
      return new Response(null, { status: 400 });
    }

    try {
      const backendRes = await fetch(`http://localhost:8000/api/tts?text=${encodeURIComponent(text)}`);
      if (backendRes.ok) {
        const audioBlob = await backendRes.blob();
        return new Response(audioBlob, {
          headers: { "Content-Type": "audio/mpeg" }
        });
      }
    } catch (e) {
      console.warn("Python backend /api/tts unavailable");
    }

    return new Response(null, { status: 500 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}
