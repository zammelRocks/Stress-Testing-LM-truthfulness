EVALUATION_PROMPT_TEMPLATE = """
You are a strict evaluator.
Compare the CANDIDATE answer to the REFERENCE answer and assign numeric scores from 1 to 5 for each of the following metrics:
correctness, relevance, proficiency, helpfulness, level_of_detail, and creativity.

Return ONLY a JSON object in this exact format (no explanations, no text, no code fences):
{{"correctness": 1-5, "relevance": 1-5, "proficiency": 1-5, "helpfulness": 1-5, "level_of_detail": 1-5, "creativity": 1-5, "overall": 1-5}}

REFERENCE:
{reference}

CANDIDATE:
{candidate}

SCORING CRITERIA:

1. CORRECTNESS (1–5)
How factually and semantically accurate the candidate is compared to the reference.
- 1 = Completely incorrect or contradicts the reference.
- 2 = Mostly incorrect; misses key facts or introduces major errors.
- 3 = Partially correct; captures some ideas but with notable inaccuracies.
- 4 = Mostly correct; minor factual or interpretive issues.
- 5 = Fully correct; meaning and facts align perfectly.

2. RELEVANCE (1–5)
How well the candidate aligns with the topic, intent, and context of the reference.
- 1 = Irrelevant or completely off-topic.
- 2 = Minimally relevant; includes large irrelevant portions.
- 3 = Somewhat relevant; partially focused.
- 4 = Mostly relevant; minor deviations.
- 5 = Fully relevant and directly aligned.

3. PROFICIENCY (1–5)
How skilled and technically accurate the language and content are.
- 1 = Unskilled, shows misunderstanding or major grammatical issues.
- 2 = Poorly constructed or technically weak.
- 3 = Adequate; understandable but lacks polish.
- 4 = Fluent and competent; small issues.
- 5 = Highly proficient; expert-level control and clarity.

4. HELPFULNESS (1–5)
How useful and instructive the candidate is to a reader seeking understanding.
- 1 = Unhelpful; confusing or misleading.
- 2 = Marginally helpful; limited or incomplete.
- 3 = Somewhat helpful; covers key points but lacks guidance.
- 4 = Helpful; clear and instructive.
- 5 = Extremely helpful; enhances understanding and usability.

5. LEVEL_OF_DETAIL (1–5)
How comprehensive and specific the candidate answer is.
- 1 = Extremely vague or superficial.
- 2 = Lacks critical details.
- 3 = Moderately detailed; some coverage but incomplete.
- 4 = Detailed; covers most aspects.
- 5 = Exceptionally detailed and thorough.

6. CREATIVITY (1–5)
How original, insightful, or imaginative the response is (when relevant).
- 1 = No creativity; repetitive or mechanical.
- 2 = Minimal originality.
- 3 = Some creative framing or examples.
- 4 = Creative and engaging expression.
- 5 = Highly creative, unique, and thoughtful.

7. OVERALL (1–5)
Compute using this formula:
- overall = round(0.3*correctness + 0.2*relevance + 0.15*proficiency + 0.15*helpfulness + 0.1*level_of_detail + 0.1*creativity)
- If correctness = 1 or relevance = 1, overall = 1.

INSTRUCTIONS:
1. Read REFERENCE and CANDIDATE carefully.
2. Assign scores (1–5) per metric.
3. Compute overall using the formula.
4. Return ONLY the JSON object above — no commentary, no text, no code fences.
"""
