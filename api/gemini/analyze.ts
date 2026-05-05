import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { image, profile, mealType } = await req.json();
    
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
      return new Response(JSON.stringify({ error: "Chave de API não encontrada no ambiente." }), { status: 500 });
    }

    const ai = new (GoogleGenAI as any)(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analise esta imagem de uma refeição ${mealType || ''} em um contexto angolano.
    Identifique os alimentos típicos e estime as calorias e macronutrientes.
    Responda EXCLUSIVAMENTE em JSON no formato:
    {
      "name": "nome do prato",
      "calories": "ex: 450 kcal",
      "protein": "ex: 25g",
      "carbs": "ex: 60g",
      "fat": "ex: 15g",
      "healthTip": "Dica de saúde personalizada para o usuário",
      "suggestion": "Sugestão de acompanhamento ou bebida típica"
    }
    Se o perfil indicar criança ou idoso, dê alertas de segurança nas dicas.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: "image/jpeg"
        }
      }
    ]);

    let text = result.response.text();
    text = text.replace(/```json|```/g, "").trim();
    
    return new Response(text, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Vercel Analysis Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
