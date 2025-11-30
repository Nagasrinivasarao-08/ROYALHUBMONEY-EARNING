import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

const getClient = () => {
  // Use import.meta.env for Vite/Vercel, fallback to process.env for standard Node compliance
  // Cast import.meta to any to avoid type errors if vite/client types are missing
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : undefined);
  
  if (!apiKey) {
    console.error("Gemini API Key is missing. Please set VITE_API_KEY in your Vercel environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeProduct = async (product: Product): Promise<string> => {
  const client = getClient();
  if (!client) return "AI Service Unavailable: Please configure your API_KEY.";

  try {
    const prompt = `
      Analyze this investment product for a simulation game.
      Product Name: ${product.name}
      Cost: $${product.price}
      Daily Return: $${product.dailyIncome}
      Total Duration: ${product.days} days.
      
      Calculate the ROI percentage and give a brief, fun 2-sentence recommendation on whether this is a "safe" or "aggressive" growth strategy in the context of a game.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Analysis currently unavailable. Check console for details.";
  }
};

export const getFinancialAdvice = async (query: string, balance: number): Promise<string> => {
    const client = getClient();
    if (!client) return "AI Service Unavailable. Please configure your API_KEY.";
  
    try {
      const prompt = `
        You are a financial advisor in an investment simulation game.
        The user has a balance of $${balance}.
        User Query: "${query}"
        
        Provide a short, helpful, and safe response (max 50 words). Remind them this is just a simulation.
      `;
  
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      return response.text || "I couldn't understand that.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "System error. Please try again later.";
    }
  };