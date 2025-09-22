// src/types.ts - Updated to handle both frontend and backend formats
export interface GenerationResp {
  // Support both formats: frontend expects 'id', backend returns 'generation_id'
  id?: number;
  generation_id?: number;
  output: string;
  prompt?: string;
  model?: string;
  model_slug?: string; // Backend uses 'model_slug' instead of 'model'
  created_at?: string;
}

export interface MetricsResp {
  evaluation_id: number;
  metrics: {
    bleu?: number;
    rouge1?: number;
    rougeL?: number;
    cosine?: number;
    [k: string]: number | undefined;
  };
}

export interface JudgeScores {
  correctness: number;
  relevance: number;
  fluency: number;
  overall: number;
}

// Helper type for API responses that may have either format
export interface BackendGenerationResp {
  generation_id: number;
  prompt: string;
  output: string;
  model_slug: string;
  created_at: string;
}

// Utility function to normalize generation response
export function normalizeGeneration(gen: BackendGenerationResp | GenerationResp): GenerationResp {
  const backendGen = gen as BackendGenerationResp;
  const frontendGen = gen as GenerationResp;
  
  return {
    id: frontendGen.id ?? backendGen.generation_id,
    generation_id: backendGen.generation_id ?? frontendGen.id,
    output: gen.output,
    prompt: gen.prompt,
    model: frontendGen.model ?? backendGen.model_slug,
    model_slug: backendGen.model_slug ?? frontendGen.model,
    created_at: gen.created_at
  };
}

export type DatasetKind = 'csv' | 'json' | 'jsonl' | 'ndjson';
// ---- Models shown in the dropdown
export interface InferenceModel {
  slug: string;
  repo_id: string;
  backend: string;        // "ollama" for the ones we use here
  is_active: boolean;
  display_name?: string;
}

// ---- Upload response (dataset.id is REQUIRED)
export interface DatasetUploadResponse {
  dataset: {
    id: number;
    name: string;
    kind: string;         // "csv" | "json" | etc.
    row_count: number;
    uploaded_at: string;  // ISO string
  };
  inserted: number;
  sample: Array<{ claim: string; reference: string; label: string }>;
}

// ---- Request shape to label a dataset
export interface LabelDatasetRequest {
  dataset_id: number;
  model_slug?: string;
  limit?: number;
  offset?: number;
  max_rows?: number;
}

// ---- Optional JSON result shape if you use the preview API
export interface LabelDatasetRowResult {
  row_id: number | null;
  claim: string;
  reference: string;
  gold_label: string;
  pred_label: string;
  justification: string;
  model_slug: string;
  latency_ms: number | string;
}

