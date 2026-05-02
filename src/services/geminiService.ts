import { GoogleGenAI } from "@google/genai";

const getRotatingKey = () => {
  const keys = [
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
    import.meta.env.VITE_GEMINI_API_KEY_6,
    import.meta.env.VITE_GEMINI_API_KEY_7,
    import.meta.env.VITE_GEMINI_API_KEY_8,
    import.meta.env.VITE_GEMINI_API_KEY_9,
  ].filter(key => !!key);

  if (keys.length === 0) {
    return process.env.GEMINI_API_KEY; // Fallback para a chave padrão do sistema
  }

  // Pegar uma chave aleatória do pool para distribuir a carga
  return keys[Math.floor(Math.random() * keys.length)];
};

const getAIInstance = () => {
  const apiKey = getRotatingKey();
  if (!apiKey) {
    throw new Error("Nenhuma chave API do Gemini configurada. Por favor, adicione as chaves no ambiente.");
  }
  return new GoogleGenAI({ apiKey });
};

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
    const ai = getAIInstance();
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
    const ai = getAIInstance();
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
