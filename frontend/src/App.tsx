import { useMemo, useState, useEffect } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Judge Playground — React UI
 *
 * Backend endpoints assumed:
 *  - POST /api/inference/generate/ { model_slug, prompt } -> { id, output, ... }
 *  - POST /api/evaluate/ { generation_id, reference, metrics: ["bleu","rouge","cosine"] } -> { evaluation_id, metrics:{...} }
 *  - POST /api/evaluate/judge/ { generation_id, reference, candidate?, judge_model? } -> { correctness, relevance, fluency, overall }
 *
 * Configure the backend URL via VITE_API_BASE_URL (defaults to http://127.0.0.1:8000).
 */

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// --- Types ---
interface GenerationResp {
  id: number;
  output: string;
  prompt?: string;
  model?: string;
  created_at?: string;
}

interface JudgeScores {
  correctness: number;
  relevance: number;
  fluency: number;
  overall: number;
}

interface MetricsMap {
  bleu?: number;
  rouge1?: number;
  rougeL?: number;
  cosine?: number;
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${text}`);
  }
  return JSON.parse(text) as T;
}

export default function App() {
  // Inputs
  const [task, setTask] = useState("Write a haiku about autumn.");
  const [reference, setReference] = useState("Golden leaves and crisp air—keep it 3/5/3 or 5/7/5.");
  const [modelSlug, setModelSlug] = useState("mistral:7b");      // default to a local Ollama model
  const [judgeModel, setJudgeModel] = useState("mistral:7b");    // Ollama judge

  // Results
  const [generation, setGeneration] = useState<GenerationResp | null>(null);
  const [candidate, setCandidate] = useState<string>("");
  const [judgeScores, setJudgeScores] = useState<JudgeScores | null>(null);
  const [metrics, setMetrics] = useState<MetricsMap | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [busyGenerate, setBusyGenerate] = useState(false);
  const [busyEval, setBusyEval] = useState(false);

  // Seed candidate textarea with the last generation
  useEffect(() => {
    if (generation?.output) setCandidate(generation.output);
  }, [generation?.id]);

  // Can run judge if we have a generation + non-empty reference + some candidate text
  const canJudge = useMemo(
    () => !!generation?.id && !!reference.trim() && !!(candidate ?? "").trim(),
    [generation, reference, candidate]
  );

  async function handleGenerate() {
    setBusyGenerate(true);
    setError(null);
    setJudgeScores(null);
    setMetrics(null);
    setGeneration(null);
    setCandidate("");

    try {
      const data = await postJSON<GenerationResp>(`${API_BASE}/api/inference/generate/`, {
        model_slug: modelSlug,
        prompt: task,
      });
      setGeneration(data);
      setCandidate(data.output || "");
    } catch (e: any) {
      setError(`Generate failed: ${e?.message || String(e)}`);
    } finally {
      setBusyGenerate(false);
    }
  }

  async function handleEvaluateAll() {
    if (!generation) return;
    setBusyEval(true);
    setError(null);
    setJudgeScores(null);
    setMetrics(null);

    try {
      // Run classic metrics (BLEU/ROUGE/Cosine) and judge in parallel
      const metricsPromise = postJSON<{ evaluation_id: number; metrics: MetricsMap }>(
        `${API_BASE}/api/evaluate/`,
        {
          generation_id: generation.id,
          reference,
          metrics: ["bleu", "rouge", "cosine"],
        }
      );

      const judgePromise = postJSON<JudgeScores>(`${API_BASE}/api/evaluate/judge/`, {
        generation_id: generation.id,
        reference,
        candidate,                 // optional; if omitted, backend uses gen.output
        judge_model: judgeModel || undefined,
      });

      const [metricsResp, judgeResp] = await Promise.all([metricsPromise, judgePromise]);
      setMetrics(metricsResp.metrics || null);
      setJudgeScores(judgeResp || null);
    } catch (e: any) {
      setError(`Evaluation failed: ${e?.message || String(e)}`);
    } finally {
      setBusyEval(false);
    }
  }

  return (
    <div className="ai-app">
      {/* Background */}
      <div className="ai-background">
        <div className="neural-network">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className={`neural-node node-${i % 5}`} />
          ))}
        </div>
      </div>

      {/* Header */}
      <nav className="navbar navbar-expand-lg ai-navbar sticky-top">
        <div className="container-fluid">
          <div className="navbar-brand d-flex align-items-center">
            <div className="ai-logo me-3">
              <div className="logo-core">
                <div className="logo-ring"></div>
                <div className="logo-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="mb-0 fw-bold text-white">Judge Playground</h1>
              <small className="text-light opacity-75">AI Model Evaluation Suite</small>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <span className="badge bg-light text-dark me-2">
              {busyGenerate || busyEval ? "Working…" : "Ready"}
            </span>
            <small className="text-light opacity-75">{API_BASE}</small>
          </div>
        </div>
      </nav>

      <main className="container-fluid py-4">
        <div className="row g-4 max-width-container mx-auto">

          {/* Task Generation */}
          <div className="col-12">
            <div className="ai-card h-100">
              <div className="ai-card-header">
                <div className="d-flex align-items-center">
                  <div className="ai-icon me-3">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 text-white">Task Generation</h5>
                    <small className="text-light opacity-75">Configure your model and prompt</small>
                  </div>
                </div>
              </div>

              <div className="ai-card-body">
                <div className="row g-4">
                  <div className="col-lg-8">
                    <label className="form-label ai-label">
                      <i className="fas fa-edit me-2"></i>Task Prompt
                    </label>
                    <textarea
                      className="form-control ai-input"
                      rows={4}
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="Describe what the model should generate..."
                    />
                  </div>
                  <div className="col-lg-4">
                    <label className="form-label ai-label">
                      <i className="fas fa-cog me-2"></i>Model (Ollama / registry slug)
                    </label>
                    <input
                      className="form-control ai-input mb-3"
                      value={modelSlug}
                      onChange={(e) => setModelSlug(e.target.value)}
                      placeholder="e.g. mistral:7b"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={busyGenerate || !task.trim() || !modelSlug.trim()}
                      className="btn ai-btn-primary w-100"
                    >
                      {busyGenerate ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play me-2"></i>
                          Generate Response
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="col-12 col-xl-6">
            <div className="ai-card h-100">
              <div className="ai-card-header">
                <div className="d-flex align-items-center">
                  <div className="ai-icon me-3">
                    <i className="fas fa-star"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 text-white">Reference Answer</h5>
                    <small className="text-light opacity-75">Gold standard for comparison</small>
                  </div>
                </div>
              </div>

              <div className="ai-card-body">
                <textarea
                  className="form-control ai-input"
                  rows={6}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Paste your reference/gold standard answer here..."
                />
              </div>
            </div>
          </div>

          {/* Candidate */}
          <div className="col-12 col-xl-6">
            <div className="ai-card h-100">
              <div className="ai-card-header">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="ai-icon me-3">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <div>
                      <h5 className="mb-1 text-white">Generated Candidate</h5>
                      <small className="text-light opacity-75">You can edit before judging</small>
                    </div>
                  </div>
                  {generation?.id && <span className="badge bg-success">ID: {generation.id}</span>}
                </div>
              </div>

              <div className="ai-card-body">
                <textarea
                  className="form-control ai-input"
                  rows={6}
                  value={candidate}
                  onChange={(e) => setCandidate(e.target.value)}
                  placeholder="Generated content will appear here - edit as needed..."
                />
              </div>
            </div>
          </div>

          {/* Evaluation */}
          <div className="col-12">
            <div className="ai-card">
              <div className="ai-card-header">
                <div className="d-flex align-items-center">
                  <div className="ai-icon me-3">
                    <i className="fas fa-gavel"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 text-white">Evaluate</h5>
                    <small className="text-light opacity-75">
                      Runs BLEU/ROUGE/Cosine + LLM Judge
                    </small>
                  </div>
                </div>
              </div>

              <div className="ai-card-body">
                <div className="row g-4 mb-4">
                  <div className="col-lg-8">
                    <label className="form-label ai-label">
                      <i className="fas fa-brain me-2"></i>Judge Model (Ollama)
                    </label>
                    <input
                      className="form-control ai-input"
                      value={judgeModel}
                      onChange={(e) => setJudgeModel(e.target.value)}
                      placeholder="mistral:7b"
                    />
                    <small className="text-muted d-block mt-1">
                      Tip: Metrics use the saved generation output; judge can use the edited candidate above.
                    </small>
                  </div>
                  <div className="col-lg-4 d-flex align-items-end">
                    <button
                      onClick={handleEvaluateAll}
                      disabled={!canJudge || busyEval}
                      className="btn ai-btn-success w-100"
                    >
                      {busyEval ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle me-2"></i>
                          Run Evaluation
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Judge Scores (0–10) */}
                <div className="row g-4 mb-4">
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Correctness" value={judgeScores?.correctness} icon="fas fa-check" />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Relevance" value={judgeScores?.relevance} icon="fas fa-bullseye" />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Fluency" value={judgeScores?.fluency} icon="fas fa-language" />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Overall" value={judgeScores?.overall} icon="fas fa-trophy" emphasize />
                  </div>
                </div>

                {/* Metrics (0–1) */}
                <div className="row g-4">
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="BLEU" value={metrics?.bleu ?? null} icon="fas fa-code" max={1} />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="ROUGE-1" value={metrics?.rouge1 ?? null} icon="fas fa-ruler" max={1} />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="ROUGE-L" value={metrics?.rougeL ?? null} icon="fas fa-ruler-vertical" max={1} />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Cosine" value={metrics?.cosine ?? null} icon="fas fa-vector-square" max={1} />
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger mt-4 ai-alert" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-5 py-4">
          <div className="ai-footer-content">
            <p className="mb-2 text-light">
              <i className="fas fa-info-circle me-2"></i>
              Having CORS issues? Add your React origin to Django (e.g. with <code>django-cors-headers</code>) and set{" "}
              <code className="mx-2 px-2 py-1 bg-dark rounded">VITE_API_BASE_URL</code>
            </p>
            <small className="text-light opacity-75">Judge Playground — AI Model Evaluation Platform</small>
          </div>
        </footer>
      </main>
    </div>
  );
}

/** Generic score card:
 * - Judge scores: default max=10, 1 decimal
 * - Metrics (BLEU/ROUGE/Cosine): pass max={1}, show up to 3 decimals
 */
function ScoreCard({
  label,
  value,
  icon,
  emphasize,
  max = 10,
}: {
  label: string;
  value?: number | null;
  icon: string;
  emphasize?: boolean;
  max?: number;
}) {
  const v = typeof value === "number" ? value : null;
  const clamped = v === null ? 0 : Math.max(0, Math.min(max, v));
  const percentage = v === null ? 0 : (clamped / max) * 100;

  const scoreColor =
    percentage >= 80 ? "success" : percentage >= 60 ? "warning" : percentage >= 40 ? "info" : "danger";

  const display =
    v === null ? "–" : max === 1 ? trimTrailingZeros(v.toFixed(3)) : v.toFixed(1);

  return (
    <div className={`ai-score-card ${emphasize ? "ai-score-card-emphasis" : ""}`}>
      <div className="d-flex align-items-center mb-3">
        <div className={`ai-score-icon me-2 ${emphasize ? "text-warning" : "text-light"}`}>
          <i className={icon}></i>
        </div>
        <small className="ai-score-label">{label}</small>
      </div>

      <div className="ai-score-value mb-3">
        <span className={`display-6 fw-bold ${emphasize ? "text-warning" : "text-light"}`}>{display}</span>
        <small className="text-muted ms-1">/ {max}</small>
      </div>

      <div className="ai-progress-container">
        <div className="ai-progress-bar">
          <div
            className={`ai-progress-fill ${emphasize ? "ai-progress-emphasis" : `ai-progress-${scoreColor}`}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="ai-progress-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function trimTrailingZeros(s: string) {
  return s.replace(/0+$/g, "").replace(/\.$/, "");
}
