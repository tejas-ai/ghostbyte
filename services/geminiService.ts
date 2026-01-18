
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const guessPayload = async (payloadText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following potentially decoded steganographic payload. Determine its likely format (JSON, PGP, Base64, Code, Plaintext, etc.) and explain what it might be. If it looks like nonsense, say so politely. Payload: \n\n${payloadText.substring(0, 2000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            format: { type: Type.STRING, description: "Likely data format" },
            description: { type: Type.STRING, description: "Summary of the content" },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
          },
          required: ["format", "description", "confidence"]
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Guess Error:", error);
    return { format: "Unknown", description: "Failed to analyze payload.", confidence: 0 };
  }
};
