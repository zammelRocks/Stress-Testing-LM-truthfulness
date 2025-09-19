import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Header from "./components/Header";
import TaskGenerator from "./components/TaskGenerator";
import ReferenceEditor from "./components/ReferenceEditor";
import CandidateEditor from "./components/CandidateEditor";
import ClassicMetricsPanel from "./components/ClassicMetricsPanel";
import JudgePanel from "./components/JudgePanel";
import ScoreCard from "./components/ScoreCard";
import GenerationLoader from "./components/GenerationLoader";

import { api, ApiError } from "./api";
import type { GenerationResp, MetricsResp } from "./types";

export default function App() {
  // Inputs
  const [task, setTask] = useState("Write a haiku about autumn leaves falling.");
  const [reference, setReference] = useState(
    "Autumn leaves descend,\nGolden whispers kiss the ground—\nSeason's gentle end."
  );
  const [modelSlug, setModelSlug] = useState("mistral:7b");

  // Data
  const [generation, setGeneration] = useState<GenerationResp | null>(null);
  const [candidate, setCandidate] = useState<string>("");

  // Classic metrics
  const [metrics, setMetrics] = useState<MetricsResp["metrics"] | null>(null);

  // UI state
  const [errorGenerate, setErrorGenerate] = useState<string | null>(null);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);
  const [busyGenerate, setBusyGenerate] = useState(false);
  const [busyMetrics, setBusyMetrics] = useState(false);

  // Connection status
  const [backendStatus, setBackendStatus] =
    useState<"unknown" | "connected" | "error">("unknown");

  // Helpers
  const generationId = useMemo<number | null>(() => {
    const anyGen = generation as any;
    const id =
      anyGen?.generation_id ??
      anyGen?.id ??
      (typeof anyGen?.pk === "number" ? anyGen.pk : undefined);
    return typeof id === "number" ? id : null;
  }, [generation]);

  const canGenerate = useMemo(
    () => !!task.trim() && !!modelSlug.trim() && !busyGenerate,
    [task, modelSlug, busyGenerate]
  );

  const canComputeMetrics = useMemo(
    () => typeof generationId === "number" && !!reference.trim() && !busyMetrics,
    [generationId, reference, busyMetrics]
  );

  // Effects
  useEffect(() => {
    api
      .testConnection()
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("error"));
  }, []);

  useEffect(() => {
    if (generation?.output) setCandidate(generation.output);
  }, [generationId]);

  // Actions
  async function handleGenerate() {
    if (!canGenerate) return;
    setBusyGenerate(true);
    setErrorGenerate(null);
    setErrorMetrics(null);
    setMetrics(null);
    setGeneration(null);
    setCandidate("");

    try {
      const data = await api.generate(modelSlug, task);
      setGeneration(data);
      setCandidate((data as any)?.output ?? "");
      setBackendStatus("connected");
    } catch (e: any) {
      if (e instanceof ApiError) {
        setErrorGenerate(`Generation failed (${e.status}): ${e.message}`);
        if (e.status >= 500) setBackendStatus("error");
      } else {
        setErrorGenerate(`Generation failed: ${e?.message || String(e)}`);
        setBackendStatus("error");
      }
    } finally {
      setBusyGenerate(false);
    }
  }

  async function handleComputeMetrics() {
    if (!canComputeMetrics || !generationId) return;
    setBusyMetrics(true);
    setErrorMetrics(null);
    setMetrics(null);

    try {
      const result = await api.evaluateMetrics(generationId, reference);
      setMetrics(result.metrics || null);
      setBackendStatus("connected");
    } catch (e: any) {
      if (e instanceof ApiError) {
        setErrorMetrics(`Metrics evaluation failed (${e.status}): ${e.message}`);
        if (e.status >= 500) setBackendStatus("error");
      } else {
        setErrorMetrics(`Metrics evaluation failed: ${e?.message || String(e)}`);
        setBackendStatus("error");
      }
    } finally {
      setBusyMetrics(false);
    }
  }

  async function handleGenerateAndEvaluate() {
    if (!canGenerate) return;

    setBusyGenerate(true);
    setBusyMetrics(true);
    setErrorGenerate(null);
    setErrorMetrics(null);
    setMetrics(null);
    setGeneration(null);
    setCandidate("");

    try {
      const result = await api.generateThenScore({
        model_slug: modelSlug,
        prompt: task,
        reference,
        judge_model: "mistral:7b",
      });

      setGeneration(result.generation);
      setCandidate((result.generation as any)?.output ?? "");
      setMetrics(result.metrics.metrics || null);
      setBackendStatus("connected");
    } catch (e: any) {
      const msg =
        e instanceof ApiError
          ? `Pipeline failed (${e.status}): ${e.message}`
          : `Pipeline failed: ${e?.message || String(e)}`;
      setErrorGenerate(msg);
      setBackendStatus("error");
    } finally {
      setBusyGenerate(false);
      setBusyMetrics(false);
    }
  }

  const busy = busyGenerate || busyMetrics;

  // Render
  return (
    <div className="ai-app">
      {/* Background */}
      <div className="ai-background">
        <div className="neural-network">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className={`neural-node node-${i % 5}`} />
          ))}
        </div>
      </div>

      <Header busy={busy} />

      {/* Backend Status Indicator */}
      {backendStatus === "error" && (
        <div className="alert alert-warning mx-3 mb-0" role="alert">
          <i className="fas fa-exclamation-triangle me-2" />
          <strong>Backend Connection Issue:</strong> Make sure Django is running on port 8000
        </div>
      )}

      <main className="container-fluid py-4">
        <div className="row g-4 max-width-container mx-auto">
          {/* Generator */}
          <div className="col-12">
            <TaskGenerator
              task={task}
              setTask={setTask}
              modelSlug={modelSlug}
              setModelSlug={setModelSlug}
              onGenerate={handleGenerate}
              busy={busyGenerate}
            />


            {errorGenerate && (
              <div className="alert alert-danger mt-3 ai-alert" role="alert">
                <i className="fas fa-exclamation-triangle me-2" />
                <strong>Generation Error:</strong> {errorGenerate}
              </div>
            )}
          </div>


          {/* Editors */}
          <div className="col-12 col-xl-6">
            <ReferenceEditor reference={reference} setReference={setReference} />
          </div>
          <div className="col-12 col-xl-6">
            <CandidateEditor
              candidate={candidate}
              setCandidate={setCandidate}
              generationId={generationId ?? undefined}
            />
          </div>

          {/* Top row: two panels with fixed equal height */}
          <div className="col-12 col-xl-6">
            <div className="panel-fixed">{/* why: prevent row from stretching when JudgePanel grows */}
              <ClassicMetricsPanel
                generationId={generationId ?? undefined}
                reference={reference}
                onCompute={handleComputeMetrics}
                disabled={!canComputeMetrics}
                busy={busyMetrics}
              />
            </div>

            {/* Cards directly below (won't be pushed by JudgePanel height anymore) */}
            <div className="metric-grid mt-3">
              <ScoreCard label="BLEU" value={metrics?.bleu ?? null} icon="fas fa-code" max={1} />
              <ScoreCard label="Cosine" value={metrics?.cosine ?? null} icon="fas fa-vector-square" max={1} />
              <ScoreCard label="ROUGE-1" value={metrics?.rouge1 ?? null} icon="fas fa-ruler" max={1} />
              <ScoreCard label="ROUGE-L" value={metrics?.rougeL ?? null} icon="fas fa-ruler-vertical" max={1} />
            </div>

            {errorMetrics && (
              <div className="alert alert-danger mt-3 ai-alert" role="alert">
                <i className="fas fa-exclamation-triangle me-2" />
                <strong>Metrics Error:</strong> {errorMetrics}
              </div>
            )}
          </div>

          <div className="col-12 col-xl-6">
            <div className="panel-fixed">
              <JudgePanel
                generationId={generationId ?? undefined}
                reference={reference}
                defaultJudgeModel="mistral:7b"
              />
            </div>
          </div>
        </div>


        {/* Footer */}
        <footer className="text-center mt-5 py-4">
          <div className="ai-footer-content">
            <p className="mb-2 text-light">
              <i className="fas fa-info-circle me-2" />
              ZammelRocks
              
            </p>
            <small className="text-light opacity-75">
              AI Model Evaluation Platform
            </small>
          </div>
        </footer>
      </main>
    </div>
  );
}