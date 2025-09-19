// src/components/GenerationLoader.tsx - Improved with generation list
import { useState, useEffect } from "react";
import { api, ApiError } from "../api";
import type { GenerationResp } from "../types";

interface Props {
  onLoaded: (gen: GenerationResp) => void;
}

export default function GenerationLoader({ onLoaded }: Props) {
  const [generations, setGenerations] = useState<GenerationResp[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [manualId, setManualId] = useState<string>("");
  const [useManual, setUseManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load recent generations on mount
  useEffect(() => {
    loadRecentGenerations();
  }, []);

  async function loadRecentGenerations() {
    setLoadingList(true);
    try {
      const response = await api.getGenerations({ page_size: 10, ordering: "-id" });
      setGenerations(response.results);
    } catch (e: any) {
      console.warn("Could not load recent generations:", e);
      // Don't show error for this, just fall back to manual input
      setUseManual(true);
    } finally {
      setLoadingList(false);
    }
  }

  async function load() {
    const id = useManual ? parseInt(manualId, 10) : parseInt(selectedId, 10);
    
    if (!Number.isFinite(id)) {
      setErr("Please select or enter a valid numeric ID.");
      return;
    }

    setBusy(true);
    setErr(null);
    
    try {
      const gen = await api.getGeneration(id);
      onLoaded(gen);
      setErr(null);
    } catch (e: any) {
      const msg = e instanceof ApiError
        ? `Load failed (HTTP ${e.status}): ${e.message}`
        : `Load failed: ${e?.message || "Unknown error"}`;
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  const canLoad = useManual 
    ? !!manualId.trim() && !busy
    : !!selectedId && !busy;

  return (
    <div className="ai-card">
      <div className="ai-card-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="ai-icon me-3"><i className="fas fa-database" /></div>
            <div>
              <h5 className="mb-1 text-white">Load Existing Generation</h5>
              <small className="text-light opacity-75">
                {useManual ? "Enter ID manually" : "Choose from recent generations"}
              </small>
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => setUseManual(!useManual)}
            disabled={busy || loadingList}
          >
            <i className={`fas fa-${useManual ? "list" : "keyboard"} me-1`} />
            {useManual ? "Show List" : "Manual ID"}
          </button>
        </div>
      </div>

      <div className="ai-card-body">
        {!useManual ? (
          // Generation List Mode
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label ai-label">
                <i className="fas fa-list me-2" />
                Recent Generations
              </label>
              {loadingList ? (
                <div className="form-control ai-input d-flex align-items-center">
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading recent generations...
                </div>
              ) : generations.length > 0 ? (
                <select
                  className="form-select ai-input"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Choose a generation...</option>
                  {generations.map((gen) => {
                    // Handle both 'id' and 'generation_id' fields
                    const genId = (gen as any).generation_id || (gen as any).id;
                    return (
                      <option key={genId} value={genId?.toString() || ""}>
                        #{genId} - {gen.output?.substring(0, 50) || "No output"}...
                        {(gen as any).model_slug && ` (${(gen as any).model_slug})`}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="form-control ai-input text-muted">
                  No recent generations found
                </div>
              )}
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn ai-btn-secondary w-100"
                onClick={load}
                disabled={!canLoad}
              >
                {busy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Loading…
                  </>
                ) : (
                  <>
                    <i className="fas fa-download me-2" />
                    Load Selected
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Manual ID Mode
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label ai-label">
                <i className="fas fa-hashtag me-2" />
                Generation ID
              </label>
              <input
                className="form-control ai-input"
                placeholder="e.g. 33"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                type="number"
                min="1"
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn ai-btn-secondary w-100"
                onClick={load}
                disabled={!canLoad}
              >
                {busy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Loading…
                  </>
                ) : (
                  <>
                    <i className="fas fa-download me-2" />
                    Load
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Refresh button for list mode */}
        {!useManual && (
          <div className="text-center mt-3">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={loadRecentGenerations}
              disabled={loadingList || busy}
            >
              {loadingList ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <i className="fas fa-refresh me-2" />
                  Refresh List
                </>
              )}
            </button>
          </div>
        )}

        {err && (
          <div className="alert alert-danger mt-3 ai-alert" role="alert">
            <i className="fas fa-exclamation-triangle me-2" />
            <strong>Error:</strong> {err}
          </div>
        )}

        {/* Info about the feature */}
        <div className="mt-3">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1" />
            This feature lets you load previously generated text for re-evaluation or testing.
            {!useManual && " Switch to manual mode if you know the specific ID."}
          </small>
        </div>
      </div>
    </div>
  );
}