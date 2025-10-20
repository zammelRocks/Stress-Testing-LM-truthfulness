// src/api.ts - Corrected API client for Django backend
import type { GenerationResp, MetricsResp, JudgeScores, BackendGenerationResp } from "./types";
import type { DatasetUploadResponse } from "./types"; 
import type { InferenceModel, LabelDatasetRequest, LabelDatasetRowResult } from "./types";
import type { JudgeSamplingPayload, JudgeSamplingResponse } from "./types";

export const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

console.log("API_BASE:", API_BASE);
const BASE_URL = "http://127.0.0.1:8000/api";
// Updated paths to match Django URL structure
const PATHS = {
  inference: "/api/inference",
  evaluate: "/api/evaluate",
  generations: "/api/generations", // For listing/retrieving generations
  judge: `${BASE_URL}/judge`,
  
};
const join = (base: string, path: string) =>
  `${API_BASE}${base}${path.startsWith("/") ? path : `/${path}`}`;

console.log("[api] API_BASE:", API_BASE);

export class ApiError extends Error {
  status: number;
  body?: string;
  json?: any;
  constructor(status: number, body?: string, json?: any, message?: string) {
    super(message || `HTTP ${status}`);
    this.status = status;
    this.body = body;
    this.json = json;
  }
}

async function get<T>(
  urlStr: string,
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<T> {
  const url = new URL(urlStr);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    }
  }

  const fullUrl = url.toString();
  console.log("[api][GET]", fullUrl);

  const res = await fetch(fullUrl, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      // Add CORS headers if needed
      "Accept": "application/json",
    },
  });

  console.log("[api][GET][status]", res.status, res.statusText);
  const text = await res.text();
  console.log("[api][GET][text]", text.substring(0, 200) + "...");

  let json: any;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch (e) {
    console.error("[api][GET] JSON parse error:", e);
    throw new ApiError(res.status, text, null, "Invalid JSON response");
  }

  if (!res.ok) {
    const msg =
      json?.detail || json?.error || res.statusText || text || "Request failed";
    throw new ApiError(res.status, text, json, msg);
  }
  return json as T;
}

