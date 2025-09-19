// src/components/MetricsPanel.tsx
import { useState } from "react";
import { api, ApiError } from "../api";
import type { MetricsResp } from "../types";

interface Props {
  generationId?: number | null;
  reference: string;
}

export default function MetricsPanel({ generationId, reference }: Props) {
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResp["metrics"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);

  async function run() {
    if (!generationId) return;
    setBusy(true);
    setErr(null); setDetail(null); setMetrics(null);
    try {
      const r = await api.evaluateMetrics(generationId, reference);
      setMetrics(r.metrics);
    } catch (e: any) {
      const msg = e instanceof ApiError
        ? `Metrics failed (HTTP ${e.status}): ${e.message}`
        : `Metrics failed: ${e?.message || "Unknown"}`;
      setErr(msg);
      setDetail(e?.json ?? e?.body ?? null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center">
          <div className="ai-icon me-3"><i className="fas fa-chart-line" /></div>
          <div>
            <h5 className="mb-1 text-white">Classic Metrics</h5>
            <small className="text-light opacity-75">BLEU • ROUGE-1/-L • Cosine</small>
          </div>
        </div>
      </div>

      <div className="ai-card-body">
        <div className="d-flex gap-2 mb-3">
          <button
            className="btn ai-btn-primary"
            onClick={run}
            disabled={!generationId || !reference.trim() || busy}
          >
            {busy ? (<><span className="spinner-border spinner-border-sm me-2" />Computing…</>)
                   : (<>Compute Metrics</>)}
          </button>
          {!generationId && <span className="text-warning small">Generate first to get a generation_id.</span>}
        </div>

        {metrics && (
          <div className="table-responsive">
            <table className="table table-sm table-dark align-middle mb-0">
              <tbody>
                {"bleu" in metrics && (
                  <tr><th className="w-25">BLEU</th><td>{metrics.bleu?.toFixed(4)}</td></tr>
                )}
                {"rouge1" in metrics && (
                  <tr><th>ROUGE-1</th><td>{metrics.rouge1?.toFixed(4)}</td></tr>
                )}
                {"rougeL" in metrics && (
                  <tr><th>ROUGE-L</th><td>{metrics.rougeL?.toFixed(4)}</td></tr>
                )}
                {"cosine" in metrics && (
                  <tr><th>Cosine</th><td>{metrics.cosine?.toFixed(4)}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {err && (
          <div className="alert alert-danger mt-3 ai-alert">
            <i className="fas fa-exclamation-triangle me-2" />
            <strong>Error:</strong> {err}
            {detail && (
              <details className="mt-2">
                <summary>Details</summary>
                <pre className="mb-0 small">
{typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
