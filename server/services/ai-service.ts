import OpenAI from "openai";

/**
 * AI Service using DeepSeek API
 * DeepSeek uses OpenAI-compatible API
 */

// DeepSeek client - compatible with OpenAI SDK
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

// DeepSeek models
const DEEPSEEK_CHAT_MODEL = "deepseek-chat"; // Main model for chat and reasoning
const DEEPSEEK_REASONER_MODEL = "deepseek-reasoner"; // For complex reasoning tasks

export interface AISearchQuery {
  query: string;
  context?: {
    specialty?: string;
    location?: string;
    previousResults?: any[];
  };
}

export interface AISearchResult {
  extractedFilters: {
    specialty?: string;
    location?: string;
    keywords?: string[];
    requirements?: string[];
  };
  enhancedQuery: string;
  suggestions?: string[];
}

/**
 * Parse natural language search query and extract structured filters
 */
export async function parseNaturalLanguageSearch(
  query: string
): Promise<AISearchResult> {
  try {
    const prompt = `Eres un asistente que ayuda a extraer información de búsqueda de construcción.
Analiza la siguiente consulta de búsqueda y extrae:
1. specialty: tipo de proveedor/servicio buscado (electricista, plomero, constructor, materiales, etc.)
2. location: ubicación mencionada (Santo Domingo, Santiago, etc.)
3. keywords: palabras clave importantes
4. requirements: requisitos específicos mencionados (certificado, con experiencia, etc.)

Consulta: "${query}"

Responde SOLO con un JSON válido en este formato:
{
  "specialty": "string o null",
  "location": "string o null", 
  "keywords": ["array de strings"],
  "requirements": ["array de strings"],
  "enhancedQuery": "versión mejorada de la búsqueda original",
  "suggestions": ["array de sugerencias relacionadas"]
}`;

    const response = await deepseek.chat.completions.create({
      model: DEEPSEEK_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: "Eres un experto en construcción que ayuda a procesar búsquedas. Siempre responde con JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      extractedFilters: {
        specialty: result.specialty || undefined,
        location: result.location || undefined,
        keywords: result.keywords || [],
        requirements: result.requirements || [],
      },
      enhancedQuery: result.enhancedQuery || query,
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error("Error parsing natural language search:", error);
    // Fallback: return original query
    return {
      extractedFilters: {
        keywords: [query],
      },
      enhancedQuery: query,
    };
  }
}

/**
 * Generate search suggestions based on partial input
 */
export async function generateSearchSuggestions(
  partialQuery: string,
  availableSpecialties: string[]
): Promise<string[]> {
  try {
    const prompt = `Genera 5 sugerencias de búsqueda relevantes para un directorio de construcción.
    
Input parcial del usuario: "${partialQuery}"
Especialidades disponibles: ${availableSpecialties.join(", ")}

Genera sugerencias completas y útiles que el usuario podría querer buscar.
Responde SOLO con un JSON válido en formato: { "suggestions": ["sugerencia1", "sugerencia2", ...] }`;

    const response = await deepseek.chat.completions.create({
      model: DEEPSEEK_CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.suggestions || [];
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}

/**
 * Enhance supplier search results with AI ranking
 */
export async function rankSearchResults(
  query: string,
  suppliers: any[]
): Promise<any[]> {
  if (suppliers.length === 0) return suppliers;

  try {
    // For now, return original order
    // In future phases, we can implement semantic ranking
    return suppliers;
  } catch (error) {
    console.error("Error ranking results:", error);
    return suppliers;
  }
}

/**
 * Test DeepSeek connection
 */
export async function testAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await deepseek.chat.completions.create({
      model: DEEPSEEK_CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: "Responde con: Conexión exitosa",
        },
      ],
      max_tokens: 20,
    });

    return {
      success: true,
      message: response.choices[0].message.content || "Conectado",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error de conexión",
    };
  }
}