async function post<T>(urlStr: string, payload: any): Promise<T> {
  console.log("[api][POST]", urlStr, "payload:", payload);

  const res = await fetch(urlStr, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      // Add CORS headers if needed
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log("[api][POST][status]", res.status, res.statusText);
  const text = await res.text();
  console.log("[api][POST][text]", text.substring(0, 200) + "...");

  let json: any;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch (e) {
    console.error("[api][POST] JSON parse error:", e);
    throw new ApiError(res.status, text, null, "Invalid JSON response");
  }

  if (!res.ok) {
    const msg =
      json?.detail || json?.error || res.statusText || text || "Request failed";
    throw new ApiError(res.status, text, json, msg);
  }
  return json as T;
}

/** Convert limit/offset → DRF page/page_size */
function listParamsToDRF(params?: {
  limit?: number;
  offset?: number;
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}) {
  if (!params) return undefined;
  const { limit, offset, page, page_size, search, ordering } = params;

  const out: Record<string, string | number> = {};
  if (typeof page === "number") out.page = page;
  if (typeof page_size === "number") out.page_size = page_size;

  if (typeof limit === "number") out.page_size = limit;
  if (typeof offset === "number" && typeof out.page_size === "number") {
    out.page = Math.floor(offset / (out.page_size as number)) + 1;
  }

  if (search) out.search = search;
  if (ordering) out.ordering = ordering;

  return out;
}

/** Internal: accept any shape and resolve generation id robustly */
function resolveGenerationId(
  obj: any
): number {
  const id =
    obj.id ??
    obj.generation_id ??
    obj.pk ??
    (typeof obj["generation_id"] === "number" ? obj["generation_id"] : undefined);
  if (typeof id !== "number") {
    console.error("[api] Could not resolve generation id from object:", obj);
    throw new Error("Unable to resolve generation id from response");
  }
  return id;
}

/** Internal: best-effort candidate text extraction for judge convenience */
function extractCandidate(
  obj: Partial<GenerationResp> & {
    output?: string;
    text?: string;
    completion?: string;
    response?: string;
    data?: { output?: string; text?: string };
    [k: string]: any;
  }
): string | undefined {
  return (
    obj.output ??
    obj.text ??
    obj.completion ??
    obj.response ??
    obj.data?.output ??
    obj.data?.text ??
    undefined
  );
}

export const api = {
  /** Quick ping to test backend connection */
  testConnection: () =>
    fetch(`${API_BASE}/`).then((res) => {
      console.log("[api] backend ping:", res.status, res.statusText);
      return res;
    }),

  /** -------- Inference (Generation) -------- */

  /** POST /api/inference/generate/ */
  generate: (model_slug: string, prompt: string) =>
    post<GenerationResp>(join(PATHS.inference, "/generate/"), {
      model_slug,
      prompt,
    }),

  /** GET /api/generations/<id>/ - Get specific generation */
  getGeneration: async (id: number): Promise<GenerationResp> => {
    const backendResp = await get<BackendGenerationResp>(join(PATHS.generations, `/${id}/`));
    // Normalize the backend response to frontend format
    return {
      id: backendResp.generation_id,
      generation_id: backendResp.generation_id,
      output: backendResp.output,
      prompt: backendResp.prompt,
      model: backendResp.model_slug,
      model_slug: backendResp.model_slug,
      created_at: backendResp.created_at
    };
  },

  /** GET /api/generations/ - List all generations */
  getGenerations: async (params?: {
    limit?: number;
    offset?: number;
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next?: string | null;
    previous?: string | null;
    results: GenerationResp[];
  }> => {
    const response = await get<{
      count: number;
      next?: string | null;
      previous?: string | null;
      results: BackendGenerationResp[];
    }>(join(PATHS.generations, "/"), listParamsToDRF(params));
    
    // Normalize all results to frontend format
    return {
      ...response,
      results: response.results.map(backendGen => ({
        id: backendGen.generation_id,
        generation_id: backendGen.generation_id,
        output: backendGen.output,
        prompt: backendGen.prompt,
        model: backendGen.model_slug,
        model_slug: backendGen.model_slug,
        created_at: backendGen.created_at
      }))
    };
  },

  /** Convenience: generate and just return the numeric generation id */
  generateAndReturnId: async (model_slug: string, prompt: string) => {
    const gen = await api.generate(model_slug, prompt);
    return resolveGenerationId(gen as any);
  },

  /** -------- Classic metrics -------- */

  /** POST /api/evaluate/ (EvaluateView) */
  evaluateMetrics: (generation_id: number, reference: string) =>
    post<MetricsResp>(join(PATHS.evaluate, "/"), {
      generation_id,
      reference,
      metrics: ["bleu", "rouge", "cosine"],
    }),

  /** Overload: accept id or generation object */
  evaluateByGeneration: async (
    genOrId: number | GenerationResp,
    reference: string
  ) => {
    const id =
      typeof genOrId === "number"
        ? genOrId
        : resolveGenerationId(genOrId as any);
    return api.evaluateMetrics(id, reference);
  },

  /** -------- Judge (LLM-as-a-judge) -------- */

  /** POST /api/evaluate/judge/ */
  judge: (
    generation_id: number,
    reference: string,
    candidate?: string,
    judge_model?: string
  ) =>
    post<JudgeScores>(join(PATHS.evaluate, "/judge/"), {
      generation_id,
      reference,
      candidate: candidate || undefined, // Backend will load from DB if omitted
      judge_model: judge_model || undefined,
    }),

  /** Overload: accept id or generation object; auto-fill candidate when available */
  judgeByGeneration: async (
    genOrId: number | GenerationResp,
    reference: string,
    judge_model?: string
  ) => {
    const isNumber = typeof genOrId === "number";
    const id = isNumber ? (genOrId as number) : resolveGenerationId(genOrId as any);
    const candidate = isNumber ? undefined : extractCandidate(genOrId as any);
    return api.judge(id, reference, candidate, judge_model);
  },

  /** -------- One-shot pipeline: generate → metrics → judge -------- */
  generateThenScore: async (args: {
    model_slug: string;
    prompt: string;
    reference: string;
    judge_model?: string;
  }): Promise<{
    generationId: number;
    generation: GenerationResp;
    metrics: MetricsResp;
    judge: JudgeScores;
  }> => {
    const { model_slug, prompt, reference, judge_model } = args;

    console.log("[api] Starting generate-then-score pipeline...");
    
    // Step 1: Generate
    const generation = await api.generate(model_slug, prompt);
    const generationId = resolveGenerationId(generation as any);
    const candidate = extractCandidate(generation as any);

    console.log("[api] Generated text, ID:", generationId);

    // Step 2: Parallelize metrics and judge evaluation
    const [metrics, judge] = await Promise.all([
      api.evaluateMetrics(generationId, reference),
      api.judge(generationId, reference, candidate, judge_model),
    ]);

    console.log("[api] Pipeline complete");

    return { generationId, generation, metrics, judge };
  },

  /** -------- Dataset ingestion -------- */uploadDataset: async (file: File, name?: string): Promise<DatasetUploadResponse> => {
    const form = new FormData();
    form.append("file", file);
    if (name) form.append("name", name);

    const url = `${API_BASE}/api/datasets/upload/`;
    console.log("[api][uploadDataset][POST]", url, file.name);

    const res = await fetch(url, { method: "POST", body: form });
    const text = await res.text();
    console.log("[api][uploadDataset][status]", res.status, res.statusText);

    let json: any;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch (e) {
      console.error("[api][uploadDataset] JSON parse error:", e);
      throw new ApiError(res.status, text, null, "Invalid JSON response");
    }

    if (!res.ok) {
      const msg = json?.detail || json?.error || res.statusText || text;
      throw new ApiError(res.status, text, json, msg);
    }

    return json as DatasetUploadResponse;
  },

  /** GET /api/datasets/ */
  listDatasets: () => get(`${API_BASE}/api/datasets/`),

  /** GET /api/datasets/<id>/ */
  getDataset: (id: number) => get(`${API_BASE}/api/datasets/${id}/`),

  /** GET /api/datasets/<id>/rows/ */
  getDatasetRows: (id: number, params?: { limit?: number; offset?: number }) =>
    get(`${API_BASE}/api/datasets/${id}/rows/`, params),
    
  listInferenceModels: async (): Promise<InferenceModel[]> => {
      const url = `${API_BASE}/api/models/`;
      console.log("[api][GET]", url);
      const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
      console.log("[api][GET][status]", res.status, res.statusText);
      const text = await res.text();
      console.log("[api][GET][text]", (text || "").slice(0, 200) + "...");
      let json: any = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const msg = json?.detail || json?.error || res.statusText || text || "Request failed";
        throw new ApiError(res.status, text, json, msg);
      }
      return (json ?? []) as InferenceModel[];
    },

  /** POST /api/inference/label_dataset/ → JSON (optional, good for previews) */
  labelDatasetJSON: async (args: LabelDatasetRequest): Promise<LabelDatasetRowResult[]> => {
    const url = `${API_BASE}/api/inference/label_dataset/`;
    const payload = { ...args, format: "json" };
    console.log("[api][POST][labelDatasetJSON]", url, payload);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let json: any;
    try { json = text ? JSON.parse(text) : undefined; } catch {}
    if (!res.ok) {
      const msg = json?.detail || json?.error || res.statusText || text || "Request failed";
      throw new ApiError(res.status, text, json, msg);
    }
    return json as LabelDatasetRowResult[];
  },

  /** POST /api/inference/label_dataset/ → CSV download */
  downloadLabeledDatasetCSV: async (
    args: LabelDatasetRequest & { filename?: string }
  ): Promise<void> => {
    const { filename, ...rest } = args;
    const url = `${API_BASE}/api/inference/label_dataset/`;
    const payload = { ...rest, format: "csv" };
    console.log("[api][POST][downloadLabeledDatasetCSV]", url, payload);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Accept ANY content so JSON errors are allowed (prevents 406)
        "Accept": "*/*",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(res.status, text, undefined, text || res.statusText);
    }

    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;

    const disp = res.headers.get("Content-Disposition") || "";
    const match = /filename="([^"]+)"/.exec(disp);
    a.download = filename || match?.[1] || "labels.csv";

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  },
  /** POST /api/evaluate/ with raw candidate + reference */
  evaluateTextMetrics: (candidate: string, reference: string) =>
    post<MetricsResp>(join(PATHS.evaluate, "/"), {
      candidate,
      reference,
     metrics: ["bleu", "rouge", "cosine"],
  }),

  evaluateJudgeSampling: async (
  payload: JudgeSamplingPayload
  ): Promise<JudgeSamplingResponse> =>
  post<JudgeSamplingResponse>(`${PATHS.judge}/evaluate/`, payload),

  





  


};