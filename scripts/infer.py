import requests, json
url = "http://127.0.0.1:8000/api/inference/generate/"
payload = {
  "model_slug": "gemma3-4b-ollama",
  "prompt": "Write one sentence about Porto and the Douro river.",
  "params": {"temperature":0.7,"top_p":0.9,"top_k":40,"max_new_tokens":64}
}
r = requests.post(url, json=payload, timeout=120)
r.raise_for_status()
print(json.dumps(r.json(), indent=2))
