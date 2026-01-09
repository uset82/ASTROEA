# 🌌 ASTRAEA

## AI-Powered Astrology Platform (astro.com / Kepler-class)

**Goal:**

Create a **professional astrology web application** comparable to **astro.com** or  **Kepler** , capable of generating **accurate natal charts (carta astral)** and  **AI-based interpretations** , using  **modern web technologies** ,  **Python astrology engines** , and  **MCP-based AI tooling** .

model: "nex-agi/deepseek-v3.1-nex-n1:free"
API : "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"

model for recognize image google/gemini-2.0-flash-exp:free
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

---

## 🔭 CORE REFERENCES (MANDATORY)

### Astrology & Data

* **Immanuel (Python Astrology Engine)**

  [https://pypi.org/project/immanuel/](https://pypi.org/project/immanuel/)
* **OpenAstro (Swiss-Ephemeris-style logic & formats)**

  [https://github.com/ekuester/OpenAstro](https://github.com/ekuester/OpenAstro)
* **Astrology MCP (Model Context Protocol)**

  [https://github.com/intellecat/astrology-mcp](https://github.com/intellecat/astrology-mcp)

### Knowledge / Reference (READ-ONLY)

* Astro Databank

  [https://www.astro.com/astro-databank/?nhor=1](https://www.astro.com/astro-databank/?nhor=1)
* Astro Wiki

  [https://www.astro.com/astrowiki/en/?nhor=1](https://www.astro.com/astrowiki/en/?nhor=1)

> ⚠️ **IMPORTANT:**
>
> Astro.com resources are  **NOT to be scraped or copied** .
>
> They are **reference only** for terminology, structure, and UX inspiration.

---

## 🧠 AI REQUIREMENTS

### Providers

* **Primary (testing):** OpenRouter

  Model: `nex-agi/deepseek-v3.1-nex-n1:free`
* **Future-ready:** OpenAI SDK (drop-in compatible)

### AI Roles

1. **Chart Interpreter**
2. **Transit Interpreter**
3. **Synastry Interpreter**
4. **Timeline Explainer**

### AI MUST:

* Use **structured chart JSON**
* Cite **placements, houses, and aspects**
* Avoid deterministic / medical claims
* Support **EN / ES / NO**

---

## 🧱 SYSTEM ARCHITECTURE

### Frontend

* **Next.js (App Router)**
* **TypeScript**
* **Tailwind CSS**
* **Zod** for validation
* SVG chart rendering (European + Traditional styles)

### Backend API (Gateway)

* **Node.js (Fastify or Hono)**
* Handles:
  * Auth
  * Validation
  * Calls Python Astro Engine
  * Calls AI providers
  * Saves charts & interpretations

### Astrology Engine

* **Python + FastAPI**
* **Immanuel** as the core calculation engine
* Modular design for future Swiss Ephemeris upgrade

### AI / MCP Layer

* **MCP Server**
* Tools exposed to AI:
  * `compute_natal_chart`
  * `compute_transits`
  * `compute_synastry`
  * `generate_timeline`
  * `interpret_chart`

---

## 🪐 SUPPORTED FEATURES (REQUIRED)

### Chart Types

* Natal / Radix
* Transit
* Synastry
* Composite
* Solar Return
* Secondary Progressions

### Bodies & Points

**Planets**

* Sun → Pluto

**Asteroids**

* Chiron
* Pholus
* Ceres
* Pallas
* Juno
* Vesta

**Fictional / Points**

* North Node / South Node
* Pars Fortuna (Day/Night)
* ASC / MC / DSC / IC
* Optional: Vertex, Lilith

### Houses

* Placidus
* Koch
* Whole Sign
* Equal
* Regiomontanus
* Campanus
* Porphyry

### Aspects

* Conjunction
* Opposition
* Trine
* Square
* Sextile
* Quincunx
* **Cusp aspects**
* **User-customizable orbs**

---

## 🌍 LOCATION SYSTEM

### Online Atlas

* Google Maps Geocoding
* Autocomplete
* Timezone resolution

### Offline Atlas

* GeoNames (~80,000 cities)
* Offline fallback
* Deterministic timezone mapping

---

## 📤 IMPORT / EXPORT

### Export Formats

* SVG
* PNG
* JPG
* OAC (Open Astrology Chart JSON)
* Full database backup

### Import Formats

* Skylendar (`.skif`)
* Oroboros (`.xml`)
* Astrolog32 (`.dat`)
* Zet8 (`.zds`)

---

## 📊 MONTHLY TIMELINE

* Daily planetary events
* Retrograde stations
* Ingresses
* Exact aspects
* UI-friendly timeline output

---

## 📐 CANONICAL CHART JSON (CONTRACT)

<pre class="overflow-visible! px-0!" data-start="3709" data-end="4369"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>{</span><span>
  </span><span>"meta"</span><span>:</span><span></span><span>{</span><span>
    </span><span>"name"</span><span>:</span><span></span><span>"Person Name"</span><span>,</span><span>
    </span><span>"datetime_utc"</span><span>:</span><span></span><span>"1982-05-06T22:50:00Z"</span><span>,</span><span>
    </span><span>"timezone"</span><span>:</span><span></span><span>"America/Lima"</span><span>,</span><span>
    </span><span>"location"</span><span>:</span><span></span><span>{</span><span></span><span>"lat"</span><span>:</span><span></span><span>-12.12</span><span>,</span><span></span><span>"lon"</span><span>:</span><span></span><span>-77.03</span><span></span><span>}</span><span>,</span><span>
    </span><span>"house_system"</span><span>:</span><span></span><span>"Placidus"</span><span>
  </span><span>}</span><span>,</span><span>
  </span><span>"planets"</span><span>:</span><span></span><span>[</span><span>
    </span><span>{</span><span>
      </span><span>"body"</span><span>:</span><span></span><span>"Sun"</span><span>,</span><span>
      </span><span>"sign"</span><span>:</span><span></span><span>"Taurus"</span><span>,</span><span>
      </span><span>"degree"</span><span>:</span><span></span><span>16.4</span><span>,</span><span>
      </span><span>"house"</span><span>:</span><span></span><span>7</span><span>,</span><span>
      </span><span>"retrograde"</span><span>:</span><span></span><span>false</span><span>
    </span><span>}</span><span>
  </span><span>]</span><span>,</span><span>
  </span><span>"houses"</span><span>:</span><span></span><span>[</span><span>
    </span><span>{</span><span></span><span>"house"</span><span>:</span><span></span><span>1</span><span>,</span><span></span><span>"sign"</span><span>:</span><span></span><span>"Scorpio"</span><span>,</span><span></span><span>"degree"</span><span>:</span><span></span><span>16.08</span><span></span><span>}</span><span>
  </span><span>]</span><span>,</span><span>
  </span><span>"aspects"</span><span>:</span><span></span><span>[</span><span>
    </span><span>{</span><span>
      </span><span>"a"</span><span>:</span><span></span><span>"Sun"</span><span>,</span><span>
      </span><span>"b"</span><span>:</span><span></span><span>"Moon"</span><span>,</span><span>
      </span><span>"type"</span><span>:</span><span></span><span>"Opposition"</span><span>,</span><span>
      </span><span>"orb"</span><span>:</span><span></span><span>1.2</span><span>
    </span><span>}</span><span>
  </span><span>]</span><span>,</span><span>
  </span><span>"angles"</span><span>:</span><span></span><span>{</span><span>
    </span><span>"asc"</span><span>:</span><span></span><span>{</span><span></span><span>"sign"</span><span>:</span><span></span><span>"Scorpio"</span><span>,</span><span></span><span>"degree"</span><span>:</span><span></span><span>16.08</span><span></span><span>}</span><span>,</span><span>
    </span><span>"mc"</span><span>:</span><span></span><span>{</span><span></span><span>"sign"</span><span>:</span><span></span><span>"Leo"</span><span>,</span><span></span><span>"degree"</span><span>:</span><span></span><span>7.52</span><span></span><span>}</span><span>
  </span><span>}</span><span>
</span><span>}</span><span>
</span></span></code></div></div></pre>

---

## 🧠 AI PROMPT CONTRACT

### Interpreter Prompt Rules

* Cite placements explicitly
* Structured sections:
  * Core personality
  * Emotional patterns
  * Relationships
  * Career & vocation
  * Strengths
  * Challenges
  * Growth advice
* Tone options:
  * Formal
  * Mystical
  * Beginner-friendly
* No fear-mongering

---

## 🧩 REPOSITORY STRUCTURE

<pre class="overflow-visible! px-0!" data-start="4730" data-end="5245"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>astraea/
├── apps/
│   ├── web/                </span><span># Next.js frontend</span><span>
│   ├── api/                </span><span># Node API gateway</span><span>
│   ├── mcp/                </span><span># MCP server</span><span>
│   └── engine/             </span><span># Python FastAPI astrology engine</span><span>
├── packages/
│   ├── contracts/          </span><span># Zod schemas</span><span>
│   └── ui/                 </span><span># Shared UI components</span><span>
├── data/
│   └── atlas/              </span><span># Offline city database</span><span>
├── docs/
│   ├── ASPECTS.md
│   ├── HOUSE_SYSTEMS.md
│   ├── IMPORT_FORMATS.md
│   └── OAC_SPEC.md
└── docker-compose.yml
</span></span></code></div></div></pre>

---

## 🛠️ IMPLEMENTATION PHASES

### Phase 1 – Core Engine

* Immanuel integration
* Natal chart generation
* SVG wheel rendering
* Location + timezone

### Phase 2 – AI Interpretation

* OpenRouter integration
* Structured interpretation
* Save & retrieve reports

### Phase 3 – Advanced Astrology

* Transits
* Synastry
* Composite
* Timeline engine

### Phase 4 – Interop

* Imports
* Exports
* Offline atlas

---

## ⚖️ LEGAL & ETHICAL CONSTRAINTS

* No scraping astro.com content
* No medical / psychological diagnoses
* Interpretations are **reflective guidance only**

---

## 🎯 SUCCESS CRITERIA

* Chart results match professional tools within tolerance
* AI interpretations are explainable and grounded
* Charts export clean SVGs suitable for print
* System is MCP-ready and AI-agent-friendly

---

## 🚀 FINAL INSTRUCTION TO ANTIGRAVITY

> Build **ASTRAEA** exactly as specified.
>
> Use **Immanuel** for astrology calculations.
>
> Use **OpenRouter** for AI during development.
>
> Maintain strict separation between:
>
> * Astrology engine
> * AI interpretation
> * UI rendering
>
