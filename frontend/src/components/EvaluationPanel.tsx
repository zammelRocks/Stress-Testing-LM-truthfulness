export default function EvaluationPanel({
  judgeModel,
  setJudgeModel,
  onEvaluate,
  disabled,
  busy,
}: {
  judgeModel: string;
  setJudgeModel: (v: string) => void;
  onEvaluate: () => void;
  disabled: boolean;
  busy: boolean;
}) {
  return (
    <div className="ai-card">
      <div className="ai-card-header">
        <div className="d-flex align-items-center">
          <div className="ai-icon me-3"><i className="fas fa-gavel" /></div>
          <div>
            <h5 className="mb-1 text-white">Evaluate</h5>
            <small className="text-light opacity-75">BLEU/ROUGE/Cosine + LLM Judge</small>
          </div>
        </div>
      </div>

      <div className="ai-card-body">
        <div className="row g-4 mb-2">
          <div className="col-lg-8">
            <label className="form-label ai-label">
              <i className="fas fa-brain me-2" />Judge Model (Ollama)
            </label>
            <input
              className="form-control ai-input"
              value={judgeModel}
              onChange={(e) => setJudgeModel(e.target.value)}
              placeholder="mistral:7b"
            />
            <small className="text-muted d-block mt-1">
              Metrics use saved generation; judge can use edited candidate.
            </small>
          </div>
          <div className="col-lg-4 d-flex align-items-end">
            <button
              onClick={onEvaluate}
              disabled={disabled || busy}
              className="btn ai-btn-success w-100"
            >
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Evaluating...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle me-2" />
                  Run Evaluation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
