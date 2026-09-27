import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`[gemini] dotenv failed to load from ${envPath}:`, result.error.message);
} else {
  console.log(`[gemini] dotenv loaded from: ${envPath}`);
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(`GEMINI_API_KEY is not configured. Looked for .env at: ${envPath}`);
}

console.log(`[gemini] API key loaded (starts with: ${apiKey.slice(0, 8)}...)`);

const ai = new GoogleGenAI({
  apiKey,
});

export async function askGemini(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.log("Primary Gemini model failed. Trying fallback...");

    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    return fallbackResponse.text;
  }
}