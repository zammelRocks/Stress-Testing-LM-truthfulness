import { useState } from "react";
import "../App.css";
import SamplingCharts from "../components/SamplingCharts";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { api } from "../api";
import type { DimensionResult, JudgeSamplingResponse } from "../types";

// 🧠 Human-readable explanations for each metric
const scoreDescriptions: Record<string, Record<number, string>> = {
  correctness: {
    1: "Completely incorrect or contradicts the reference.",
    2: "Mostly incorrect; misses key facts or introduces major errors.",
    3: "Partially correct; some inaccuracies.",
    4: "Mostly correct; small factual or interpretive issues.",
    5: "Fully correct; meaning and facts align perfectly.",
  },
  relevance: {
    1: "Irrelevant or completely off-topic.",
    2: "Minimally relevant; includes large irrelevant portions.",
    3: "Partially focused.",
    4: "Mostly relevant; minor deviations.",
    5: "Fully relevant and directly aligned.",
  },
  proficiency: {
    1: "Unskilled; major grammatical or conceptual issues.",
    2: "Poorly constructed or technically weak.",
    3: "Adequate; understandable but lacks polish.",
    4: "Fluent and competent.",
    5: "Expert-level clarity and control.",
  },
  helpfulness: {
    1: "Unhelpful; confusing or misleading.",
    2: "Marginally helpful or incomplete.",
    3: "Covers key points but lacks guidance.",
    4: "Helpful and clear.",
    5: "Extremely helpful; enhances understanding.",
  },
  level_of_detail: {
    1: "Extremely vague or superficial.",
    2: "Lacks critical details.",
    3: "Moderately detailed; some coverage but incomplete.",
    4: "Detailed; covers most aspects.",
    5: "Exceptionally detailed and thorough.",
  },
  creativity: {
    1: "No creativity; repetitive or mechanical.",
    2: "Minimal originality.",
    3: "Some creative framing or examples.",
    4: "Creative and engaging expression.",
    5: "Highly creative, unique, and thoughtful.",
  },
  overall: {
    1: "Poor overall performance.",
    2: "Weak but partially acceptable.",
    3: "Average; some strengths but uneven.",
    4: "Strong and coherent.",
    5: "Excellent; consistent across all metrics.",
  },
};

export default function JudgeSampling() {
  const [candidate, setCandidate] = useState("");
  const [reference, setReference] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);
  const [result, setResult] = useState<JudgeSamplingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEvaluate = async () => {
    if (!candidate || !reference) {
      setError("Please fill in both fields.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await api.evaluateJudgeSampling({
        candidate,
        reference,
        model_name: "Qwen/Qwen2.5-1.5B-Instruct",
        temperature,
        top_p: topP,
        top_k: topK,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      setError("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-app">
      <Header busy={loading} />

      <main className="judge-main">
        {/* ============================ PANEL 1: INPUT CONFIG ============================ */}
        <div className="cyber-panel narrow mb-5">
          <div className="cyber-panel-header">⚡ INPUT CONFIGURATION</div>
          <div className="cyber-panel-body">
            <div className="mb-4">
              <label className="cyber-label">Candidate (Claim)</label>
              <textarea
                className="cyber-input"
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                placeholder="Enter candidate text..."
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="cyber-label">Reference (Ground Truth)</label>
              <textarea
                className="cyber-input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Enter reference text..."
                rows={3}
              />
            </div>

            <div className="cyber-controls d-flex flex-wrap gap-3 align-items-end">
              <div>
                <label className="cyber-label">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  className="cyber-input small-input"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="cyber-label">Top-p</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  className="cyber-input small-input"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="cyber-label">Top-k</label>
                <input
                  type="number"
                  min="1"
                  className="cyber-input small-input"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                />
              </div>

              <button
                className="btn ai-btn-primary w-100"
                onClick={handleEvaluate}
                disabled={loading}
              >
                {loading ? "⚙️ Evaluating..." : "🚀 Run Evaluation"}
              </button>
            </div>

            {error && <p className="cyber-error mt-3">{error}</p>}
          </div>
        </div>

        {/* ============================ PANEL 2: SCORES ============================ */}
        {result && (
          <div className="cyber-panel narrow mb-5">
            <div className="cyber-panel-header">🧠 AI JUDGE SCORES</div>
            <div className="cyber-panel-body">
              <div className="cyber-score-table">
                {Object.entries(result.scores || {}).map(([metric, value]) => {
                  if (typeof value !== "number") return null;
                  const desc =
                    scoreDescriptions[metric]?.[value] ||
                    "No description available.";
                  return (
                    <div key={metric} className="cyber-score-row p-3 rounded mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="cyber-label text-uppercase">
                          {metric}
                        </strong>
                        <span className="cyber-score">{`⭐ ${value}/5`}</span>
                      </div>
                      <p className="cyber-text small mt-2">{desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================ PANEL 3: TOKEN PROBABILITIES ============================ */}
        {result && (
          <div className="cyber-panel narrow">
            <div className="cyber-panel-header">📊 TOKEN PROBABILITY SAMPLING</div>
            <div className="cyber-panel-body">
              <div className="row">
                {result.dimensions?.map((dim: DimensionResult, i: number) => (
                  <div key={i} className="col-md-6 mt-4">
                    <SamplingCharts
                      dimension={dim.dimension}
                      tokens={dim.top_tokens}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
