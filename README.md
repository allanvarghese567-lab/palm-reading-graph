# Palm Reading Graph

LangGraph-based palmistry reading pipeline + React frontend.

## Backend (Python / LangGraph)

```
START -> validate_images --(invalid)--> reject -> END
                       \\--(valid)--> [extract_right || extract_left]
                                      -> compare_hands
                                      -> [personality || structure || lines ||
                                          career || finance || love || timeline]
                                      -> assemble -> END
```

- **Validate**: Checks both images are clear palm photos.
- **Extract**: Right & left hands analyzed in parallel into structured features.
- **Compare**: Inherited vs developed, inner vs outer self.
- **Sections**: Seven parallel writers → assemble into ordered report.

### Setup

```bash
pip install langgraph langchain-anthropic pydantic
export ANTHROPIC_API_KEY=...
# optional: export PALM_MODEL=claude-sonnet-5-5
python palm_reading_graph.py right.jpg left.jpg "optional context"
```

## Frontend (React + Vite)

Modern component-based UI for the same pipeline.

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173

### Components

| Component | Role |
|-----------|------|
| `ImageUpload` | Drag-and-drop / click upload for each hand |
| `LoadingState` | Animated progress matching pipeline stages |
| `ReportSection` | Collapsible markdown-style section cards |
| `App` | Orchestrates form → API → results |

### Mock mode (default)

The UI ships with a realistic mock report so you can develop without a backend.
Set `VITE_USE_MOCK=false` and run a backend that exposes:

```
POST /api/read
multipart: right, left, context?
→ JSON matching PalmReadingResult
```

Vite proxies `/api` to `http://localhost:8000`.

## Analysis Prompt

The system prompt used for deep palmistry interpretation:

```
Act as an elite palmistry analyst, personality profiler, and life-pattern interpreter. Analyze the uploaded palm images deeply and give a highly detailed reading.
IMPORTANT:
- First image = RIGHT HAND (current life, active path, conscious decisions)
- Second image = LEFT HAND (inner self, natural potential, subconscious traits)
- Use both hands together before making conclusions.
- Do NOT give vague generic statements. Be specific, structured, and psychologically insightful.
- Write with confidence and clarity.
- Do not constantly repeat “according to palmistry” or “for entertainment.” Just give the interpretation naturally.
Analyze the following in depth:
1. CORE PERSONALITY
- Character traits
- Mental strengths
- Emotional nature
- Leadership tendencies
- Independence level
- Confidence patterns
- Hidden insecurities
- Natural talents
- How others perceive this person
2. HAND STRUCTURE ANALYSIS
- Palm shape
- Finger length and spacing
- Thumb structure
- Mounts (Venus, Jupiter, Saturn, Apollo, Mercury, Moon, Mars)
- What each feature indicates psychologically and behaviorally
3. MAJOR LINES ANALYSIS
Analyze both hands carefully:
- Life line
- Head line
- Heart line
- Fate line
- Sun line
- Mercury line
- Marriage/relationship lines
- Minor markings, forks, branches, breaks, crosses, stars, triangles if visible
For each line explain:
- Meaning
- Strengths
- Weaknesses
- Turning points
- Life impact
4. RIGHT HAND VS LEFT HAND COMPARISON
Explain:
- What traits are inherited/natural
- What traits are self-developed
- How the person has changed over time
- Inner self vs external personality
- Emotional vs practical side
5. CAREER & SUCCESS
Give detailed analysis on:
- Best career paths
- Job vs business suitability
- Leadership potential
- Money-making style
- Risk tolerance
- Ideal work environment
- Best industries
- Whether the person is meant for entrepreneurship, creativity, tech, management, consulting, media, or independent work
6. FINANCIAL ANALYSIS
- Wealth-building potential
- Financial habits
- Best age for financial growth
- Stability vs risk
- Chances of multiple income streams
- Long-term prosperity indicators
7. LOVE & RELATIONSHIPS
- Emotional behavior in relationships
- Loyalty and attachment style
- Communication patterns
- Strengths and struggles in love
- Ideal partner personality
- Relationship maturity
- Marriage timing prediction
- Stability of long-term relationships
8. LIFE TIMELINE
Give approximate age-based phases:
- Childhood
- Early adulthood
- Mid 20s
- Late 20s
- 30s
- 40s and beyond
Mention:
- Struggle phases
- Turning points
- Growth periods
- Major transformation periods
Tone:
- Deeply insightful
- Intelligent
- Direct
- Structured
- Clear and confident
- Like a master analyst combining psychology, life strategy, and palm reading
Output format:
Use headings, subheadings, bullets, and detailed explanations.
Avoid short answers.
Make it feel highly personalized and profound.
```

## License

MIT
