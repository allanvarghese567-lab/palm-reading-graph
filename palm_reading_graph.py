"""
Palmistry reading pipeline (LangGraph)

Flow:
  START -> validate_images --(invalid)--> reject -> END
                           \--(valid)--> [extract_right || extract_left]
                                          -> compare_hands
                                          -> [personality || structure || lines ||
                                              career || finance || love || timeline]
                                          -> assemble -> END

pip install langgraph langchain-anthropic pydantic
export ANTHROPIC_API_KEY=...
python palm_reading_graph.py right.jpg left.jpg
"""
import base64
import mimetypes
import operator
import os
import sys
from typing import Annotated, Literal, Optional, TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

MODEL = os.getenv("PALM_MODEL", "claude-sonnet-5-5")
llm = ChatAnthropic(model=MODEL, temperature=0.4, max_tokens=4000)


# ───────────────────────── Schemas ─────────────────────────
class ImageCheck(BaseModel):
    right_is_palm: bool
    left_is_palm: bool
    right_quality: Literal["good", "fair", "poor"]
    left_quality: Literal["good", "fair", "poor"]
    issues: str = Field(description="Blur, lighting, cropping, fingers hidden, etc.")


class LineReading(BaseModel):
    present: bool
    depth: str = ""
    length: str = ""
    curvature_or_direction: str = ""
    markings: list[str] = Field(default_factory=list, description="forks, breaks, islands, crosses, stars, triangles, chains")
    notes: str = ""


class HandFeatures(BaseModel):
    palm_shape: str = Field(description="earth / air / fire / water + proportions")
    finger_length_and_spacing: str
    thumb: str
    mounts: dict[str, str] = Field(description="Venus, Jupiter, Saturn, Apollo, Mercury, Moon, Mars -> prominence/notes")
    life_line: LineReading
    head_line: LineReading
    heart_line: LineReading
    fate_line: LineReading
    sun_line: LineReading
    mercury_line: LineReading
    marriage_lines: LineReading
    minor_markings: list[str] = Field(default_factory=list)
    skin_texture_and_color: str = ""
    visibility_caveats: str = Field(default="", description="What could not be seen clearly")


# ───────────────────────── State ─────────────────────────
class State(TypedDict, total=False):
    right_image: str  # path
    left_image: str
    user_context: str  # optional: age, handedness, etc.
    right_b64: dict
    left_b64: dict
    check: ImageCheck
    right: HandFeatures
    left: HandFeatures
    comparison: str
    sections: Annotated[dict, lambda a, b: {**(a or {}), **b}]
    report: str
    error: Optional[str]


# ───────────────────────── Helpers ─────────────────────────
def _img_block(path: str) -> dict:
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    return {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}


ANALYST = (
    "You are an elite palmistry analyst, personality profiler and life-pattern interpreter. "
    "Be specific, structured and psychologically insightful. No vague generic statements. "
    "Write with confidence and clarity. Do not repeatedly say 'according to palmistry' or "
    "'for entertainment'. Right hand = current life, active path, conscious decisions. "
    "Left hand = inner self, natural potential, subconscious traits. Use both hands together. "
    "Only interpret features that were actually observed; if something was not visible, say so briefly."
)


# ───────────────────────── Nodes ─────────────────────────
def validate_images(state: State) -> State:
    r, l = _img_block(state["right_image"]), _img_block(state["left_image"])
    checker = llm.with_structured_output(ImageCheck)
    check = checker.invoke([
        SystemMessage(content="Check these two images. First = right hand, second = left hand. Are they clear palm photos?"),
        HumanMessage(content=[{"type": "text", "text": "Image 1 (right), Image 2 (left):"}, r, l]),
    ])
    return {"right_b64": r, "left_b64": l, "check": check}


def route_after_validation(state: State) -> str:
    c = state["check"]
    return "extract" if (c.right_is_palm and c.left_is_palm) else "reject"


def reject(state: State) -> State:
    c = state["check"]
    return {"error": f"Could not read palms. Right palm: {c.right_is_palm}, left palm: {c.left_is_palm}. {c.issues}. "
                     "Please re-upload well-lit, open-palm, fully in-frame photos."}


def _extract(side: str):
    def node(state: State) -> State:
        extractor = llm.with_structured_output(HandFeatures)
        feats = extractor.invoke([
            SystemMessage(content="You are a meticulous palm feature extractor. Describe only what is visible. "
                                  "Be concrete about depth, length, curvature, and markings."),
            HumanMessage(content=[{"type": "text", "text": f"Extract all features from this {side.upper()} hand."},
                                  state[f"{side}_b64"]]),
        ])
        return {side: feats}
    return node


