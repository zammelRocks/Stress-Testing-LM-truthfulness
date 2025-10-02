import React, { useState, useMemo } from "react";
import { api } from "../api";
import type { LabelDatasetRowResult, MetricsResp } from "../types";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Props {
  rows: LabelDatasetRowResult[];
  datasetId?: number; // so we can trigger download
}

interface RowWithMetrics extends LabelDatasetRowResult {
  metrics?: MetricsResp["metrics"];
  error?: string;
}

const normalizeLabel = (label?: string) => {
  if (!label) return "";
  const lower = label.toLowerCase();
  if (lower === "supported" || lower === "accepted") return "SUPPORTED";
  if (lower === "refuted" || lower === "rejected") return "REFUTED";
  return label.toUpperCase();
};

// clamp into [0,1]
const clamp01 = (v?: number) => {
  if (v == null) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
};

// normalize BLEU specifically
const normalizeBleu = (v?: number) => {
  if (v == null) return 0;
  if (v > 1) return clamp01(v / 100); // assume scale 0–100
  return clamp01(v); // already 0–1
};

const EvaluateMetricsDataset: React.FC<Props> = ({ rows, datasetId }) => {
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
            const resp = await api.evaluateMetrics(
              row.generation_id,
              row.reference
            );
            evaluated.push({
              ...row,
              metrics: resp.metrics,
              gold_label: normalizeLabel(row.gold_label),
              pred_label: normalizeLabel(row.pred_label),
            });
          } else {
            evaluated.push({
              ...row,
              gold_label: normalizeLabel(row.gold_label),
              pred_label: normalizeLabel(row.pred_label),
              error: "Missing generation_id or reference",
            });
          }
        } catch (err: any) {
          console.error(`Failed to evaluate row ${row.row_id}`, err);
          evaluated.push({
            ...row,
            gold_label: normalizeLabel(row.gold_label),
            pred_label: normalizeLabel(row.pred_label),
            error: err.message || "Eval failed",
          });
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

  /** 📊 Classification metrics */
  const classificationStats = useMemo(() => {
    if (results.length === 0) return null;

    let correct = 0;
    let total = results.length;

    let TP = 0,
      FP = 0,
      TN = 0,
      FN = 0;

    results.forEach((r) => {
      const g = normalizeLabel(r.gold_label);
      const p = normalizeLabel(r.pred_label);
      if (g === p) correct++;

      if (g === "SUPPORTED" && p === "SUPPORTED") TP++;
      if (g === "REFUTED" && p === "SUPPORTED") FP++;
      if (g === "REFUTED" && p === "REFUTED") TN++;
      if (g === "SUPPORTED" && p === "REFUTED") FN++;
    });

    const accuracy = total > 0 ? correct / total : 0;
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
    const f1 =
      precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return [
      { metric: "Accuracy", score: accuracy },
      { metric: "Precision", score: precision },
      { metric: "Recall", score: recall },
      { metric: "F1", score: f1 },
    ];
  }, [results]);

  /** 📊 Line chart data for text metrics */
  const textMetricsPerRow = useMemo(() => {
    return results.map((r, idx) => ({
      index: idx + 1,
      bleu: normalizeBleu(r.metrics?.bleu),
      rouge1: clamp01(r.metrics?.rouge1),
      rougeL: clamp01(r.metrics?.rougeL),
      cosine: clamp01(r.metrics?.cosine),
    }));
  }, [results]);

  /** CSV download */
  async function downloadCSV() {
    if (!datasetId) return;
    try {
      await api.downloadLabeledDatasetCSV({
        dataset_id: datasetId,
        model_slug: rows[0]?.model_slug || "unknown-model",
        
        filename: "labeled_dataset.csv",
      });
    } catch (err) {
      console.error("Download failed", err);
    }
  }

  return (
    <div className="cyber-panel mt-3">
      <h3 className="panel-title">Evaluate Metrics on Dataset</h3>

      {/* 🔹 Step 1: labeled dataset preview */}
      {rows.length > 0 && (
        <div className="cyber-table-wrapper mt-3">
          <h5>Labeled Dataset (Preview)</h5>
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Gen ID</th>
                <th>Claim</th>
                <th>Gold Label</th>
                <th>Pred Label</th>
                <th>Justification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.generation_id}</td>
                  <td>{row.claim}</td>
                  <td>{normalizeLabel(row.gold_label)}</td>
                  <td>{normalizeLabel(row.pred_label)}</td>
                  <td>{row.justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-cyber mt-2" onClick={downloadCSV}>
            Download Full Dataset CSV
          </button>
        </div>
      )}

      {/* 🔹 Step 2: evaluate button */}
      <button
        className="btn btn-cyber mt-3"
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

      {/* 🔹 Step 3: metrics table */}
      {results.length > 0 && (
        <div className="cyber-table-wrapper mt-3">
          <h5>Metrics per Row</h5>
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
                  <td>{normalizeLabel(row.gold_label)}</td>
                  <td>{normalizeLabel(row.pred_label)}</td>
                  <td>{normalizeBleu(row.metrics?.bleu).toFixed(3)}</td>
                  <td>{clamp01(row.metrics?.rouge1).toFixed(3)}</td>
                  <td>{clamp01(row.metrics?.rougeL).toFixed(3)}</td>
                  <td>{clamp01(row.metrics?.cosine).toFixed(3)}</td>
                  <td>{row.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔹 Step 4: charts */}
      {classificationStats && (
        <div className="mt-4">
          <h5>Classification Performance</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classificationStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {textMetricsPerRow.length > 0 && (
        <>
          <div className="mt-4">
            <h5>BLEU (per row)</h5>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={textMetricsPerRow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bleu" stroke="#8884d8" name="BLEU" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4">
            <h5>ROUGE-1 (per row)</h5>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={textMetricsPerRow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rouge1" stroke="#82ca9d" name="ROUGE-1" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4">
            <h5>ROUGE-L (per row)</h5>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={textMetricsPerRow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rougeL" stroke="#ff7300" name="ROUGE-L" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4">
            <h5>Cosine (per row)</h5>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={textMetricsPerRow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cosine" stroke="#413ea0" name="Cosine" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default EvaluateMetricsDataset;
