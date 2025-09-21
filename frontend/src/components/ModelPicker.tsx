import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import type { InferenceModel } from "../types";

interface ModelPickerProps {
  value?: string;
  onChange: (slug: string | undefined) => void;
  disabled?: boolean;
}

const ModelPicker: React.FC<ModelPickerProps> = ({ value, onChange, disabled }) => {
  const [models, setModels] = useState<InferenceModel[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const loadModels = useCallback(async () => {
    try {
      setBusy(true);
      setError(null);
      const list = await api.listInferenceModels(); // GET /api/models/
      setModels(list || []);
      
      // Autoselect first model only if no value is set and we haven't auto-selected before
      if (!value && !hasAutoSelected && list?.length && list.length > 0) {
        onChange(list[0].slug);
        setHasAutoSelected(true);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load models.");
    } finally {
      setBusy(false);
    }
  }, [value, onChange, hasAutoSelected]);

  useEffect(() => {
    loadModels();
  }, []); // Only run once on mount

  return (
    <div className="cyber-panel">
      <h3 className="panel-title">Select Model</h3>

      <label className="form-label">Active OLLAMA Models</label>
      <select
        className="cyber-input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled || busy}
      >
        {models.length === 0 ? (
          <option value="">No active models found</option>
        ) : (
          models.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.display_name || `${m.slug} (${m.repo_id})`}
            </option>
          ))
        )}
      </select>

      {error && (
        <div className="alert ai-alert alert-danger mt-3" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ModelPicker;