def compare_hands(state: State) -> State:
    msg = llm.invoke([
        SystemMessage(content=ANALYST),
        HumanMessage(content=(
            "Compare the hands.\n\nRIGHT:\n" + state["right"].model_dump_json(indent=1) +
            "\n\nLEFT:\n" + state["left"].model_dump_json(indent=1) +
            "\n\nCover: inherited/natural vs self-developed traits; how the person has changed over time; "
            "inner self vs external personality; emotional vs practical side. Use headings and bullets."
        )),
    ])
    return {"comparison": msg.content}


def _section(key: str, title: str, brief: str):
    def node(state: State) -> State:
        ctx = state.get("user_context") or "None provided"
        msg = llm.invoke([
            SystemMessage(content=ANALYST),
            HumanMessage(content=(
                f"RIGHT HAND FEATURES:\n{state['right'].model_dump_json(indent=1)}\n\n"
                f"LEFT HAND FEATURES:\n{state['left'].model_dump_json(indent=1)}\n\n"
                f"HAND COMPARISON:\n{state['comparison']}\n\n"
                f"USER CONTEXT: {ctx}\n\n"
                f"Write the section '{title}' in depth. Use headings, subheadings, bullets and detailed explanation. "
                f"Avoid short answers.\n\n{brief}"
            )),
        ])
        return {"sections": {key: f"## {title}\n\n{msg.content}"}}
    return node


SECTIONS = {
    "personality": ("1. Core Personality",
        "Character traits, mental strengths, emotional nature, leadership tendencies, independence level, "
        "confidence patterns, hidden insecurities, natural talents, how others perceive this person."),
    "structure": ("2. Hand Structure Analysis",
        "Palm shape, finger length and spacing, thumb structure, all seven mounts (Venus, Jupiter, Saturn, Apollo, "
        "Mercury, Moon, Mars). For each feature: psychological and behavioral meaning."),
    "lines": ("3. Major Lines Analysis",
        "Life, head, heart, fate, sun, Mercury, marriage/relationship lines, and minor markings (forks, branches, "
        "breaks, crosses, stars, triangles). For each line, both hands: meaning, strengths, weaknesses, turning points, life impact."),
    "career": ("5. Career & Success",
        "Best career paths, job vs business, leadership potential, money-making style, risk tolerance, ideal work "
        "environment, best industries, fit for entrepreneurship / creativity / tech / management / consulting / media / independent work."),
    "finance": ("6. Financial Analysis",
        "Wealth-building potential, financial habits, best age for financial growth, stability vs risk, "
        "multiple income streams, long-term prosperity indicators."),
    "love": ("7. Love & Relationships",
        "Emotional behavior, loyalty and attachment style, communication patterns, strengths and struggles, ideal partner, "
        "relationship maturity, marriage timing, long-term stability."),
    "timeline": ("8. Life Timeline",
        "Age-based phases: childhood, early adulthood, mid 20s, late 20s, 30s, 40s and beyond. Mention struggle phases, "
        "turning points, growth periods, and major transformations."),
}
ORDER = ["personality", "structure", "lines"]  # then comparison (section 4), then the rest


def assemble(state: State) -> State:
    s = state["sections"]
    parts = [s["personality"], s["structure"], s["lines"],
             "## 4. Right Hand vs Left Hand Comparison\n\n" + state["comparison"],
             s["career"], s["finance"], s["love"], s["timeline"]]
    return {"report": "\n\n---\n\n".join(parts)}


# ───────────────────────── Graph ─────────────────────────
def build_graph():
    g = StateGraph(State)
    g.add_node("validate_images", validate_images)
    g.add_node("reject", reject)
    g.add_node("extract_right", _extract("right"))
    g.add_node("extract_left", _extract("left"))
    g.add_node("compare_hands", compare_hands)
    g.add_node("assemble", assemble)

    g.add_edge(START, "validate_images")
    g.add_conditional_edges(
        "validate_images",
        lambda s: ["extract_right", "extract_left"] if route_after_validation(s) == "extract" else "reject",
        ["extract_right", "extract_left", "reject"],
    )
    g.add_edge("reject", END)
    g.add_edge(["extract_right", "extract_left"], "compare_hands")  # waits for both

    for key, (title, brief) in SECTIONS.items():
        g.add_node(key, _section(key, title, brief))
        g.add_edge("compare_hands", key)
    g.add_edge(list(SECTIONS), "assemble")  # join: waits for all sections
    g.add_edge("assemble", END)
    return g.compile()


graph = build_graph()  # for `langgraph dev` / LangGraph Studio

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("usage: python palm_reading_graph.py <right_hand.jpg> <left_hand.jpg> [context]")
    out = graph.invoke({
        "right_image": sys.argv[1],
        "left_image": sys.argv[2],
        "user_context": sys.argv[3] if len(sys.argv) > 3 else "",
    })
    print(out.get("error") or out["report"])
