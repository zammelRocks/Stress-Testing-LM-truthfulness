import React, { useState } from "react";
import { api } from "../api";
import type { LabelDatasetRowResult, MetricsResp } from "../types";

interface Props {
  rows: LabelDatasetRowResult[];
}

interface RowWithMetrics extends LabelDatasetRowResult {
  metrics?: MetricsResp["metrics"];
  error?: string;
}

const EvaluateMetricsDataset: React.FC<Props> = ({ rows }) => {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<RowWithMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function evaluateJustifications() {
    setBusy(true);
    try {
      const evaluated: RowWithMetrics[] = [];
      for (const row of rows) {
        try {
          if (row.generation_id && row.reference) {
            // ✅ call backend with fake generation_id
            const resp = await api.evaluateMetrics(
              row.generation_id,
              row.reference
            );
            evaluated.push({ ...row, metrics: resp.metrics });
          } else {
            evaluated.push({
              ...row,
              error: "Missing generation_id or reference",
            });
          }
        } catch (err: any) {
          console.error(`Failed to evaluate row ${row.row_id}`, err);
          evaluated.push({ ...row, error: err.message || "Eval failed" });
        }
      }
      setResults(evaluated);
      setError(null);
    } catch (e: any) {
      console.error("Batch evaluation failed", e);
      setError("Batch evaluation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cyber-panel mt-3">
      <h3 className="panel-title">Evaluate Metrics on Dataset</h3>
      <button
        className="btn btn-cyber"
        onClick={evaluateJustifications}
        disabled={busy}
      >
        {busy ? "Evaluating..." : "Compute Metrics"}
      </button>

      {error && (
        <div className="alert ai-alert alert-danger mt-3">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="cyber-table-wrapper mt-3">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Gen ID</th>
                <th>Claim</th>
                <th>Reference</th>
                <th>Gold Label</th>
                <th>Pred Label</th>
                <th>BLEU</th>
                <th>ROUGE-1</th>
                <th>ROUGE-L</th>
                <th>Cosine</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.generation_id}</td>
                  <td>{row.claim}</td>
                  <td>{row.reference}</td>
                  <td>{row.gold_label}</td>
                  <td>{row.pred_label}</td>
                  <td>{row.metrics?.bleu?.toFixed(3) ?? "—"}</td>
                  <td>{row.metrics?.rouge1?.toFixed(3) ?? "—"}</td>
                  <td>{row.metrics?.rougeL?.toFixed(3) ?? "—"}</td>
                  <td>{row.metrics?.cosine?.toFixed(3) ?? "—"}</td>
                  <td>{row.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EvaluateMetricsDataset;
