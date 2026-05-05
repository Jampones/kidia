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
      // Limpeza rigorosa para evitar erros de ISO-8859-1 e chaves inválidas
      return selected?.toString().trim().replace(/[^\x20-\x7E]/g, "") || "";
    };

    const apiKey = getRotatingKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Nenhuma chave de API configurada no ambiente." }), { status: 500 });
    }

    const ai = new (GoogleGenAI as any)(apiKey);

    const systemInstruction = `És o kidiaNutri, um assistente de nutrição angolano especialista em alimentação local (Angola). 
    Seu objetivo é ajudar os angolanos a comerem melhor usando alimentos da terra (Muamba, Funge, Kizaca, Múcua).
    ESTILO: Jovem, vibrante, motivador e muito focado na cultura de Angola.
    DIRETRIZES DE SAÚDE: Se o perfil indicar condições como Hipertensão ou Diabetes, seja rigoroso com sal e açúcar.
    Não prescreva medicamentos, apenas oriente sobre escolhas alimentares.
    ${profile ? `ESTÁS A FALAR COM: ${profile.name || 'um usuário'}, ${profile.age || ''} anos, objetivo: ${profile.objective || ''}.` : ''}`;

    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const chat = model.startChat({
      history: history.slice(-20).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text || m.parts?.[0]?.text || '' }]
      })),
    });

    const fullPrompt = `${systemInstruction}\n\nUsuário: ${prompt}`;
    const result = await chat.sendMessage(fullPrompt);
    const text = result.response.text();
    
    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
