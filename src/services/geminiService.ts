import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const getAIInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenerativeAI(apiKey);
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
    const genAI = getAIInstance();
    // Forçamos o modelo solicitado pelo usuário: gemini-2.0-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: getSystemInstruction(profile)
    });

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts
      })),
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    if (error.message?.includes('429')) throw new Error('RATE_LIMIT_EXCEEDED');
    if (error.message?.includes('403')) throw new Error('PERMISSION_DENIED');
    throw error;
  }
}

export async function analyzeFoodImage(base64Image: string, profile?: any, mealType?: string) {
  try {
    const genAI = getAIInstance();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            calories: { type: SchemaType.STRING },
            protein: { type: SchemaType.STRING },
            carbs: { type: SchemaType.STRING },
            fat: { type: SchemaType.STRING },
            healthTip: { type: SchemaType.STRING },
            suggestion: { type: SchemaType.STRING }
          },
          required: ["name", "calories", "protein", "carbs", "fat", "healthTip", "suggestion"]
        }
      }
    });

    const imageData = base64Image.split(',')[1] || base64Image;
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData,
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

    const result = await model.generateContent([contextPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("O modelo não retornou nenhuma resposta.");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    if (error.message?.includes('429')) throw new Error('RATE_LIMIT_EXCEEDED');
    if (error.message?.includes('403')) throw new Error('PERMISSION_DENIED');
    throw error;
  }
}
