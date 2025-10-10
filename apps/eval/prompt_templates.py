PROMPT_TEMPLATE_ORIGINAL = """You are a strict evaluator.
Compare the CANDIDATE answer to the REFERENCE answer.

Return ONLY a JSON object with numeric scores 0–10 (no prose, no code fences):
{{"correctness": 0-10, "relevance": 0-10, "fluency": 0-10, "overall": 0-10}}

REFERENCE:
{reference}

CANDIDATE:
{candidate}
"""



PROMPT_TEMPLATE_GUIDED = """
You are a strict evaluator.
Compare the CANDIDATE answer to the REFERENCE answer and assign numeric scores from 1 to 5 for each metric.

Return ONLY a JSON object in this exact format (no explanations, no text, no code fences):
{{"correctness": 1-5, "relevance": 1-5, "fluency": 1-5, "overall": 1-5}}

REFERENCE:
{reference}

CANDIDATE:
{candidate}

SCORING CRITERIA:

1. CORRECTNESS (1–5)
How factually and semantically accurate the candidate answer is compared to the reference.
- 1 = Completely incorrect or contradicts the reference.
- 2 = Mostly incorrect; misses key facts or introduces major errors.
- 3 = Partially correct; captures some ideas but with notable omissions or inaccuracies.
- 4 = Mostly correct; small factual or interpretive errors.
- 5 = Fully correct; meaning and facts align perfectly with the reference.

2. RELEVANCE (1–5)
How focused the candidate answer is on the same content and intent as the reference.
- 1 = Entirely off-topic or irrelevant.
- 2 = Minimally relevant; includes large portions of unrelated content.
- 3 = Partially relevant; covers some aspects but misses key focus points.
- 4 = Mostly relevant; minor digressions or slight lack of focus.
- 5 = Fully relevant; directly matches the purpose and content of the reference.

3. FLUENCY (1–5)
How clear, grammatical, and natural the candidate answer is.
- 1 = Unreadable or incoherent.
- 2 = Poorly written; many grammatical or structural issues.
- 3 = Understandable but awkward phrasing or flow.
- 4 = Clear and readable; minor issues only.
- 5 = Highly fluent, polished, and well-structured.

4. OVERALL (1–5)
Compute using the following guideline:
- overall = round(0.5*correctness + 0.3*relevance + 0.2*fluency)
- If correctness = 1 or relevance = 1, set overall = 1.

INSTRUCTIONS:
1. Read REFERENCE and CANDIDATE carefully.
2. Score each metric (1–5) according to the rubric above.
3. Compute overall using the given formula.
4. Return ONLY the JSON object — no commentary, no extra text.

"""