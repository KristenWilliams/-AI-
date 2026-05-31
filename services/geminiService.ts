import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FoodAnalysisResult, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the response schema for structured JSON output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING, description: "Name of the product if visible, or 'Unknown Product'" },
    ingredients: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "List of clean ingredients excluding additives where possible" 
    },
    additives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          code: { type: Type.STRING, description: "E-number or INS code if applicable" },
          function: { type: Type.STRING, description: "What this additive does (e.g., Preservative)" },
          riskLevel: { 
            type: Type.STRING, 
            enum: ["SAFE", "MODERATE", "HIGH", "UNKNOWN"],
            description: "Based on WHO/IARC/GB standards"
          },
          description: { type: Type.STRING, description: "Brief health impact description" }
        },
        required: ["name", "function", "riskLevel", "description"]
      }
    },
    allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
    healthScore: { type: Type.NUMBER, description: "0 to 100 integer score where 100 is healthiest" },
    summary: { type: Type.STRING, description: "Comprehensive health advice summary" },
    standardsAnalysis: {
      type: Type.OBJECT,
      properties: {
        gb_china: { type: Type.STRING, description: "Analysis based on China GB standards" },
        eu_standard: { type: Type.STRING, description: "Analysis based on EU regulations" },
        us_fda: { type: Type.STRING, description: "Analysis based on US FDA GRAS" }
      },
      required: ["gb_china", "eu_standard", "us_fda"]
    },
    nutritionFacts: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.STRING },
        sugar: { type: Type.STRING },
        fat: { type: Type.STRING },
        sodium: { type: Type.STRING }
      }
    }
  },
  required: ["productName", "ingredients", "additives", "allergens", "healthScore", "summary", "standardsAnalysis"]
};

export const analyzeImage = async (base64Image: string, language: Language): Promise<FoodAnalysisResult> => {
  const modelId = "gemini-2.5-flash"; // Efficient for OCR + Reasoning
  
  const prompt = `
    You are an expert food scientist and nutritionist specialized in global food safety standards (China GB, EU EFSA, US FDA).
    
    Analyze the provided image of a food packaging ingredient list. 
    1. Identify the ingredients.
    2. Separate common ingredients from food additives.
    3. Analyze the health risks of additives.
    4. Check for allergens.
    5. Provide a health score from 0 (very unhealthy) to 100 (very healthy/clean label).
    6. Compare regulations:
       - Is it compliant with China's GB standards?
       - Are there additives banned in the EU but allowed elsewhere?
       - What is the FDA status?
    
    The output language must be strictly in ${language === Language.ZH ? 'Simplified Chinese (zh-CN)' : 'English'}.
    Extract text accurately. If the image is blurry or not a food label, return a low score and explain in the summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2 // Lower temperature for more factual analysis
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as FoodAnalysisResult;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};