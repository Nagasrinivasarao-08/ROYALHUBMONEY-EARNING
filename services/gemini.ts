import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

// Initialize AI with the environment variable as per requirements
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProduct = async (product: Product): Promise<string> => {
  try {
    const prompt = `
      Analyze this investment product for a simulation game.
      Product Name: ${product.name}
      Cost: ₹${product.price}
      Daily Return: ₹${product.dailyIncome}
      Total Duration: ${product.days} days.
      
      Calculate the ROI percentage and give a brief, fun 2-sentence recommendation on whether this is a "safe" or "aggressive" growth strategy in the context of a game.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Analysis currently unavailable. Please try again later.";
  }
};

export const getFinancialAdvice = async (query: string, balance: number): Promise<string> => {
    try {
      const prompt = `
        You are a financial advisor in an investment simulation game called Royal Hub.
        The user has a current balance of ₹${balance}.
        User Query: "${query}"
        
        Provide a short, helpful, and safe response (max 50 words). Remind them this is just a simulation for entertainment.
      `;
  
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      return response.text || "I couldn't understand that.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "System error. I'm taking a quick break, please try again.";
    }
  };