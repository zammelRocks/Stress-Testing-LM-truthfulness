export interface GenerationResp {
  id: number;
  output: string;
  prompt?: string;
  model?: string;
  created_at?: string;
}

export interface JudgeScores {
  correctness: number;
  relevance: number;
  fluency: number;
  overall: number;
}

export interface MetricsMap {
  bleu?: number;
  rouge1?: number;
  rougeL?: number;
  cosine?: number;
}
