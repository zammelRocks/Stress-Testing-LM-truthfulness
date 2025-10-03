import React, { useMemo, useState } from "react";
import "../App.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AppLoader from "../components/AppLoader";
import ModelPicker from "../components/ModelPicker";
import DatasetLablerMetrics from "../components/DatasetLablerMetrics";
import EvaluateMetricsDataset from "../components/EvaluateMetricsDataset";
import EvaluateJudgeDataset from "../components/EvaluateJudgeDataset"; // new judge component
import type { DatasetUploadResponse, LabelDatasetRowResult } from "../types";

const EvaluateDataSet: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload result metadata
  const [data, setData] = useState<DatasetUploadResponse | null>(null);

  // Selected model slug
  const [modelSlug, setModelSlug] = useState<string | undefined>(undefined);

  // Rows labeled by the model
  const [labeledRows, setLabeledRows] = useState<LabelDatasetRowResult[]>([]);

  // Dataset id
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
          <div className="col-12 col-lg-9">

            {/* Upload step */}
            <AppLoader
              onUploadComplete={(resp) => {
                setData(resp);
                setError(null);
                setLabeledRows([]);
                setModelSlug(undefined);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onError={(msg) => {
                setError(msg);
                setData(null);
                setLabeledRows([]);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onBusyChange={setBusy}
            />

            {error && (
              <div className="alert ai-alert alert-danger mt-3" role="alert">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Dataset details + small preview (only ONCE here) */}
            {currentDataset && (
              <div className="card panel-fixed mt-3">
                <div className="card-header">
                  <h6 className="card-title mb-0">Dataset Uploaded</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-muted d-block">Name</small>
                      <div className="fw-semibold">{currentDataset.name}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Rows</small>
                      <div className="fw-semibold">{currentDataset.row_count}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Kind</small>
                      <div className="fw-semibold text-uppercase">{currentDataset.kind}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Uploaded</small>
                      <div className="fw-semibold">
                        {new Date(currentDataset.uploaded_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Sample preview */}
                  {Array.isArray(data?.sample) && data.sample.length > 0 && (
                    <div className="cyber-panel mt-3">
                      <h6 className="panel-title">Sample Preview (3 rows)</h6>
                      <div className="cyber-table-wrapper">
                        <table className="cyber-table">
                          <thead>
                            <tr>
                              <th>Claim</th>
                              <th>Reference</th>
                              <th>Label</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.sample.slice(0, 3).map((row, idx) => (
                              <tr key={idx}>
                                <td>{row.claim || <em>—</em>}</td>
                                <td>{row.reference || <em>—</em>}</td>
                                <td><span className="label-pill">{row.label || "—"}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Model selection */}
            {datasetId && (
              <ModelPicker
                value={modelSlug}
                onChange={setModelSlug}
                disabled={busy}
              />
            )}

            {/* Step 3: Run labeling predictions */}
            {datasetId && modelSlug && (
              <DatasetLablerMetrics
                datasetId={datasetId}
                modelSlug={modelSlug}
                onResults={setLabeledRows}
              />
            )}

            {/* Step 4: Show metrics */}
            {labeledRows.length > 0 && (
              <>
                <EvaluateMetricsDataset rows={labeledRows} />
                <EvaluateJudgeDataset rows={labeledRows} /> 
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
