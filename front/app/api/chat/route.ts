import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

type IncomingMessage = {
  role?: unknown;
  content?: unknown;
};

export async function GET() {
  return NextResponse.json({
    ready: Boolean(process.env.GROQ_API_KEY),
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY manquante dans l'environnement serveur." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];

    const messages = rawMessages
      .map((msg: IncomingMessage) => {
        const role = msg?.role;
        const content = msg?.content;

        if (
          (role === "user" || role === "assistant") &&
          typeof content === "string" &&
          content.trim().length > 0
        ) {
          return {
            role,
            content,
          };
        }

        return null;
      })
      .filter(Boolean);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Aucun message valide a envoyer." },
        { status: 400 },
      );
    }

    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const response = await client.chat.completions.create({
      model,
      max_tokens: 1024,
      messages,
    });

    const text = response.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "Reponse vide de Groq." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      text,
      provider: "groq",
      model,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue pendant l'appel Groq.";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}