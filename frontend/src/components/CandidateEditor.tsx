export default function CandidateEditor({
  candidate,
  setCandidate,
  generationId,
}: {
  candidate: string;
  setCandidate: (v: string) => void;
  generationId?: number | null;
}) {
  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="ai-icon me-3"><i className="fas fa-file-alt" /></div>
            <div>
              <h5 className="mb-1 text-white">Generated Candidate</h5>
              <small className="text-light opacity-75">Editable</small>
            </div>
          </div>
          {!!generationId && <span className="badge bg-success">ID: {generationId}</span>}
        </div>
      </div>
      <div className="ai-card-body">
        <textarea
          className="form-control ai-input"
          rows={6}
          value={candidate}
          onChange={(e) => setCandidate(e.target.value)}
          placeholder="Generated content will appear here - edit as needed..."
        />
      </div>
    </div>
  );
}
