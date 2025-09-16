export default function TaskGenerator({
  task,
  setTask,
  modelSlug,
  setModelSlug,
  onGenerate,
  busy,
}: {
  task: string;
  setTask: (v: string) => void;
  modelSlug: string;
  setModelSlug: (v: string) => void;
  onGenerate: () => void;
  busy: boolean;
}) {
  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center">
          <div className="ai-icon me-3"><i className="fas fa-robot" /></div>
          <div>
            <h5 className="mb-1 text-white">Task Generation</h5>
            <small className="text-light opacity-75">Configure model & prompt</small>
          </div>
        </div>
      </div>

      <div className="ai-card-body">
        <div className="row g-4">
          <div className="col-lg-8">
            <label className="form-label ai-label">
              <i className="fas fa-edit me-2" />Task Prompt
            </label>
            <textarea
              className="form-control ai-input"
              rows={4}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe what the model should generate..."
            />
          </div>
          <div className="col-lg-4">
            <label className="form-label ai-label">
              <i className="fas fa-cog me-2" />Model (Ollama / registry)
            </label>
            <input
              className="form-control ai-input mb-3"
              value={modelSlug}
              onChange={(e) => setModelSlug(e.target.value)}
              placeholder="e.g. mistral:7b"
            />
            <button
              onClick={onGenerate}
              disabled={busy || !task.trim() || !modelSlug.trim()}
              className="btn ai-btn-primary w-100"
            >
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-play me-2" />
                  Generate Response
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
