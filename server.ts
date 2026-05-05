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

      const genAI = new (GoogleGenAI as any)(apiKey);
      const model = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });

      const systemInstruction = `És o kidiaNutri, um assistente de nutrição angolano especialista em alimentação local (Angola). 
      Seu objetivo é ajudar os angolanos a comerem melhor usando alimentos da terra (Muamba, Funge, Kizaca, Múcua).
      ESTILO: Jovem, vibrante, motivador e muito focado na cultura de Angola.
      DIRETRIZES DE SAÚDE: Se o perfil indicar condições como Hipertensão ou Diabetes, seja rigoroso com sal e açúcar.
      Não prescreva medicamentos, apenas oriente sobre escolhas alimentares.
      ${profile ? `ESTÁS A FALAR COM: ${profile.name || 'um usuário'}, ${profile.age || ''} anos, objetivo: ${profile.objective || ''}.` : ''}`;

      const chat = model.startChat({
        history: history.map((m: any) => ({
          role: m.role,
          parts: m.parts || [{ text: m.text }]
        })),
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      // Simple implementation without full systemInstruction if the SDK version is older, 
      // but current @google/genai supports it in getGenerativeModel or as part of prompt
      const result = await chat.sendMessage(prompt);
      const text = result.response.text();
      
      res.json({ text });
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

      const genAI = new (GoogleGenAI as any)(apiKey);
      const model = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });

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

      const text = result.response.text().replace(/```json|```/g, "").trim();
      res.json(JSON.parse(text));
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
