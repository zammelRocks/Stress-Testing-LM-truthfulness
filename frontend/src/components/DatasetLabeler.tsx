import React, { useState } from "react";
import { api } from "../api";
import type { LabelDatasetRowResult } from "../types";

interface DatasetLabelerProps {
  datasetId: number;
  modelSlug?: string;
  className?: string;
}

const DatasetLabeler: React.FC<DatasetLabelerProps> = ({ datasetId, modelSlug, className }) => {
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [limit, setLimit] = useState<number | "">("");
  const [offset, setOffset] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<LabelDatasetRowResult[] | null>(null);

  const onPreview = async () => {
    if (!datasetId || !modelSlug) {
      setError("Please select a model and upload a dataset first.");
      return;
    }

    try {
      setPreviewBusy(true);
      setError(null);
      
      const results = await api.labelDatasetJSON({
        dataset_id: Number(datasetId),
        model_slug: modelSlug,
        limit: 3,
        offset: 0,
      });
      
      setPreviewData(results);
    } catch (e: any) {
      setError(e?.message || "Preview failed.");
    } finally {
      setPreviewBusy(false);
    }
  };

  const onDownload = async () => {
    if (!datasetId || !modelSlug) {
      setError("Please select a model and upload a dataset first.");
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
      setError(e?.message || "Download failed.");
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
            disabled={busy || previewBusy}
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
            disabled={busy || previewBusy}
          />
        </div>
      </div>

      <div className="cyber-actions">
        <button
          className="btn-glow btn-glow-secondary me-2"
          onClick={onPreview}
          disabled={previewBusy || busy || !datasetId || !modelSlug}
        >
          {previewBusy ? "Loading..." : "Preview (3 rows)"}
        </button>
        <button
          className="btn-glow btn-glow-primary"
          onClick={onDownload}
          disabled={busy || previewBusy || !datasetId || !modelSlug}
        >
          {busy ? "Processing..." : "Download Full CSV"}
        </button>
      </div>

      {error && (
        <div className="alert ai-alert alert-danger mt-3" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {previewData && (
        <div className="mt-4">
          <h4>Preview Results:</h4>
          <div className="cyber-table-wrapper">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>CLAIM</th>
                  <th>GOLD</th>
                  <th>PREDICTED</th>
                  <th>JUSTIFICATION</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={row.row_id || idx}>
                    <td>{row.claim || "—"}</td>
                    <td>{row.gold_label || "—"}</td>
                    <td>{row.pred_label || "—"}</td>
                    <td>{row.justification || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small className="text-muted">Showing 3 sample rows</small>
        </div>
      )}
    </div>
  );
};

export default DatasetLabeler;