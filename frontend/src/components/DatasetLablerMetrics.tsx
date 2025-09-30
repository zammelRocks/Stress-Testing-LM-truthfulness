import React, { useState } from "react";
import { api } from "../api";
import type { LabelDatasetRowResult } from "../types";

interface Props {
  datasetId: number;
  modelSlug: string;
  onResults?: (rows: LabelDatasetRowResult[]) => void;
}

const DatasetLablerMetrics: React.FC<Props> = ({ datasetId, modelSlug, onResults }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LabelDatasetRowResult[]>([]);

  async function handleLabelDataset() {
    setBusy(true);
    try {
      const rows = await api.labelDatasetJSON({
        dataset_id: datasetId,
        model_slug: modelSlug,
        
        limit: 50, // preview only
        offset: 0,
      });

      // ✅ assign incremental generation_id
      const rowsWithGenId: LabelDatasetRowResult[] = rows.map((r: any, idx: number) => ({
        ...r,
        generation_id: idx + 1, // incremental id
      }));

      setResults(rowsWithGenId);
      setError(null);
      if (onResults) onResults(rowsWithGenId);
    } catch (e: any) {
      console.error("Failed to label dataset", e);
      setError("Failed to label dataset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cyber-panel mt-3">
      <h3 className="panel-title">Label Dataset with Model</h3>
      <button
        className="btn btn-cyber"
        disabled={busy}
        onClick={handleLabelDataset}
      >
        {busy ? "Labeling..." : "Run Labeling"}
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
                <th>Gold Label</th>
                <th>Predicted Label</th>
                <th>Justification</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.generation_id}</td>
                  <td>{row.claim}</td>
                  <td>{row.gold_label}</td>
                  <td>{row.pred_label}</td>
                  <td>{row.justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DatasetLablerMetrics;
