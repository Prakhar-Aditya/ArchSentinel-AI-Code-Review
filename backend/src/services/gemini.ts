import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

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
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return fallbackResponse.text;
  }
}