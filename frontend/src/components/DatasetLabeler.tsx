import React, { useState } from "react";
import { api } from "../api";

interface DatasetLabelerProps {
  datasetId: number;
  modelSlug?: string;
  className?: string;
}

const DatasetLabeler: React.FC<DatasetLabelerProps> = ({ datasetId, modelSlug, className }) => {
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState<number | "">("");
  const [offset, setOffset] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const onDownload = async () => {
    if (!datasetId) {
      setError("Dataset id missing. Please upload a dataset first.");
      return;
    }
    
    if (!modelSlug) {
      setError("Please select a model first.");
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await api.downloadLabeledDatasetCSV({
        dataset_id: Number(datasetId),
        model_slug: modelSlug,
        limit: typeof limit === "number" ? limit : undefined,
        offset: typeof offset === "number" ? offset : undefined,
      });
    } catch (e: any) {
      console.error("Download failed:", e);
      let errorMessage = "Download failed.";
      
      if (e?.status === 404) {
        errorMessage = "API endpoint not found. Please check if the backend server supports dataset labeling.";
      } else if (e?.status === 500) {
        errorMessage = "Server error occurred. Please check the backend logs for details.";
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`cyber-panel ${className ?? ""}`}>
      <h3 className="panel-title">Label &amp; Download</h3>

      {modelSlug && (
        <div className="alert ai-alert alert-info mb-3" role="alert">
          <strong>Selected Model:</strong> {modelSlug}
        </div>
      )}

      <div className="row g-3">
        <div className="col-6">
          <label className="form-label">Limit (optional)</label>
          <input
            className="cyber-input"
            type="number"
            min={1}
            placeholder="e.g. 500"
            value={limit}
            onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : "")}
            disabled={busy}
          />
        </div>
        <div className="col-6">
          <label className="form-label">Offset (optional)</label>
          <input
            className="cyber-input"
            type="number"
            min={0}
            placeholder="e.g. 0"
            value={offset}
            onChange={(e) => setOffset(e.target.value ? Number(e.target.value) : "")}
            disabled={busy}
          />
        </div>
      </div>

      <div className="cyber-actions">
        <button
          className="btn-glow btn-glow-primary"
          onClick={onDownload}
          disabled={busy || !datasetId || !modelSlug}
        >
          {busy ? "Processing..." : "Label & Download CSV"}
        </button>
      </div>

      {error && (
        <div className="alert ai-alert alert-danger mt-3" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default DatasetLabeler;