import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge', // Using Edge Runtime as suggested by the user for longer timeouts
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { prompt, history, profile } = await req.json();
    
    const getRotatingKey = () => {
      const keys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
      ].filter(key => !!key);

      if (keys.length === 0) return "";
      const selected = keys[Math.floor(Math.random() * keys.length)];
      return selected?.toString().trim().replace(/[^\x20-\x7E]/g, "") || "";
    };

    const apiKey = getRotatingKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave de API não configurada." }), { status: 500 });
    }

    const ai = new (GoogleGenAI as any)(apiKey);
    
    const systemInstruction = `És o kidiaNutri, um assistente de nutrição angolano especialista em alimentação local (Angola). 
    Seu objetivo é ajudar os angolanos a comerem melhor usando alimentos da terra (Muamba, Funge, Kizaca, Múcua).
    ESTILO: Jovem, vibrante, motivador e muito focado na cultura de Angola.
    DIRETRIZES DE SAÚDE: Se o perfil indicar condições como Hipertensão ou Diabetes, seja rigoroso com sal e açúcar.
    Não prescreva medicamentos, apenas oriente sobre escolhas alimentares.
    ${profile ? `ESTÁS A FALAR COM: ${profile.name || 'um usuário'}, ${profile.age || ''} anos, objetivo: ${profile.objective || ''}.` : ''}`;

    // Tenta primeiro o modelo solicitado, se falhar por 503, tenta novamente ou muda o modelo
    let lastError = null;
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
    
    for (const modelName of modelsToTry) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
          history: history.slice(-15).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text || m.parts?.[0]?.text || '' }]
          })),
        });

        const fullPrompt = `${systemInstruction}\n\nUsuário: ${prompt}`;
        const result = await chat.sendMessage(fullPrompt);
        const generatedText = result.response.text();
        
        return new Response(JSON.stringify({ text: generatedText }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        lastError = err;
        console.error(`Falha com modelo ${modelName}:`, err.message);
        if (err.message?.includes('503') || err.message?.includes('429')) {
          continue;
        }
        break;
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
