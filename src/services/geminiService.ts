import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askNutritionAssistant(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Você é um assistente de nutrição especializado e tecnológico. Responda em Português. Seja direto, científico e use tons de verde neon em suas descrições visuais. Se o usuário perguntar sobre saúde, forneça informações baseadas em dados, mas lembre-os de consultar um profissional.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

export async function analyzeFoodImage(base64Image: string) {
  try {
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(',')[1], // Remove prefix if present
      },
    };
    
    const promptPart = {
      text: "Identifique o que é esta comida ou bebida na foto. Forneça uma estimativa aproximada de calorias, macronutrientes (carboidratos, proteínas, gorduras) e uma breve dica de saúde. Responda em formato JSON estruturado com as chaves: name, calories, protein, carbs, fat, healthTip. Responda em Português.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, promptPart] },
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
}
