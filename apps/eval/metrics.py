import sacrebleu
from rouge_score import rouge_scorer
from sentence_transformers import SentenceTransformer
import numpy as np

_EMB = None
def _embedder():
    global _EMB
    if _EMB is None:
        _EMB = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _EMB

def compute_bleu(candidate: str, reference: str) -> float:
    return sacrebleu.corpus_bleu([candidate], [[reference]]).score

def compute_rouge(candidate: str, reference: str) -> dict:
    scorer = rouge_scorer.RougeScorer(['rouge1','rougeLsum'], use_stemmer=True)
    r = scorer.score(reference, candidate)
    return {"rouge1": r["rouge1"].fmeasure, "rougeL": r["rougeLsum"].fmeasure}

def compute_cosine(candidate: str, reference: str) -> float:
    m = _embedder()
    emb = m.encode([candidate, reference], normalize_embeddings=True)
    return float(np.dot(emb[0], emb[1]))
# --- aliases expected by the views ---
def bleu(candidate: str, reference: str) -> float:
    return compute_bleu(candidate, reference)

def rouge(candidate: str, reference: str) -> dict:
    return compute_rouge(candidate, reference)

def cosine(candidate: str, reference: str) -> float:
    return compute_cosine(candidate, reference)
