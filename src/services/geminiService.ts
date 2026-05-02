import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getSystemInstruction = (profile?: any) => {
  let context = "Você é um assistente de nutrição especializado e tecnológico (NutriLens). Responda em Português.";
  if (profile) {
    context += ` O usuário é do perfil: ${profile.profile_type}. Nome: ${profile.name}. Idade: ${profile.age}. Objetivo: ${profile.goal}. Dieta: ${profile.diet}. Condições de saúde: ${profile.restrictions?.join(', ') || 'nenhuma'}.`;
    if (profile.profile_type === 'child') context += " Como é uma criança, foque em crescimento e desenvolvimento saudável.";
    if (profile.profile_type === 'pregnant') context += " Como é uma gestante, foque em nutrientes essenciais para a mãe e para o feto.";
  }
  context += " Seja direto, científico e use tons de verde neon em suas descrições visuais. Forneça informações baseadas em dados, mas lembre-os de consultar um profissional.";
  return context;
};

export async function askNutritionAssistant(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], profile?: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: getSystemInstruction(profile),
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

export async function analyzeFoodImage(base64Image: string, profile?: any) {
  try {
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(',')[1], // Remove prefix if present
      },
    };
    
    let contextPrompt = "Identifique o que é esta comida ou bebida na foto. Forneça uma estimativa aproximada de calorias, macronutrientes (carboidratos, proteínas, gorduras) e uma breve dica de saúde.";
    if (profile) {
      contextPrompt += ` Considere que o usuário é ${profile.profile_type} com objetivo de ${profile.goal} e restrições: ${profile.restrictions?.join(', ') || 'nenhuma'}.`;
    }
    contextPrompt += " Responda em formato JSON estruturado com as chaves: name, calories, protein, carbs, fat, healthTip. Responda em Português.";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [imagePart, { text: contextPrompt }] },
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
