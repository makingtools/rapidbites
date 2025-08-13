
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "Un nombre creativo y apetitoso para el plato especial."
    },
    description: {
      type: Type.STRING,
      description: "Una descripción breve y tentadora del plato, máximo 20 palabras."
    },
    price: {
      type: Type.STRING,
      description: "Un precio para el plato, formateado como '$XX.XXX' para pesos colombianos. Ejemplo: '$28.500'."
    }
  },
  required: ["name", "description", "price"]
};


export const fetchDailySpecial = async (): Promise<{name: string, description: string, price: string}> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Sugiere un plato especial del día para un restaurante de comida rápida colombiano llamado 'RapidBites'. Debe ser algo típico y llamativo, como una arepa especial o una hamburguesa con un toque local.",
      config: {
        systemInstruction: "Eres un chef creativo experto en comida rápida colombiana. Tu objetivo es crear un plato especial del día que sea único, delicioso y suene irresistible. Responde únicamente con el objeto JSON solicitado.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      }
    });

    const text = response.text.trim();
    if (!text) {
        throw new Error("Received an empty response from the AI.");
    }
    
    // Parse the JSON string from the response
    const parsedResponse = JSON.parse(text);

    if (parsedResponse.name && parsedResponse.description && parsedResponse.price) {
        return parsedResponse;
    } else {
        throw new Error("AI response is missing required fields.");
    }

  } catch (error) {
    console.error("Error fetching daily special from Gemini API:", error);
    throw new Error("Failed to communicate with the Chef AI. Please try again later.");
  }
};