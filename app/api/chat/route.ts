import { NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

let apiKey = process.env.GEMINI_API_KEY // Recommended: use environment variable

if (!apiKey) {
  console.error('Gemini API key is missing');
}

// Default system instruction
let systemInstruction = "Hello! Please select an agent to assist you: 1. Travel Assistant, 2. Doctor Appointment, 3. Real Estate Agent.";

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8000,
};

export async function POST(req: Request) {
  console.log('Gemini API route called');

  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { messages, instruction } = await req.json();
    systemInstruction = instruction || systemInstruction; // Update system instruction if provided

    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
    });

    const lastMessage = messages[messages.length - 1].text;

    // Filter and map history to ensure user messages come first
    const history = messages.slice(0, -1)
      .filter((msg: any) => msg.role === 'user')
      .map((msg: any) => ({
        role: 'user',
        parts: [{ text: msg.text }]
      }));

    // Start a chat session
    const chatSession = model.startChat({
      generationConfig,
      history: history
    });

    // Send the last message
    const result = await chatSession.sendMessage(lastMessage);
    const generatedText = result.response.text();

    console.log('Gemini API response:', generatedText);

    return NextResponse.json({ result: generatedText });
  } catch (error: any) {
    console.error('Error in Gemini API route:', error);
    return NextResponse.json({ 
      error: `Error in API route: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}