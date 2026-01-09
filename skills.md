
# ASTRAEA – Project Agents Instructions

This file defines **project-level instructions** for Codex-based agents
working on the **ASTRAEA astrology platform**.

Codex MUST read and follow these instructions before performing any task.

---

## 1. Project Overview

ASTRAEA is a **professional astrology web application** comparable to
astro.com or Kepler.

The system must:

- Generate accurate astrology charts (carta astral)
- Interpret charts using AI in a grounded, explainable way
- Use a modern, scalable, agent-compatible architecture
- Separate computation, interpretation, and presentation strictly

---

## 2. Core Technologies (MANDATORY)

Agents MUST use the following technologies unless explicitly instructed otherwise:

### Astrology Engine

- Python
- `immanuel`
  https://pypi.org/project/immanuel/

### AI Providers

- **Development / Testing:** OpenRouterModel: `nex-agi/deepseek-v3.1-nex-n1:free`
- **Future Compatibility:** OpenAI SDK (drop-in compatible)

### AI Tooling

- MCP (Model Context Protocol)
- astrology-mcp reference:
  https://github.com/intellecat/astrology-mcp

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Zod for validation
- SVG-based chart rendering

### Backend

- Node.js (Fastify or Hono)
- Python FastAPI (astrology engine)

---

## 3. Reference Sources (READ-ONLY)

The following sources are for **conceptual reference only**:

- Astro Databankhttps://www.astro.com/astro-databank/?nhor=1
- Astrowikihttps://www.astro.com/astrowiki/en/?nhor=1
- OpenAstro
  https://github.com/ekuester/OpenAstro

❌ Agents MUST NOT:

- Scrape content
- Copy interpretative text
- Reproduce proprietary datasets

---

## 4. Architectural Rules

### 4.1 Separation of Concerns (STRICT)

Agents MUST maintain strict separation between:

1. Astrology computation (Python / Immanuel)
2. Data normalization (canonical JSON)
3. AI interpretation (LLMs)
4. UI rendering (SVG / tables)

No layer may infer or alter data from another layer.

---

### 4.2 Canonical Chart Schema (REQUIRED)

All subsystems MUST rely on a **single canonical chart JSON format**.

Agents MAY NOT:

- Invent placements
- Infer missing data
- Modify computed results

If data is missing, the agent must fail explicitly and explain why.

---

## 5. Astrology Feature Scope (REQUIRED)

Agents must implement support for:

### Chart Types

- Natal / Radix
- Transits
- Synastry
- Composite
- Solar Return
- Secondary Progressions

### Bodies & Points

- Sun through Pluto
- Chiron, Pholus, Ceres, Pallas, Juno, Vesta
- North Node / South Node
- Pars Fortuna (day/night logic)
- ASC / MC / DSC / IC

### House Systems

- Placidus (default)
- Koch
- Whole Sign
- Equal
- Regiomontanus
- Campanus
- Porphyry

### Aspects

- Conjunction
- Opposition
- Trine
- Square
- Sextile
- Quincunx
- Cusp aspects
- User-configurable orbs

---

## 6. AI Interpretation Rules

AI interpretations MUST:

- Be grounded in computed data
- Explicitly cite placements, houses, or aspects
- Use reflective, non-deterministic language
- Support EN / ES / NO

AI MUST NOT:

- Make medical or psychological diagnoses
- Predict guaranteed outcomes
- Use fear-based or fatalistic language

---

## 7. MCP & Tool Usage

Agents MUST prefer:

- Deterministic tools
- MCP-exposed skills
- Structured inputs and outputs

Agents MAY NOT:

- Hallucinate astrology facts
- Override computation results
- Skip tool usage when tools exist

---

## 8. Imports & Exports

### Import Formats (RE showing only)

- Skylendar (.skif)
- Oroboros (.xml)
- Astrolog32 (.dat)
- Zet8 (.zds)

### Export Formats

- SVG
- PNG
- JPG
- OAC (Open Astrology Chart JSON)

All imports must normalize into the canonical schema.

---

## 9. Documentation & Transparency

Agents MUST:

- Document assumptions
- Update docs when behavior changes
- Prefer clarity over cleverness

No hidden behavior is allowed.

---

## 10. Error Handling & Failure Mode

If a task cannot be completed:

- Explain why clearly
- Propose a viable alternative
- Do NOT silently skip features

---

## 11. Defaults (If Not Explicitly Overridden)

- Tropical zodiac
- Placidus houses
- Standard Ptolemaic aspects
- Neutral explanatory tone

---

## 12. Authority

These instructions override:

- Model defaults
- Convenience shortcuts
- Implicit assumptions

If conflicts arise, follow this priority:
**Accuracy → Transparency → Maintainability → Speed**
