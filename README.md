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

## License

MIT
