import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    const { messages, specialties } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Falling back to dummy response.");
      return NextResponse.json({
        message: "I am currently running in offline mode. Please select a specialty from the filter dropdown above to find a doctor.",
        suggestedSpecialty: "all"
      });
    }

    const availableSpecialties = Array.isArray(specialties) && specialties.length > 0 
      ? specialties.join(", ") 
      : "General Medicine, Cardiology, Dermatology, Pediatrics, Neurology, Psychiatry, Orthopedics";

    const systemPrompt = `You are a helpful and empathetic AI Triage Assistant for a telehealth platform. 
Your job is to listen to the user's symptoms and suggest the most appropriate medical specialty from the following list of available specialties on our platform: [${availableSpecialties}].

Guidelines:
1. Be empathetic, brief, and professional.
2. DO NOT attempt to diagnose the user or provide medical advice. State clearly that you are an AI assistant.
3. Recommend exactly ONE specialty from the provided list that best fits their symptoms.
4. If the symptoms are a severe emergency (e.g., chest pain, severe bleeding, difficulty breathing), immediately tell them to call emergency services (e.g., 911) or go to the nearest emergency room.
5. Format your response clearly.

At the very end of your response, you MUST include a JSON block with the exact suggested specialty from the list (or "none" if emergency/unclear). 
Example ending:
\`\`\`json
{ "suggestedSpecialty": "Cardiology" }
\`\`\``;

    const chatHistory = messages.map((m: any) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`).join("\\n");
    const prompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\n\nAssistant:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON block
    let suggestedSpecialty = "all";
    let cleanMessage = responseText;

    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.suggestedSpecialty && parsed.suggestedSpecialty !== "none") {
          suggestedSpecialty = parsed.suggestedSpecialty;
        }
      } catch (e) {
        console.error("Failed to parse specialty JSON from Gemini", e);
      }
      // Remove the JSON block from the message shown to the user
      cleanMessage = responseText.replace(/```json\n[\s\S]*?\n```/, "").trim();
    }

    return NextResponse.json({
      message: cleanMessage,
      suggestedSpecialty
    });

  } catch (error) {
    console.error("Error in AI triage route:", error);
    return NextResponse.json({ error: "Failed to process triage request" }, { status: 500 });
  }
}
