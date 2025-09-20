import React, { useState } from 'react';
import '../App.css'; // ✅ keep your styling
import Header from '../components/Header'; // ✅ respect your Header
import Footer from '../components/Footer'; // ✅ and Footer
import AppLoader from '../components/AppLoader';
import type { DatasetUploadResponse } from '../types';

const EvaluateDataSet: React.FC = () => {
  const [data, setData] = useState<DatasetUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="cyber-app">
      {/* Background FX that work with your App.css */}
      <div className="cyber-background">
        <div className="matrix-rain">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`matrix-column column-${i}`}>
              {Array.from({ length: 20 }).map((_, j) => (
                <span key={j} className="matrix-char">#</span>
              ))}
            </div>
          ))}
        </div>
        <div className="cyber-grid" />
        <div className="neural-circuits">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`circuit-node pulse-${i % 3}`}>
              <div className="node-core" />
              <div className="node-ring" />
            </div>
          ))}
        </div>
      </div>

      {/* Header (can show busy if your Header supports it) */}
      <Header busy={busy} />

      <main className="container-fluid py-4 cyber-main">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <AppLoader
              onUploadComplete={(resp) => {
                setData(resp);
                setError(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onError={(msg) => {
                setError(msg);
                setData(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBusyChange={setBusy}
              // endpoint={YOUR_CUSTOM_ENDPOINT} // optional override
            />

            {error && (
              <div className="alert ai-alert alert-danger mt-3" role="alert">
                <strong>Upload failed:</strong> {error}
              </div>
            )}

            {data && (
              <>
                <div className="card mt-3">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Dataset Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-6">
                        <small className="text-muted d-block">Name</small>
                        <div className="fw-semibold">{data.dataset.name}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">Kind</small>
                        <div className="fw-semibold text-uppercase">{data.dataset.kind}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">Rows</small>
                        <div className="fw-semibold">{data.dataset.row_count}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">Created</small>
                        <div className="fw-semibold">
                          {new Date(data.dataset.uploaded_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">Inserted</small>
                        <div className="fw-semibold">{data.inserted}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {data.sample?.length > 0 && (
                  <div className="card mt-3">
                    <div className="card-header">
                      <h6 className="card-title mb-0">Sample Preview</h6>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Claim</th>
                              <th>Reference</th>
                              <th>Label</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.sample.map((row, idx) => (
                              <tr key={idx}>
                                <td className="dataset-cell">
                                  <div className="cell-content">{row.claim ?? <em>—</em>}</div>
                                </td>
                                <td className="dataset-cell">
                                  <div className="cell-content">{row.reference ?? <em>—</em>}</div>
                                </td>
                                <td>
                                  <span className="badge bg-secondary">{row.label ?? 'None'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EvaluateDataSet;
