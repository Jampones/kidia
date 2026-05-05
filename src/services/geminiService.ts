// Client-side service to talk to our custom Express backend
// This keeps API keys secure and solves the ISO-8859-1 header issues in the browser

export async function askNutritionAssistant(prompt: string, history: any[] = [], profile?: any) {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, profile }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na resposta do servidor');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    throw error;
  }
}

export async function analyzeFoodImage(base64Image: string, profile?: any, mealType?: string) {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const cleanImage = base64Image.split(',')[1] || base64Image;

    const response = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image: cleanImage, 
        profile, 
        mealType 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na análise da imagem');
    }

    return await response.json();
  } catch (error) {
    console.error("Image Analysis Error:", error);
    throw error;
  }
}
