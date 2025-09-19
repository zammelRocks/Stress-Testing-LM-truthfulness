// src/components/PromptPanel.tsx
import { useState } from "react";
import { api } from "../api";
import type { GenerationResp } from "../types";

interface Props {
  defaultModel?: string;
  onGenerated: (gen: GenerationResp) => void;
  onError: (msg: string, detail?: any) => void;
  busy?: boolean;
  setBusy: (v: boolean) => void;
}

export default function PromptPanel({
  defaultModel = "mistral:7b",
  onGenerated,
  onError,
  busy,
  setBusy,
}: Props) {
  const [prompt, setPrompt] = useState("Write a haiku about autumn.");
  const [model, setModel] = useState(defaultModel);

  async function handleGenerate() {
    setBusy(true);
    onError(""); // clear
    try {
      const gen = await api.generate(model, prompt);
      onGenerated(gen as GenerationResp);
    } catch (e: any) {
      onError(`Generate failed${e?.status ? ` (HTTP ${e.status})` : ""}: ${e?.message || "Unknown"}`, e?.json ?? e?.body);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-card h-100">
      <div className="ai-card-header">
        <div className="d-flex align-items-center">
          <div className="ai-icon me-3"><i className="fas fa-robot" /></div>
          <div>
            <h5 className="mb-1 text-white">Task Generation</h5>
            <small className="text-light opacity-75">Configure your model & prompt</small>
          </div>
        </div>
      </div>

      <div className="ai-card-body">
        <div className="row g-4">
          <div className="col-lg-8">
            <label className="form-label ai-label"><i className="fas fa-edit me-2" />Task Prompt</label>
            <textarea
              className="form-control ai-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="col-lg-4">
            <label className="form-label ai-label"><i className="fas fa-cog me-2" />Model Slug</label>
            <input
              className="form-control ai-input mb-3"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. mistral:7b"
            />
            <button
              onClick={handleGenerate}
              disabled={!!busy || !prompt.trim() || !model.trim()}
              className="btn ai-btn-primary w-100"
            >
              {busy ? (<><span className="spinner-border spinner-border-sm me-2" />Generating…</>) : (<><i className="fas fa-play me-2" />Generate Response</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
