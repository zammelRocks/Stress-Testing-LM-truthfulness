// src/components/JudgePanel.tsx - Corrected to properly use generation ID and reference
import { useState, useEffect } from "react";
import { api, ApiError } from "../api";
import type { JudgeScores } from "../types";

interface Props {
  generationId?: number | null;
  reference: string;
  defaultJudgeModel?: string;
}

// Type guard function to validate JudgeScores
function isJudgeScores(obj: unknown): obj is JudgeScores {
  if (!obj || typeof obj !== 'object') return false;
  const scores = obj as Record<string, unknown>;
  
  // Check if all required properties exist and are numbers
  const requiredFields = ['correctness', 'relevance', 'fluency', 'overall'];
  return requiredFields.every(field => 
    field in scores && typeof scores[field] === 'number'
  );
}

export default function JudgePanel({ generationId, reference, defaultJudgeModel = "mistral:7b" }: Props) {
  const [judgeModel, setJudgeModel] = useState(defaultJudgeModel);
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState<JudgeScores | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);

  // Clear scores when generation changes
  useEffect(() => {
    setScores(null);
    setErr(null);
    setDetail(null);
  }, [generationId]);

  async function run() {
    if (!generationId) {
      setErr("No generation selected. Please generate text first.");
      return;
    }
    if (!reference.trim()) {
      setErr("Reference text is required for evaluation.");
      return;
    }
    
    setBusy(true);
    setErr(null); 
    setDetail(null); 
    setScores(null);
    
    console.log('Judge evaluation starting:', { generationId, reference: reference.substring(0, 50) + '...', judgeModel });
    
    try {
      // Use the corrected API call with proper parameter order
      const json = await api.judge(generationId, reference, undefined, judgeModel);
      
      console.log('Judge response:', json);
      
      if (!isJudgeScores(json)) {
        const jsonString = JSON.stringify(json);
        throw new Error(`Invalid judge response format: ${jsonString}`);
      }
      
      setScores(json);
    } catch (e: any) {
      console.error('Judge evaluation error:', e);
      
      if (e instanceof ApiError) {
        const msg = `Judge evaluation failed (HTTP ${e.status}): ${e.message}`;
        setErr(msg);
        setDetail(e.json || e.body || null);
      } else {
        const msg = `Judge evaluation failed: ${e?.message || "Unknown error"}`;
        setErr(msg);
        setDetail(e?.json ?? e?.body ?? null);
      }
    } finally {
      setBusy(false);
    }
  }

  const getPercentage = (v?: number | null): number => {
    if (typeof v !== "number") return 0;
    const clampedValue = v < 0 ? 0 : v > 10 ? 10 : v;
    return clampedValue * 10;
  };

  const canRun = !!generationId && !!reference.trim() && !busy;

  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center">
          <div className="ai-icon me-3"><i className="fas fa-gavel" /></div>
          <div>
            <h5 className="mb-1 text-white">AI Judge</h5>
            <small className="text-light opacity-75">
              LLM-as-a-Judge using generation #{generationId || "None"}
            </small>
          </div>
        </div>
      </div>

      <div className="ai-card-body">
        <div className="row g-3 mb-3">
          <div className="col-lg-9">
            <label className="form-label ai-label">
              <i className="fas fa-brain me-2" />Judge Model
            </label>
            <input
              className="form-control ai-input"
              value={judgeModel}
              onChange={(e) => setJudgeModel(e.target.value)}
              placeholder="mistral:7b"
              disabled={busy}
            />
          </div>
          <div className="col-lg-3 d-flex align-items-end">
            <button
              className="btn ai-btn-success w-100"
              onClick={run}
              disabled={!canRun}
              title={
                !generationId ? "Generate text first" :
                !reference.trim() ? "Add reference text" :
                busy ? "Evaluating..." : "Run judge evaluation"
              }
            >
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Evaluating…
                </>
              ) : (
                <>
                  <i className="fas fa-play me-2" />
                  Run Judge
                </>
              )}
            </button>
          </div>
        </div>


        {/* Scores */}
        <div className="row g-3">
          {["correctness","relevance","fluency","overall"].map((k) => {
            const v = (scores as any)?.[k] as number | undefined;
            const pct = getPercentage(v);
            const emphasize = k === "overall";
            return (
              <div key={k} className="col-6 col-lg-3">
                <div className={`ai-score-card ${emphasize ? "ai-score-card-emphasis" : ""}`}>
                  <div className="d-flex align-items-center mb-2">
                    <div className={`ai-score-icon me-2 ${emphasize ? "text-warning" : "text-light"}`}>
                      <i className={k === "correctness" ? "fas fa-check" :
                                   k === "relevance"   ? "fas fa-bullseye" :
                                   k === "fluency"     ? "fas fa-language" :
                                                         "fas fa-trophy"} />
                    </div>
                    <small className="ai-score-label text-capitalize">{k}</small>
                  </div>
                  <div className="ai-score-value mb-2">
                    <span className={`fw-bold ${emphasize ? "text-warning" : "text-light"}`}>
                      {typeof v === "number" ? v.toFixed(1) : "–"}
                    </span>
                    <small className="text-muted ms-1">/ 10</small>
                  </div>
                  <div className="ai-progress-container">
                    <div className="ai-progress-bar">
                      <div className={`ai-progress-fill ${emphasize ? "ai-progress-emphasis" : "ai-progress-info"}`} style={{ width: `${pct}%` }}>
                        <div className="ai-progress-glow" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {err && (
          <div className="alert alert-danger mt-3 ai-alert">
            <i className="fas fa-exclamation-triangle me-2" />
            <strong>Error:</strong> {err}
            {detail && (
              <details className="mt-2">
                <summary className="btn btn-sm btn-outline-danger">Show Details</summary>
                <pre className="mb-0 small mt-2 p-2 bg-dark text-light rounded">
{typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Success message when scores are available */}
        {scores && !err && (
          <div className="alert alert-success mt-3 ai-alert">
            <i className="fas fa-check-circle me-2" />
            <strong>Evaluation Complete!</strong> Judge scores computed for generation #{generationId}
          </div>
        )}
      </div>
    </div>
  );
}