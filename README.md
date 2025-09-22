# LLM testing and benchmarks Playground — Setup & Run Guide

A lightweight, end-to-end stack for generating model outputs, computing classic text similarity metrics (BLEU/ROUGE/Cosine), and getting LLM-as-a-Judge scores — with a Django REST backend and a React (Vite) frontend.
# System Page : Home page


<img width="1900" height="1030" alt="image" src="https://github.com/user-attachments/assets/ca5eea3e-a735-4384-8974-26583bd85267" />


# About Me Page : Let's Get in Touch
<img width="1918" height="1032" alt="image" src="https://github.com/user-attachments/assets/47fa68fe-d574-4601-892a-aab94eaaa74e" />

# choose and evaluate against a dataSet
<img width="1298" height="850" alt="image" src="https://github.com/user-attachments/assets/6c993795-a898-4063-a497-bb8306a4b33f" />
# Preview results and download for future Use
<img width="1252" height="851" alt="Screenshot 2025-09-22 012341" src="https://github.com/user-attachments/assets/d0ad22e6-7197-4baa-a0db-531037315b93" />

# Coming Soon : Compute Metrics  Using ROUGE,BLEU,Cosine,BertScore Or LLM-as-a-judge ..

# Coming Soon : Keep track of the dashboard, Visuals and graphs for Nerdies


# Future Work : Prompt injection evaluation, Jail breaking or Prompt Mining :3 will see
---

## 1) Prerequisites

