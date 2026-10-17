import { NextResponse } from "next/server";
import { answerChat } from "@/lib/chat-knowledge";

const clean = (message: string) => message.replace(/[<>]/g, "").trim().slice(0, 500);

export async function POST(request: Request) {
  let body: { message?: unknown };
  try {
    body = (await request.json()) as { message?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const message = clean(body.message);
  if (message.length < 1) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const response = await answerChat(message);
  return NextResponse.json({ ...response, fallback: true, providerConfigured: false, products: response.recommendations });
}
