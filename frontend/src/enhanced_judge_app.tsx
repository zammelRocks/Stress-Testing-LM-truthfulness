import { useMemo, useState, useEffect } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Judge Playground — React UI
 *
 * Backend endpoints assumed:
 *  - POST /api/inference/generate/ { model_slug, prompt } -> { id, output, ... }
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

export default function App() {
  // Inputs
  const [task, setTask] = useState("Write a haiku about autumn.");
  const [reference, setReference] = useState("Write a haiku about autumn.");
  const [modelSlug, setModelSlug] = useState("mistral:7b");
  const [judgeModel, setJudgeModel] = useState("mistral:7b");

  // Results
  const [generation, setGeneration] = useState<GenerationResp | null>(null);
  const [candidate, setCandidate] = useState<string>("");
  const [scores, setScores] = useState<JudgeScores | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Seed candidate textarea with the last generation
  useEffect(() => {
    if (generation?.output) setCandidate(generation.output);
  }, [generation?.id]);

  const canJudge = useMemo(
    () => !!generation?.id && !!reference.trim() && !!(candidate ?? "").trim(),
    [generation, reference, candidate]
  );

  async function handleGenerate() {
    setBusy(true);
    setRawError(null);
    setScores(null);
    setGeneration(null);
    setCandidate("");
    try {
      const res = await fetch(`${API_BASE}/api/inference/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_slug: modelSlug, prompt: task }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Generate failed: ${res.status} ${text}`);
      }
      const data: GenerationResp = await res.json();
      setGeneration(data);
      setCandidate(data.output || "");
    } catch (e: any) {
      setRawError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleJudge() {
    if (!generation) return;
    setBusy(true);
    setRawError(null);
    setScores(null);
    try {
      const res = await fetch(`${API_BASE}/api/evaluate/judge/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation_id: generation.id,
          reference,
          candidate,
          judge_model: judgeModel || undefined,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`Judge failed: ${res.status} ${text}`);
      const data = JSON.parse(text);
      setScores(data as JudgeScores);
    } catch (e: any) {
      setRawError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-app">
      {/* Animated Background */}
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
            <span className="badge bg-light text-dark me-2">API Connected</span>
            <small className="text-light opacity-75">{API_BASE}</small>
          </div>
        </div>
      </nav>

      <main className="container-fluid py-4">
        <div className="row g-4 max-width-container mx-auto">
          
          {/* Task Generation Section */}
          <div className="col-12">
            <div className="ai-card h-100">
              <div className="ai-card-header">
                <div className="d-flex align-items-center">
                  <div className="ai-icon me-3">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 text-white">Task Generation</h5>
                    <small className="text-light opacity-75">Configure your AI model and prompt</small>
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
                      placeholder="Describe what the AI model should generate..."
                    />
                  </div>
                  <div className="col-lg-4">
                    <label className="form-label ai-label">
                      <i className="fas fa-cog me-2"></i>Model Configuration
                    </label>
                    <input
                      className="form-control ai-input mb-3"
                      value={modelSlug}
                      onChange={(e) => setModelSlug(e.target.value)}
                      placeholder="e.g. mistral:7b"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={busy || !task.trim() || !modelSlug.trim()}
                      className="btn ai-btn-primary w-100"
                    >
                      {busy ? (
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

          {/* Reference Section */}
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

          {/* Candidate Section */}
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
                      <small className="text-light opacity-75">Editable AI response</small>
                    </div>
                  </div>
                  {generation?.id && (
                    <span className="badge bg-success">
                      ID: {generation.id}
                    </span>
                  )}
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

          {/* Judge Section */}
          <div className="col-12">
            <div className="ai-card">
              <div className="ai-card-header">
                <div className="d-flex align-items-center">
                  <div className="ai-icon me-3">
                    <i className="fas fa-gavel"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 text-white">AI Judge Evaluation</h5>
                    <small className="text-light opacity-75">Automated quality assessment</small>
                  </div>
                </div>
              </div>
              
              <div className="ai-card-body">
                <div className="row g-4 mb-4">
                  <div className="col-lg-8">
                    <label className="form-label ai-label">
                      <i className="fas fa-brain me-2"></i>Judge Model
                    </label>
                    <input
                      className="form-control ai-input"
                      value={judgeModel}
                      onChange={(e) => setJudgeModel(e.target.value)}
                      placeholder="mistral:7b"
                    />
                  </div>
                  <div className="col-lg-4 d-flex align-items-end">
                    <button
                      onClick={handleJudge}
                      disabled={!canJudge || busy}
                      className="btn ai-btn-success w-100"
                    >
                      {busy ? (
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

                {/* Score Cards */}
                <div className="row g-4">
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Correctness" value={scores?.correctness} icon="fas fa-check" />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Relevance" value={scores?.relevance} icon="fas fa-bullseye" />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Fluency" value={scores?.fluency} icon="fas fa-language" />
                  </div>
                  <div className="col-6 col-lg-3">
                    <ScoreCard label="Overall" value={scores?.overall} icon="fas fa-trophy" emphasize />
                  </div>
                </div>

                {rawError && (
                  <div className="alert alert-danger mt-4 ai-alert" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> {rawError}
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
              Having CORS issues? Configure django-cors-headers and set 
              <code className="mx-2 px-2 py-1 bg-dark rounded">VITE_API_BASE_URL</code>
            </p>
            <small className="text-light opacity-75">
              Judge Playground - AI Model Evaluation Platform
            </small>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ScoreCard({ 
  label, 
  value, 
  icon,
  emphasize 
}: { 
  label: string; 
  value?: number | null; 
  icon: string;
  emphasize?: boolean; 
}) {
  const percentage = typeof value === "number" ? Math.max(0, Math.min(10, value)) * 10 : 0;
  const scoreColor = percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : percentage >= 40 ? 'info' : 'danger';
  
  return (
    <div className={`ai-score-card ${emphasize ? 'ai-score-card-emphasis' : ''}`}>
      <div className="d-flex align-items-center mb-3">
        <div className={`ai-score-icon me-2 ${emphasize ? 'text-warning' : 'text-light'}`}>
          <i className={icon}></i>
        </div>
        <small className="ai-score-label">{label}</small>
      </div>
      
      <div className="ai-score-value mb-3">
        <span className={`display-6 fw-bold ${emphasize ? 'text-warning' : 'text-light'}`}>
          {typeof value === "number" ? value.toFixed(1) : "–"}
        </span>
        <small className="text-muted ms-1">/ 10</small>
      </div>
      
      <div className="ai-progress-container">
        <div className="ai-progress-bar">
          <div 
            className={`ai-progress-fill ${emphasize ? 'ai-progress-emphasis' : `ai-progress-${scoreColor}`}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="ai-progress-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
}