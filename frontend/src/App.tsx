import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/Header";
import TaskGenerator from "./components/TaskGenerator";
import ReferenceEditor from "./components/ReferenceEditor";
import CandidateEditor from "./components/CandidateEditor";
import EvaluationPanel from "./components/EvaluationPanel";
import ScoreCard from "./components/ScoreCard";
import { api } from "./api";
import type { GenerationResp, JudgeScores, MetricsMap } from "./types";

export default function App() {
  // Inputs
  const [task, setTask] = useState("Write a haiku about autumn.");
  const [reference, setReference] = useState("Golden leaves and crisp air—keep it 5/7/5.");
  const [modelSlug, setModelSlug] = useState("mistral:7b");
  const [judgeModel, setJudgeModel] = useState("mistral:7b");

  // Results
  const [generation, setGeneration] = useState<GenerationResp | null>(null);
  const [candidate, setCandidate] = useState<string>("");
  const [judgeScores, setJudgeScores] = useState<JudgeScores | null>(null);
  const [metrics, setMetrics] = useState<MetricsMap | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [busyGenerate, setBusyGenerate] = useState(false);
  const [busyEval, setBusyEval] = useState(false);

  useEffect(() => {
    if (generation?.output) setCandidate(generation.output);
  }, [generation?.id]);

  const canEvaluate = useMemo(
    () => !!generation?.id && !!reference.trim() && !!(candidate ?? "").trim(),
    [generation, reference, candidate]
  );

  async function handleGenerate() {
    setBusyGenerate(true);
    setError(null);
    setJudgeScores(null);
    setMetrics(null);
    setGeneration(null);
    setCandidate("");

    try {
      const data = await api.generate(modelSlug, task);
      setGeneration(data);
      setCandidate(data.output || "");
    } catch (e: any) {
      setError(`Generate failed: ${e?.message || String(e)}`);
    } finally {
      setBusyGenerate(false);
    }
  }

  async function handleEvaluate() {
    if (!generation) return;
    setBusyEval(true);
    setError(null);
    setJudgeScores(null);
    setMetrics(null);

    try {
      const [m, j] = await Promise.all([
        api.evaluateMetrics(generation.id, reference),
        api.judge(generation.id, reference, candidate, judgeModel),
      ]);

      setMetrics(m.metrics || null);
      setJudgeScores(j || null);
    } catch (e: any) {
      setError(`Evaluation failed: ${e?.message || String(e)}`);
    } finally {
      setBusyEval(false);
    }
  }

  const busy = busyGenerate || busyEval;

  return (
    <div className="ai-app">
      <div className="ai-background">
        <div className="neural-network">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className={`neural-node node-${i % 5}`} />
          ))}
        </div>
      </div>

      <Header busy={busy} />

      <main className="container-fluid py-4">
        <div className="row g-4 max-width-container mx-auto">
          <div className="col-12">
            <TaskGenerator
              task={task}
              setTask={setTask}
              modelSlug={modelSlug}
              setModelSlug={setModelSlug}
              onGenerate={handleGenerate}
              busy={busyGenerate}
            />
          </div>

          <div className="col-12 col-xl-6">
            <ReferenceEditor reference={reference} setReference={setReference} />
          </div>

          <div className="col-12 col-xl-6">
            <CandidateEditor
              candidate={candidate}
              setCandidate={setCandidate}
              generationId={generation?.id}
            />
          </div>

          <div className="col-12">
            <EvaluationPanel
              judgeModel={judgeModel}
              setJudgeModel={setJudgeModel}
              onEvaluate={handleEvaluate}
              disabled={!canEvaluate}
              busy={busyEval}
            />

            {/* Judge scores (0–10) */}
            <div className="row g-4 mb-4">
              <div className="col-6 col-lg-3">
                <ScoreCard label="Correctness" value={judgeScores?.correctness} icon="fas fa-check" />
              </div>
              <div className="col-6 col-lg-3">
                <ScoreCard label="Relevance" value={judgeScores?.relevance} icon="fas fa-bullseye" />
              </div>
              <div className="col-6 col-lg-3">
                <ScoreCard label="Fluency" value={judgeScores?.fluency} icon="fas fa-language" />
              </div>
              <div className="col-6 col-lg-3">
                <ScoreCard label="Overall" value={judgeScores?.overall} icon="fas fa-trophy" emphasize />
              </div>
            </div>

            {/* Classic metrics (0–1) */}
            <div className="row g-4">
              <div className="col-6 col-lg-3">
                <ScoreCard label="BLEU" value={metrics?.bleu ?? null} icon="fas fa-code" max={1} />
              </div>
              <div className="col-6 col-lg-3">
                <ScoreCard label="ROUGE-1" value={metrics?.rouge1 ?? null} icon="fas fa-ruler" max={1} />
              </div>
              <div className="col-6 col-lg-3">
                <ScoreCard label="ROUGE-L" value={metrics?.rougeL ?? null} icon="fas fa-ruler-vertical" max={1} />
              </div>
              <div className="col-6 col-lg-3">
                <ScoreCard label="Cosine" value={metrics?.cosine ?? null} icon="fas fa-vector-square" max={1} />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mt-4 ai-alert" role="alert">
                <i className="fas fa-exclamation-triangle me-2" />
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>

        <footer className="text-center mt-5 py-4">
          <div className="ai-footer-content">
            <p className="mb-2 text-light">
              <i className="fas fa-info-circle me-2" />
              CORS tip: allow your React origin in Django and set{" "}
              <code className="mx-2 px-2 py-1 bg-dark rounded">VITE_API_BASE_URL</code>
            </p>
            <small className="text-light opacity-75">Judge Playground — AI Model Evaluation Platform</small>
          </div>
        </footer>
      </main>
    </div>
  );
}
