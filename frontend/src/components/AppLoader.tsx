import React, { useState } from "react";
import type { DatasetUploadResponse } from "../types";
import { api, ApiError } from "../api";

interface AppLoaderProps {
  onUploadComplete: (response: DatasetUploadResponse) => void;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ onUploadComplete, onError, onBusyChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const setBusyStates = (b: boolean) => {
    setBusy(b);
    onBusyChange?.(b);
  };

  const handleUpload = async () => {
    if (!file) {
      onError?.("Please choose a file first.");
      return;
    }
    try {
      setBusyStates(true);
      const resp = await api.uploadDataset(file, file.name);
      onUploadComplete(resp);
    } catch (err) {
      if (err instanceof ApiError) onError?.(err.message);
      else onError?.("Unexpected error occurred.");
    } finally {
      setBusyStates(false);
    }
  };

  return (
    <div className="cyber-panel">
      <h3 className="panel-title">Dataset Upload</h3>

      <div className="file-input-wrapper">
        <input
          className="cyber-input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </div>

      <div className="cyber-actions">
        <button
          className="btn-glow btn-glow-primary"
          onClick={handleUpload}
          disabled={busy || !file}
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        <button
          className="btn-glow btn-glow-secondary"
          type="button"
          onClick={() => {
            setFile(null);
            const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (input) input.value = "";
          }}
          disabled={busy}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default AppLoader;
