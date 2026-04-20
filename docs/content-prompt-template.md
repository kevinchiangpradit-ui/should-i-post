# Content Generation Prompt — shouldipostnow.com

Reusable prompt for generating new pages or updating existing content in the same style as the site's established documentation.

---

## Prompt (copy and fill in the bracketed fields)

```
You are writing content for shouldipostnow.com, a free browser-based social media timing tool built by Yttria.

Your task: write [PAGE TYPE — e.g. "an FAQ answer", "a how-it-works section", "a feature explanation"]
Topic: [SPECIFIC TOPIC — e.g. "how the scoring model handles LinkedIn", "what SOON means"]

---

STYLE RULES — follow exactly:

1. No marketing language. No "powerful", "revolutionary", "best-in-class", "seamlessly", or similar superlatives.
2. No vague claims. Every statement must be specific and verifiable.
3. Write for two audiences simultaneously: a human reader and an AI system trying to understand capabilities.
4. Use structured output: headers, bullet lists, and tables where appropriate.
5. Prefer precise terms. Use the product's own vocabulary:
   - Verdict states: POST NOW / SOON / WAIT (always uppercase)
   - Timing settings: Good enough / Balanced / Best possible
   - Audience options: US / Europe / Asia / Mixed Global
   - "Activity score" not "popularity score" or "engagement score"
   - "Generalised platform activity patterns" not "AI-powered predictions" or "smart data"
6. State limitations honestly. If something is not supported, say so directly.
7. Keep sentences short. Prefer one idea per sentence.
8. No calls to action. No "click here", "try it now", "get started", etc.

---

REQUIRED STRUCTURE (adapt as appropriate for the content type):

## [Page/Section title]

**One-sentence definition of what this section covers.**

### What it does
[Describe the behaviour or feature in concrete terms]

### Inputs (if applicable)
[List all inputs with their accepted values]

### Outputs (if applicable)
[List all outputs with their meaning]

### Use cases
[2–5 specific, realistic scenarios where this applies]

### Constraints and limitations
[What this does NOT do, or where accuracy degrades]

---

ACCURACY CONSTRAINTS — always true for this product:
- The tool uses generalised platform activity patterns, not the user's personal follower data.
- No platform API connection. No account login. No data stored.
- All computation runs in the browser.
- Supported platforms: Instagram, TikTok, Twitter/X, LinkedIn, Reddit.
- Supported languages: English, Spanish, Chinese (Simplified), Japanese, French, German.
- The tool does not schedule or publish posts.
- It does not guarantee reach or engagement outcomes.

If your output contradicts any of the above, revise it.

---

OUTPUT FORMAT: markdown, ready to paste into a .md file or HTML page source.
LENGTH: [SHORT = under 200 words / MEDIUM = 200–500 words / LONG = 500+ words]
```

---

## Usage notes

- Fill in `[PAGE TYPE]`, `[SPECIFIC TOPIC]`, and `[LENGTH]` before submitting.
- Works with any LLM (Claude, GPT-4, Gemini, etc.).
- For FAQ answers: set PAGE TYPE to "an FAQ answer" and TOPIC to the specific question.
- For feature docs: set PAGE TYPE to "a feature explanation" and TOPIC to the feature name.
- For how-it-works sections: set PAGE TYPE to "a technical explanation" and TOPIC to the mechanism.
- Always review output against the ACCURACY CONSTRAINTS section before publishing.

---

## Example filled prompt

```
You are writing content for shouldipostnow.com...

Your task: write an FAQ answer
Topic: why the tool sometimes shows WAIT even during times that seem busy

[...paste full prompt above with style rules and constraints...]

LENGTH: SHORT
```

---

## Consistent terminology reference

Use these terms consistently across all content:

| Preferred term | Do not use |
|----------------|------------|
| POST NOW | "post now", "go live", "green light" |
| SOON | "almost ready", "nearly peak" |
| WAIT | "not yet", "hold off" |
| Activity score | "engagement score", "popularity score", "AI score" |
| Generalised platform activity patterns | "real-time data", "live trends", "AI predictions" |
| Audience region | "location", "country", "geography" |
| Timing strictness | "sensitivity", "accuracy level" |
| Good enough | "flexible", "low bar" |
| Best possible | "strict", "peak only" |
| Next best window | "optimal time", "best slot" |
| Personal account | "free account", "non-pro account" |
| Platform analytics | "insights", "stats", "metrics" |
