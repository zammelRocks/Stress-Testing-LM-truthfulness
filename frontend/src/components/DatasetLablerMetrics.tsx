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
  const [success, setSuccess] = useState(false);

  async function handleLabelDataset() {
    setBusy(true);
    setError(null);
    setSuccess(false);
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
        generation_id: idx + 1,
      }));

      if (onResults) onResults(rowsWithGenId);

      setSuccess(true);
    } catch (e: any) {
      console.error("Failed to label dataset", e);
      setError("Failed to label dataset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cyber-panel mt-3">
      <h3 className="panel-title">Run Predictions</h3>

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

      {success && (
        <div className="alert ai-alert alert-success mt-3">
          ✅ <strong>Success:</strong> Labeling completed!
        </div>
      )}
    </div>
  );
};

export default DatasetLablerMetrics;
