import React, { useMemo, useState } from "react";
import "../App.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AppLoader from "../components/AppLoader";
import ModelPicker from "../components/ModelPicker";
import DatasetLabeler from "../components/DatasetLabeler";
import type { DatasetUploadResponse } from "../types";

const EvaluateDataSet: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload result
  const [data, setData] = useState<DatasetUploadResponse | null>(null);

  // Selected model slug
  const [modelSlug, setModelSlug] = useState<string | undefined>(undefined);

  // Dataset id (tolerate legacy types)
  const datasetId = useMemo<number | undefined>(() => {
    const idMaybe = (data?.dataset as unknown as { id?: number })?.id;
    return typeof idMaybe === "number" ? idMaybe : undefined;
  }, [data]);

  const currentDataset = useMemo(() => data?.dataset ?? null, [data]);

  return (
    <div className="cyber-app">
      {/* Background FX */}
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

      <Header busy={busy} />

      <main className="container-fluid py-4 cyber-main">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">

            {/* Upload */}
            <AppLoader
              onUploadComplete={(resp) => {
                setData(resp);
                setError(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onError={(msg) => {
                setError(msg);
                setData(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onBusyChange={setBusy}
            />

            {error && (
              <div className="alert ai-alert alert-danger mt-3" role="alert">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Dataset details */}
            {currentDataset && (
              <div className="card panel-fixed mt-3">
                <div className="card-header">
                  <h6 className="card-title mb-0">Dataset Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-mutedons d-block">Name</small>
                      <div className="fw-semibold">{currentDataset.name}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-mutedons d-block">Kind</small>
                      <div className="fw-semibold text-uppercase">{currentDataset.kind}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-mutedons d-block">Rows</small>
                      <div className="fw-semibold">{currentDataset.row_count}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-mutedons d-block">Uploaded</small>
                      <div className="fw-semibold">
                        {new Date(currentDataset.uploaded_at).toLocaleString()}
                      </div>
                    </div>
                    {typeof (data as any)?.inserted === "number" && (
                      <div className="col-12">
                        <small className="text-mutedons d-block">Inserted</small>
                        <div className="fw-semibold">{(data as any).inserted}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sample preview */}
            {data?.sample?.length ? (
              <div className="cyber-panel">
                <h3 className="panel-title">Sample Preview</h3>
                <div className="cyber-table-wrapper">
                  <table className="cyber-table">
                    <thead>
                      <tr>
                        <th>CLAIM</th>
                        <th>REFERENCE</th>
                        <th>LABEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sample.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.claim || <em>—</em>}</td>
                          <td>{row.reference || <em>—</em>}</td>
                          <td>
                            <span className="label-pill">{row.label || "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Evaluate section (after upload) */}
            {datasetId && (
              <>
                <ModelPicker value={modelSlug} onChange={setModelSlug} disabled={busy} />

                <DatasetLabeler datasetId={datasetId} modelSlug={modelSlug} />
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