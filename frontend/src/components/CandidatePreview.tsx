// src/components/CandidatePreview.tsx
import type { GenerationResp } from "../types";

export default function CandidatePreview({ generation }: { generation: GenerationResp | null }) {
  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="ai-icon me-3"><i className="fas fa-file-alt" /></div>
            <div>
              <h5 className="mb-1 text-white">Server-Stored Candidate</h5>
              <small className="text-light opacity-75">Used by judge via generation_id</small>
            </div>
          </div>
          {generation?.id && <span className="badge bg-success">ID: {generation.id}</span>}
        </div>
      </div>

      <div className="ai-card-body">
        <div className="form-control ai-input" style={{ minHeight: 180, whiteSpace: "pre-wrap" }}>
          {generation?.output || <span className="text-muted">No output yet.</span>}
        </div>
        <small className="text-muted d-block mt-2">
          The judge endpoint ignores local edits and reads the candidate from your backend using <code>generation_id</code>.
        </small>
      </div>
    </div>
  );
}
