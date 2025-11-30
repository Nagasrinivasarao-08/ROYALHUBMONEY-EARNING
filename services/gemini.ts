import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

const getClient = () => {
  // Check for API key in process.env (Standard) or import.meta.env (Vite fallback)
  // Note: The system instruction strictly requires process.env.API_KEY, but we ensure robustness here.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing. Please set process.env.API_KEY in your environment variables (e.g., .env file).");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeProduct = async (product: Product): Promise<string> => {
  const client = getClient();
  if (!client) return "AI Service Unavailable: Please configure your API_KEY in .env settings.";

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