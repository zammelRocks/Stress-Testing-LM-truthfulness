export const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return JSON.parse(text) as T;
}

export const api = {
  generate: (model_slug: string, prompt: string) =>
    postJSON<{
      id: number;
      output: string;
      prompt?: string;
      model?: string;
      created_at?: string;
    }>(`${API_BASE}/api/inference/generate/`, { model_slug, prompt }),

  evaluateMetrics: (generation_id: number, reference: string) =>
    postJSON<{ evaluation_id: number; metrics: Record<string, number> }>(
      `${API_BASE}/api/evaluate/`,
      { generation_id, reference, metrics: ["bleu", "rouge", "cosine"] }
    ),

  judge: (
    generation_id: number,
    reference: string,
    candidate: string,
    judge_model?: string
  ) =>
    postJSON<{
      correctness: number;
      relevance: number;
      fluency: number;
      overall: number;
    }>(`${API_BASE}/api/evaluate/judge/`, {
      generation_id,
      reference,
      candidate,
      judge_model: judge_model || undefined,
    }),
};
