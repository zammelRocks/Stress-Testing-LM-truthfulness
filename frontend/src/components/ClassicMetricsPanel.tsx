import { useState } from "react";

type Props = {
  generationId?: number ;
  reference: string;
  disabled?: boolean;
  busy?: boolean;
  onCompute: () => void;
  /** Allow loading a generation by ID when none is selected */
  onPickGenerationId?: (id: number) => void;
};

export default function ClassicMetricsPanel({
  generationId,
  reference,
  disabled,
  busy,
  onCompute,
  onPickGenerationId,
}: Props) {
  const [manualId, setManualId] = useState<string>("");

  const noGen = !generationId;
  const noRef = !reference.trim();

  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center">
          <div className="ai-icon me-3">
            <i className="fas fa-sliders-h"></i>
          </div>
          <div>
            <h5 className="mb-1 text-white">Classic Metrics</h5>
            <small className="text-light opacity-75">
              BLEU, ROUGE, and Cosine similarity
            </small>
          </div>
        </div>
      </div>

      <div className="ai-card-body">
        {noGen ? (
          <>
            <div className="alert alert-info ai-alert" role="alert">
              <i className="fas fa-info-circle me-2" />
              No <code>generation_id</code> yet. Generate first, or load an existing ID below.
            </div>

            <div className="row g-2 align-items-end mt-1">
              <div className="col-8">
                <label className="form-label ai-label">
                  <i className="fas fa-hashtag me-2" />
                  Paste an existing Generation ID
                </label>
                <input
                  className="form-control ai-input"
                  placeholder="e.g. 12"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="col-4">
                <button
                  className="btn ai-btn-secondary w-100"
                  disabled={!manualId.trim() || !onPickGenerationId}
                  onClick={() => {
                    if (!onPickGenerationId) return;
                    const id = Number(manualId);
                    if (Number.isFinite(id) && id > 0) onPickGenerationId(id);
                  }}
                >
                  <i className="fas fa-download me-2" />
                  Load
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="text-light">
                <small className="opacity-75">Generation ID:</small>{" "}
                <span className="badge bg-success">#{generationId}</span>
              </div>
              {noRef && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle me-1" />
                  Enter a reference to enable
                </small>
              )}
            </div>

            <button
              className="btn ai-btn-primary"
              disabled={disabled || busy}
              onClick={onCompute}
            >
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Computing…
                </>
              ) : (
                <>
                  <i className="fas fa-chart-bar me-2" />
                  Compute Classic Metrics
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
