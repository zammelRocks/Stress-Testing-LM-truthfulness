// src/components/EvaluateJudgeDataset.tsx
import React, { useState, useMemo } from "react";
import { api } from "../api";
import type { LabelDatasetRowResult, JudgeScores } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  rows: LabelDatasetRowResult[];
  previewLimit?: number;
}

const EvaluateJudgeDataset: React.FC<Props> = ({ rows, previewLimit = 3 }) => {
  const [judgeResults, setJudgeResults] = useState<
    Record<number, JudgeScores & { error?: string }>
  >({});
  const [loading, setLoading] = useState(false);

  const runJudgePreview = async () => {
    setLoading(true);
    const results: Record<number, JudgeScores & { error?: string }> = {};
    const previewRows = rows.slice(0, previewLimit);

    for (let i = 0; i < previewRows.length; i++) {
      const row = previewRows[i];
      try {
        const res = await api.judge(
          row.generation_id ?? i,
          row.reference,
          row.justification
        );
        results[row.generation_id ?? i] = res;
      } catch (err: any) {
        results[row.generation_id ?? i] = {
          correctness: 0,
          relevance: 0,
          fluency: 0,
          overall: 0,
          error: err.message || "Judge failed",
        };
      }
    }
    setJudgeResults(results);
    setLoading(false);
  };

  const downloadFull = async () => {
    const results: (LabelDatasetRowResult & JudgeScores)[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const res = await api.judge(
          row.generation_id ?? i,
          row.reference,
          row.justification
        );
        results.push({ ...row, ...res });
      } catch {
        results.push({
          ...row,
          correctness: 0,
          relevance: 0,
          fluency: 0,
          overall: 0,
        });
      }
    }

    const header = [
      "claim",
      "reference",
      "justification",
      "correctness",
      "relevance",
      "fluency",
      "overall",
    ];
    const csvRows = [
      header.join(","),
      ...results.map((r) =>
        [
          `"${r.claim}"`,
          `"${r.reference}"`,
          `"${r.justification}"`,
          r.correctness,
          r.relevance,
          r.fluency,
          r.overall,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "judge_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /** 📈 Line chart data: per-row judge results */
  const lineData = useMemo(() => {
    return rows.slice(0, previewLimit).map((row, idx) => {
      const scores = judgeResults[row.generation_id ?? idx];
      return {
        index: idx + 1,
        correctness: scores?.correctness ?? 0,
        relevance: scores?.relevance ?? 0,
        fluency: scores?.fluency ?? 0,
        overall: scores?.overall ?? 0,
      };
    });
  }, [judgeResults, rows, previewLimit]);

  /** 📊 Aggregate average scores */
  const aggregateData = useMemo(() => {
    const values = Object.values(judgeResults);
    if (values.length === 0) return [];
    const total = values.length;
    const correctness = values.reduce((sum, r) => sum + r.correctness, 0) / total;
    const relevance = values.reduce((sum, r) => sum + r.relevance, 0) / total;
    const fluency = values.reduce((sum, r) => sum + r.fluency, 0) / total;
    const overall = values.reduce((sum, r) => sum + r.overall, 0) / total;
    return [
      { metric: "Correctness", score: correctness },
      { metric: "Relevance", score: relevance },
      { metric: "Fluency", score: fluency },
      { metric: "Overall", score: overall },
    ];
  }, [judgeResults]);

  return (
    <div className="cyber-panel mt-4">
      <div className="panel-header d-flex justify-content-between align-items-center">
        <h3 className="panel-title"> LLM Judge Evaluation (mistral:7b)</h3>
        <div className="d-flex gap-3">
          <button
            className="btn-glow btn-glow-primary"
            disabled={loading}
            onClick={runJudgePreview}
          >
            {loading ? "Judging..." : " Run LLM Judge"}
          </button>
          <button
            className="btn-glow btn-glow-secondary"
            onClick={downloadFull}
          >
            Download Full Results
          </button>
        </div>
      </div>

      {/* Results table */}
      {Object.keys(judgeResults).length > 0 && (
        <>
          <div className="cyber-table-wrapper mt-3">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Reference</th>
                  <th>Justification</th>
                  <th>Correctness</th>
                  <th>Relevance</th>
                  <th>Fluency</th>
                  <th>Overall</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, previewLimit).map((row, idx) => {
                  const scores = judgeResults[row.generation_id ?? idx];
                  return (
                    <tr key={row.generation_id ?? idx}>
                      <td>{row.claim}</td>
                      <td>{row.reference}</td>
                      <td>{row.justification}</td>
                      <td>{scores?.correctness ?? "—"}</td>
                      <td>{scores?.relevance ?? "—"}</td>
                      <td>{scores?.fluency ?? "—"}</td>
                      <td className="cyber-highlight">
                        {scores?.overall ?? "—"}
                      </td>
                      <td className="text-danger">
                        {scores?.error ? `⚠️ ${scores.error}` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="mt-4">
            <h5>Judge Metrics Evolution (per row)</h5>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="correctness" stroke="#8884d8" />
                <Line type="monotone" dataKey="relevance" stroke="#82ca9d" />
                <Line type="monotone" dataKey="fluency" stroke="#ff7300" />
                <Line type="monotone" dataKey="overall" stroke="#413ea0" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4">
            <h5>Aggregate Judge Scores</h5>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aggregateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#e63946" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default EvaluateJudgeDataset;