* **Python** 3.10+ (3.11 recommended)
* **Node.js** 18+ and **npm** 9+ (or **pnpm**/**yarn**)
* **Git**
* (Optional) **Ollama** running locally if you’re using local models (e.g. `mistral:7b`)

  * Install from [https://ollama.com](https://ollama.com) and make sure it’s listening on `http://localhost:11434`
  * Pull a model you’ll use:
    `ollama pull mistral`  (or any model you configured in your app)

> Windows users: prefer using a terminal like PowerShell or Git Bash. If you see `npm ERR! could not determine executable to run`, re-install Node.js and ensure it’s on your PATH.

---

## 2) Project Structure (high-level)

```
thesis/
├─ manage.py
├─ thesis/                      # Django project settings and URLs
├─ apps/
│  ├─ inference/                # generation API (Ollama / backends)
│  ├─ eval/                     # metrics + judge APIs
│  └─ history/                  # Generation model & persistence
└─ frontend/                    # React + Vite app (UI)
```

---

## 3) Backend (Django) — Local Setup

### 3.1 Create & activate a virtualenv

```bash
cd thesis
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
```

### 3.2 Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3.3 Configure environment

Create a `.env` (or use your project’s settings mechanism) with at least:

```env
# Django
DEBUG=1
SECRET_KEY=dev-secret-key-change-me
ALLOWED_HOSTS=127.0.0.1,localhost

# CORS (allow the Vite dev server)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Ollama (if used)
OLLAMA_BASE_URL=http://127.0.0.1:11434

# Optional defaults for judge
JUDGE_MODEL_OLLAMA=mistral:7b
```

> Ensure `django-cors-headers` is installed and added to `INSTALLED_APPS` and `MIDDLEWARE` in settings (and `CORS_ALLOWED_ORIGINS` above is set).

### 3.4 Apply migrations

```bash
python manage.py migrate
```

### 3.5 (Optional) Create a superuser

```bash
python manage.py createsuperuser
```

### 3.6 Run the server

```bash
python manage.py runserver 0.0.0.0:8000
```

The API will be available at `http://127.0.0.1:8000`.

---

## 4) Frontend (React + Vite) — Local Setup

### 4.1 Install dependencies

```bash
cd frontend
npm install
```

### 4.2 Configure frontend env

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 4.3 Start the dev server

```bash
npm run dev
```

Open the UI at `http://127.0.0.1:5173`.

---

## 5) Key API Endpoints (for reference)

> All paths below are relative to `VITE_API_BASE_URL` (e.g., `http://127.0.0.1:8000`).

### Generation

* **POST** `/api/inference/generate/`
  Request:

  ```json
  { "model_slug": "mistral:7b", "prompt": "Write a haiku about autumn." }
  ```

  Response (example):

  ```json
  { "id": 33, "output": "Golden leaves...", "model": "mistral:7b", "prompt": "...", "created_at": "..." }
  ```

* **GET** `/api/inference/generations/` — list recent generations

* **GET** `/api/inference/generations/<id>/` — get one generation by id

### Classic Metrics

* **POST** `/api/evaluate/`
  Request:

  ```json
  {
    "generation_id": 33,
    "reference": "Golden leaves and crisp air—keep it 5/7/5.",
    "metrics": ["bleu", "rouge", "cosine"]
  }
  ```

  Response (example):

  ```json
  {
    "evaluation_id": 12,
    "metrics": { "bleu": 0.41, "rouge1": 0.58, "rougeL": 0.55, "cosine": 0.62 }
  }
  ```

### LLM-as-a-Judge

* **POST** `/api/evaluate/judge/`
  Request:

  ```json
  {
    "generation_id": 33,
    "reference": "Golden leaves and crisp air—keep it 5/7/5.",
    "judge_model": "mistral:7b"
  }
  ```

  Response (example):

  ```json
  { "correctness": 8.7, "relevance": 9.2, "fluency": 8.9, "overall": 9.0 }
  ```

> The judge uses the stored candidate text for `generation_id` on the server; you only pass the `reference` and optional `judge_model`.

---

## 6) Typical Local Workflow

1. **Start backend** (`python manage.py runserver`) and ensure Ollama is running (if applicable).
2. **Start frontend** (`npm run dev`).
3. In the UI:

   * Enter a prompt and model slug, click **Generate** → a `generation_id` is created.
   * Paste/enter your **Reference**.
   * Click **Compute Classic Metrics** to get BLEU/ROUGE/Cosine.
   * Click **Run Judge** to get correctness/relevance/fluency/overall from the selected judge model.

---

## 7) Troubleshooting

* **CORS errors in browser console**
  Add your frontend origin to `CORS_ALLOWED_ORIGINS` and restart Django. Example:

  ```
  CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
  ```

* **404 on `/api/generate/`**
  The correct paths (by default) are:

  * `/api/inference/generate/`
  * `/api/evaluate/`
  * `/api/evaluate/judge/`
    Ensure your frontend uses `VITE_API_BASE_URL=http://127.0.0.1:8000` and the API client calls the correct endpoints.

* **“No model matches” or empty outputs**
  Make sure the `model_slug` exists and Ollama (or your backend provider) has the model pulled/available. Example:

  ```
  ollama pull mistral
  ```

* **Judge returns parse errors**
  The judge expects JSON with `{ correctness, relevance, fluency, overall }`. If the model drifts, reduce temperature or use a more instruction-following judge model.

* **npm errors on Windows**
  Re-install Node.js from the official site and open a fresh terminal to ensure PATH is correct.

---

## 8) Running Tests (Backend)

```bash
# from the project root with the venv activated
python manage.py test
```

---

## 9) Production Notes (brief)

* Build a production frontend (`npm run build`) and serve static assets with a proper web server (or containerize).
* Use a proper DB (e.g., Postgres) for persistence in production.
* Lock model versions and pin Python/Node dependencies for reproducibility.
* Configure allowed hosts, HTTPS, and secure cookies; disable DEBUG.

---

## 10) Quick Verification (cURL)

```bash
# Generate
curl -X POST http://127.0.0.1:8000/api/inference/generate/ \
  -H "Content-Type: application/json" \
  -d '{"model_slug":"mistral:7b","prompt":"Write a haiku about autumn."}'

# Suppose it returns {"id":33, "output":"..." }

# Metrics
curl -X POST http://127.0.0.1:8000/api/evaluate/ \
  -H "Content-Type: application/json" \
  -d '{"generation_id":33,"reference":"Golden leaves and crisp air—keep it 5/7/5.","metrics":["bleu","rouge","cosine"]}'

# Judge
curl -X POST http://127.0.0.1:8000/api/evaluate/judge/ \
  -H "Content-Type: application/json" \
  -d '{"generation_id":33,"reference":"Golden leaves and crisp air—keep it 5/7/5.","judge_model":"mistral:7b"}'
```








