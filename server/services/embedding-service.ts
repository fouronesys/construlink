import { HfInference } from '@huggingface/inference';

const hf = new HfInference();

const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text,
    });

    if (Array.isArray(result)) {
      if (result.length > 0 && Array.isArray(result[0])) {
        return result[0] as number[];
      }
      return result as number[];
    }
    
    return [];
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function generateSupplierEmbedding(
  legalName: string,
  description: string | null,
  specialties: string[],
  location: string | null
): Promise<number[]> {
  const parts = [
    legalName,
    description || '',
    specialties.join(' '),
    location || '',
  ].filter(Boolean);

  const searchText = parts.join(' ');
  return generateEmbedding(searchText);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
