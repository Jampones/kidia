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
  let context = "Você é o kidiaNutri, um Nutricionista Especialista Angolano e tecnológico. Responda em Português de Angola.";
  if (profile) {
    const userType = profile.profile_type === 'child' ? 'Criança' : (profile.profile_type === 'pregnant' ? 'Gestante' : (profile.age >= 65 ? 'Idoso' : 'Adulto'));
    context += `\nESTE É O SEU PACIENTE:
    - Nome: ${profile.name}
    - Perfil: ${userType}
    - Idade: ${profile.age} anos
    - Objetivo: ${profile.goal}
    - Dieta: ${profile.diet}
    - Restrições: ${profile.restrictions?.join(', ') || 'nenhuma'}.`;

    if (profile.profile_type === 'child') {
      context += "\nATENÇÃO CRIANÇA: Se a idade for muito baixa (ex: meses até 3 anos), seja EXTREMAMENTE cauteloso com riscos de engasgo (espinhas, ossos), excesso de sal, açúcar ou texturas inadequadas. Dê um alerta se o prato for perigoso.";
    }
    if (profile.age >= 65) {
      context += "\nATENÇÃO IDOSO: Considere dificuldades de mastigação e digestão. Sugira adaptações se o prato for muito pesado.";
    }
  }
  context += "\n\nDIRETRIZES DE RESPOSTA:";
  context += "\n1. CONTEXTO ANGOLANO: Use apenas referências da culinária angolana (ex: funge, calulu, muamba). NUNCA sugira ingredientes estrangeiros inacessíveis como tofu ou sementes de chia exóticas.";
  context += "\n2. SEGURANÇA: Se a pergunta for sobre medicamentos ou algo perigoso para a idade, diga: 'Para este caso, consulte um profissional de saúde. Eu sou apenas uma IA.'.";
  context += "\n3. ESTILO: Use tons de verde neon em descrições visuais e seja encorajador.";
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

export async function analyzeFoodImage(base64Image: string, profile?: any, mealType?: string) {
  try {
    const ai = getAIInstance();
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(',')[1] || base64Image, // Remove prefix if present
      },
    };
    
    let contextPrompt = `Você é o kidiaNutri, um Nutricionista Especialista Angolano com visão científica. Analise esta imagem no contexto de uma refeição do tipo: "${mealType || 'não especificado'}".

DIRETRIZES DE RECONHECIMENTO VISUAL (MUITO IMPORTANTE):
1. DIFERENCIAÇÃO DE FOLHAS: Observe a textura. 
   - Se as folhas estiverem cortadas em tiras finas e mantiverem um verde vivo, é COUVE.
   - Se for uma massa verde escura, pisada ou moída, é KIZACA.
   - Não confunda RAMA, LOMBI ou JIMBOA. Analise o corte e o brilho da folha.
2. CONTEXTO ANGOLANO: Use apenas culinária de Angola. NUNCA mencione tofu ou lentilhas.

DIRETRIZES DE SEGURANÇA E PERSONALIZAÇÃO:
1. SEGURANÇA POR IDADE: Verifique a idade de ${profile?.age || 'desconhecida'} anos.
   - CRIANÇAS PEQUENAS (até 5 anos): Alerta OBRIGATÓRIO sobre espinhas de peixe (Mufete/Calulu) e ossos pequenos. Verifique se a textura é adequada para a idade.
   - IDOSOS: Alerta sobre digestão pesada e facilidade de mastigação.
2. BOM SENSO: Avalie se o prato é apropriado para "${mealType}". Pratos pesados (Calulu, Muamba) no lanche ou jantar devem ter um aviso de cautela nutricional.
3. SEGURANÇA MÉDICA: Para dúvidas de saúde graves, diga: "Consulte um nutricionista ou médico. Eu sou apenas uma IA."`;

    if (profile) {
      const userType = profile.profile_type === 'child' ? 'Criança' : (profile.profile_type === 'pregnant' ? 'Gestante' : (profile.age >= 65 ? 'Idoso' : 'Adulto'));
      contextPrompt += `\n\nPERFIL DO PACIENTE:
      - Nome: ${profile.name || 'Usuário'}
      - Tipo: ${userType}
      - Idade: ${profile.age || 'Não informada'} anos
      - Objetivo: ${profile.goal || 'Saúde geral'}
      - Restrições: ${profile.restrictions?.join(', ') || 'Nenhuma'}`;
    }
    
    contextPrompt += `\n\nIdentifique com precisão:
    1. Nome do prato (exato).
    2. Calorias, Macros.
    3. Dica Nutricional Kidia: personalizada para o perfil e idade (com alertas de segurança se necessário).
    4. Sugestão Kidia (Acompanhamento): Bebida típica ou extra que combine.
    
    Responda em Português de Angola.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [imagePart, { text: contextPrompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            calories: { type: "STRING" },
            protein: { type: "STRING" },
            carbs: { type: "STRING" },
            fat: { type: "STRING" },
            healthTip: { type: "STRING" },
            suggestion: { type: "STRING" }
          },
          required: ["name", "calories", "protein", "carbs", "fat", "healthTip", "suggestion"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("O modelo não retornou nenhuma resposta.");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
}
