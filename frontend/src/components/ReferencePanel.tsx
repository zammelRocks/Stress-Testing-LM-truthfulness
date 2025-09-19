// src/components/ReferencePanel.tsx
interface Props {
  reference: string;
  setReference: (v: string) => void;
}

export default function ReferencePanel({ reference, setReference }: Props) {
  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center">
          <div className="ai-icon me-3"><i className="fas fa-star" /></div>
          <div>
            <h5 className="mb-1 text-white">Reference Answer</h5>
            <small className="text-light opacity-75">Gold standard for comparison</small>
          </div>
        </div>
      </div>

      <div className="ai-card-body">
        <textarea
          className="form-control ai-input"
          rows={6}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Paste your reference/gold answer…"
        />
      </div>
    </div>
  );
}
