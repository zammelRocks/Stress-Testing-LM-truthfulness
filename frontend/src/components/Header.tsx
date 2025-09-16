import { API_BASE } from "../api";

export default function Header({ busy }: { busy: boolean }) {
  return (
    <nav className="navbar navbar-expand-lg ai-navbar sticky-top">
      <div className="container-fluid">
        <div className="navbar-brand d-flex align-items-center">
          <div className="ai-logo me-3">
            <div className="logo-core">
              <div className="logo-ring"></div>
              <div className="logo-pulse"></div>
            </div>
          </div>
          <div>
            <h1 className="mb-0 fw-bold text-white">Judge Playground</h1>
            <small className="text-light opacity-75">AI Model Evaluation Suite</small>
          </div>
        </div>
        <div className="d-flex align-items-center">
          <span className="badge bg-light text-dark me-2">
            {busy ? "Working…" : "Ready"}
          </span>
          <small className="text-light opacity-75">{API_BASE}</small>
        </div>
      </div>
    </nav>
  );
}
