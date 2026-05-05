import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

// Vercel Edge Runtime hint (if used as individual route, but here we use a full server)
// export const config = { runtime: 'edge' };

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Key Rotation Logic
  const getRotatingKey = () => {
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(key => !!key);

    if (keys.length === 0) return "";
    const selected = keys[Math.floor(Math.random() * keys.length)];
    return selected!.trim().replace(/[^\x00-\x7F]/g, "");
  };

  // Gemini Proxy endpoints
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { prompt, history, profile } = req.body;
      const apiKey = getRotatingKey();
      
      if (!apiKey) {
        return res.status(500).json({ error: "No API Key configured" });
      }

      const ai = new (GoogleGenAI as any)(apiKey);
      const systemInstruction = `És o kidiaNutri, um assistente de nutrição angolano especialista em alimentação local (Angola). 
      Seu objetivo é ajudar os angolanos a comerem melhor usando alimentos da terra (Muamba, Funge, Kizaca, Múcua).
      ESTILO: Jovem, vibrante, motivador e muito focado na cultura de Angola.
      DIRETRIZES DE SAÚDE: Se o perfil indicar condições como Hipertensão ou Diabetes, seja rigoroso com sal e açúcar.
      Não prescreva medicamentos, apenas oriente sobre escolhas alimentares.
      ${profile ? `ESTÁS A FALAR COM: ${profile.name || 'um usuário'}, ${profile.age || ''} anos, objetivo: ${profile.objective || ''}.` : ''}`;

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
          res.json({ text: result.response.text() });
          return;
        } catch (err: any) {
          lastError = err;
          if (err.message?.includes('503') || err.message?.includes('429')) continue;
          break;
        }
      }
      throw lastError;
    } catch (error: any) {
      console.error("Server API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/gemini/analyze', async (req, res) => {
    try {
      const { image, profile, mealType } = req.body;
      const apiKey = getRotatingKey();

      if (!apiKey) {
        return res.status(500).json({ error: "No API Key configured" });
      }

      const ai = new (GoogleGenAI as any)(apiKey);
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

      let lastError = null;
      const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];

      for (const modelName of modelsToTry) {
        try {
          const model = ai.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            prompt,
            { inlineData: { data: image, mimeType: "image/jpeg" } }
          ]);
          const text = result.response.text().replace(/```json|```/g, "").trim();
          res.json(JSON.parse(text));
          return;
        } catch (err: any) {
          lastError = err;
          if (err.message?.includes('503') || err.message?.includes('429')) continue;
          break;
        }
      }
      throw lastError;
    } catch (error: any) {
      console.error("Server Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
