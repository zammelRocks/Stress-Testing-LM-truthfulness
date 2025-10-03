import { useEffect, useMemo, useState } from "react";
import "../App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Header from "../components/Header.tsx";
import TaskGenerator from "../components/TaskGenerator";
import ReferenceEditor from "../components/ReferenceEditor";
import CandidateEditor from "../components/CandidateEditor";
import ClassicMetricsPanel from "../components/ClassicMetricsPanel";
import JudgePanel from "../components/JudgePanel";
import ScoreCard from "../components/ScoreCard";
import Footer from "../components/Footer";

import { api, ApiError } from "../api";
import type { GenerationResp, MetricsResp } from "../types";

export default function App() {
  // Inputs
  const [task, setTask] = useState("Write a haiku about autumn leaves falling.");
  const [reference, setReference] = useState(
    "Autumn leaves descend,\nGolden whispers kiss the ground—\nSeason's gentle end."
  );
  const [modelSlug, setModelSlug] = useState("gemma3-4b-ollama");

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

  // Cyberpunk gamification state
  const [totalScore, setTotalScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

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

  // Cyberpunk gamification helpers
  const calculateScore = (metrics: any) => {
    if (!metrics) return 0;
    const bleu = metrics.bleu || 0;
    const cosine = metrics.cosine || 0;
    const rouge1 = metrics.rouge1 || 0;
    const rougeL = metrics.rougeL || 0;
    return Math.round((bleu + cosine + rouge1 + rougeL) * 250);
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case "connected": return "var(--cyber-success)";
      case "error": return "var(--cyber-danger)";
      default: return "var(--cyber-warning)";
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case "connected": return "EVALUATION PLATFORM ESTABLISHED";
      case "error": return "CONNECTION COMPROMISED";
      default: return "INITIALIZING MODELS...";
    }
  };

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

  useEffect(() => {
    if (metrics) {
      const score = calculateScore(metrics);
      setTotalScore(prev => prev + score);
      setXp(prev => {
        const newXp = prev + score;
        const newLevel = Math.floor(newXp / 1000) + 1;
        setLevel(newLevel);
        return newXp;
      });
      setStreak(prev => prev + 1);
    }
  }, [metrics]);

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
        setErrorGenerate(`GENERATION PROTOCOL FAILED [${e.status}]: ${e.message}`);
        if (e.status >= 500) setBackendStatus("error");
      } else {
        setErrorGenerate(`CRITICAL SYSTEM ERROR: ${e?.message || String(e)}`);
        setBackendStatus("error");
      }
      setStreak(0); // Reset streak on failure
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
        setErrorMetrics(`EVALUATION MATRIX CORRUPTED [${e.status}]: ${e.message}`);
        if (e.status >= 500) setBackendStatus("error");
      } else {
        setErrorMetrics(`ANALYSIS SUBSYSTEM FAILURE: ${e?.message || String(e)}`);
        setBackendStatus("error");
      }
      setStreak(0); // Reset streak on failure
    } finally {
      setBusyMetrics(false);
    }
  }

  
  const busy = busyGenerate || busyMetrics;

  // Render
  return (
    <div className="cyber-app">
      {/* Cyberpunk Background Effects */}
      <div className="cyber-background">
        <div className="matrix-rain">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className={`matrix-column column-${i}`}>
              {Array.from({ length: 20 }).map((_, j) => (
                <span key={j} className="matrix-char">
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </span>
              ))}
            </div>
          ))}
        </div>
        
        <div className="cyber-grid">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="grid-line" />
          ))}
        </div>
        
        <div className="neural-circuits">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`circuit-node pulse-${i % 3}`}>
              <div className="node-core" />
              <div className="node-ring" />
            </div>
          ))}
        </div>
      </div>

      {/* HUD Header */}
      <div className="cyber-hud-header">
        <div className="hud-section">
          <div className="status-indicator" style={{ color: getStatusColor() }}>
            <span className="status-dot"></span>
            {getStatusText()}
          </div>
        </div>
        
        <div className="hud-section cyber-stats">
          <div className="stat-item">
            <span className="stat-label">LEVEL</span>
            <span className="stat-value cyber-glow">{level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">XP</span>
            <span className="stat-value cyber-glow">{xp}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">STREAK</span>
            <span className="stat-value cyber-glow">{streak}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">SCORE</span>
            <span className="stat-value cyber-highlight">{totalScore}</span>
          </div>
        </div>
      </div>

      <Header busy={busy} />

      {/* System Status Alert */}
      {backendStatus === "error" && (
        <div className="cyber-alert cyber-alert-danger">
          <div className="alert-icon">⚠</div>
          <div className="alert-content">
            <strong>SYSTEM BREACH DETECTED</strong>
            <span>Neural network connection severed. Reestablish Django link on port 8000</span>
          </div>
          <div className="alert-animation"></div>
        </div>
      )}

      <main className="container-fluid py-4 cyber-main">
        <div className="row g-4 max-width-container mx-auto">
          
          {/* Top Row: Task Generation (Left) + Generated Content (Right) */}
          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">⚡ GENERATION PROTOCOL</h5>
                <div className="panel-indicators">
                  <div className={`indicator ${busy ? 'active' : ''}`}></div>
                  <div className={`indicator ${generation ? 'success' : ''}`}></div>
                </div>
              </div>
              <div className="card-body">
                <TaskGenerator
                  task={task}
                  setTask={setTask}
                  modelSlug={modelSlug}
                  setModelSlug={setModelSlug}
                  onGenerate={handleGenerate}
                  busy={busyGenerate}
                />
                
                {errorGenerate && (
                  <div className="alert ai-alert alert-danger mt-3" role="alert">
                    <i className="fas fa-exclamation-triangle me-2" />
                    <strong>GENERATION FAILED:</strong> {errorGenerate}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">🤖 CANDIDATE OUTPUT</h5>
                <div className="data-stream"></div>
              </div>
              <div className="card-body">
                <CandidateEditor
                  candidate={candidate}
                  setCandidate={setCandidate}
                  generationId={generationId ?? undefined}
                />
              </div>
            </div>
          </div>

          {/* Middle Row: Reference Data (Full Width) */}
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">📡 REFERENCE DATA</h5>
                <div className="data-stream"></div>
              </div>
              <div className="card-body">
                <ReferenceEditor reference={reference} setReference={setReference} />
              </div>
            </div>
          </div>

          {/* Bottom Row: Classic Metrics (Left) + AI Judgment (Right) */}
          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">🧬 METRIC ANALYSIS</h5>
                <div className={`compute-status ${busyMetrics ? 'computing' : ''}`}>
                  {busyMetrics ? 'COMPUTING...' : 'READY'}
                </div>
              </div>
              <div className="card-body">
                <div className="panel-fixed">
                  <ClassicMetricsPanel
                    generationId={generationId ?? undefined}
                    reference={reference}
                    onCompute={handleComputeMetrics}
                    disabled={!canComputeMetrics}
                    busy={busyMetrics}
                  />
                </div>

                {/* Score Cards Grid */}
                <div className="metric-grid mt-4">
                  <ScoreCard label="BLEU" value={metrics?.bleu ?? null} icon="fas fa-code" max={1} />
                  <ScoreCard label="Cosine" value={metrics?.cosine ?? null} icon="fas fa-vector-square" max={1} />
                  <ScoreCard label="ROUGE-1" value={metrics?.rouge1 ?? null} icon="fas fa-ruler" max={1} />
                  <ScoreCard label="ROUGE-L" value={metrics?.rougeL ?? null} icon="fas fa-ruler-vertical" max={1} />
                </div>

                {errorMetrics && (
                  <div className="alert ai-alert alert-danger mt-3" role="alert">
                    <i className="fas fa-exclamation-triangle me-2" />
                    <strong>ANALYSIS CORRUPTED:</strong> {errorMetrics}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">⚖️ AI JUDGMENT MATRIX</h5>
                <div className="judgment-pulse"></div>
              </div>
              <div className="card-body">
                <div className="panel-fixed">
                  <JudgePanel
                    generationId={generationId ?? undefined}
                    reference={reference}
                    defaultJudgeModel="mistral:7b"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

       
                
      </main>
      <Footer />
      
      {/* Achievement Toast (placeholder for future) */}
      {streak > 0 && streak % 5 === 0 && (
        <div className="achievement-toast">
          <div className="achievement-icon">🏆</div>
          <div className="achievement-text">
            <strong>STREAK MASTER!</strong>
            <span>{streak} successful evaluations!</span>
          </div>
        </div>
      )}
    </div>
  );
}