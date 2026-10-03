# Palm Reading Graph

LangGraph-based palmistry reading pipeline that analyzes right and left hand palm photos.

## Flow

```
START -> validate_images --(invalid)--> reject -> END
                       \--(valid)--> [extract_right || extract_left]
                                      -> compare_hands
                                      -> [personality || structure || lines ||
                                          career || finance || love || timeline]
                                      -> assemble -> END
```

- **Validate**: Checks that both images are clear palm photos. If not, ends early with a re-upload message.
- **Extract**: Right and left hands are analyzed in parallel into structured features (palm shape, fingers, thumb, mounts, each line, markings).
- **Compare**: Compares the two hands (inherited vs developed, inner vs outer self).
- **Sections**: Seven writer nodes run in parallel: personality, structure, lines, career, finance, love, timeline.
- **Assemble**: Joins them in order 1–8.

## Setup

```bash
pip install langgraph langchain-anthropic pydantic
export ANTHROPIC_API_KEY=...
```

Optional: set `PALM_MODEL` env var (defaults to `claude-sonnet-5-5`).

## Usage

```bash
python palm_reading_graph.py right.jpg left.jpg "optional context"
```

The `graph` object is also exposed for `langgraph dev` / LangGraph Studio.

Extracting features first stops the writers from inventing details, and gives every section the same shared facts.
