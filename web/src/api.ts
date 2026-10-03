import type { PalmReadingResult, UploadedImage } from './types'

/**
 * Call the palm-reading backend.
 *
 * Expected backend (FastAPI / Flask / etc.) endpoint:
 *   POST /api/read
 *   multipart/form-data:
 *     right: image file
 *     left:  image file
 *     context: optional string
 *
 * Response JSON matching PalmReadingResult (or { error: string }).
 *
 * While no backend is running, set VITE_USE_MOCK=true (or leave unset)
 * to return a realistic mock report for UI development.
 */
export async function requestPalmReading(
  right: UploadedImage,
  left: UploadedImage,
  context: string,
  onProgress?: (p: number) => void
): Promise<PalmReadingResult> {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

  if (useMock) {
    return mockReading(onProgress)
  }

  const form = new FormData()
  form.append('right', right.file)
  form.append('left', left.file)
  if (context.trim()) form.append('context', context.trim())

  // Simulate staged progress while waiting for the real API
  let progress = 0
  const tick = setInterval(() => {
    progress = Math.min(progress + 0.04, 0.9)
    onProgress?.(progress)
  }, 400)

  try {
    const res = await fetch('/api/read', {
      method: 'POST',
      body: form,
    })
    clearInterval(tick)
    onProgress?.(1)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.error || `Request failed (${res.status})`)
    }
    return (await res.json()) as PalmReadingResult
  } catch (e) {
    clearInterval(tick)
    throw e
  }
}

async function mockReading(onProgress?: (p: number) => void): Promise<PalmReadingResult> {
  for (let i = 0; i <= 20; i++) {
    await new Promise((r) => setTimeout(r, 180))
    onProgress?.(i / 20)
  }

  return {
    comparison: `## Inherited vs Developed Traits

- **Left hand** shows a long, curved heart line and a deeply rooted life line — natural emotional sensitivity and strong life force.
- **Right hand** reveals a straighter head line and a more pronounced fate line, indicating conscious cultivation of focus and ambition.

## Inner Self vs Outer Personality

- Internally (left) you process feelings deeply and value harmony.
- Externally (right) you present as decisive and structured — a deliberate adaptation for career and social environments.

## Change Over Time

The divergence between hands suggests significant personal growth in the last 8–12 years, especially around discipline and emotional boundaries.`,

    sections: {
      personality: `## Core Personality

You combine **analytical clarity** with genuine empathy. Others experience you as reliable and thoughtful rather than flashy.

### Mental Strengths
- Strong pattern recognition and strategic thinking
- Preference for depth over breadth in relationships and projects

### Emotional Nature
- Loyal once trust is established
- Needs periodic solitude to recharge

### Leadership & Independence
Natural quiet leadership — people follow your consistency more than charisma. High independence; you dislike micromanagement.`,

      structure: `## Hand Structure Analysis

### Palm Shape
Rectangular / **Air** influence with moderate flesh — intellect and communication oriented.

### Fingers
Long fingers with clear spacing → independence of thought and ability to hold multiple perspectives.

### Thumb
Strong, well-angled thumb → willpower and practical decision-making capacity.

### Mounts
- **Venus**: moderately developed — warmth without excess
- **Jupiter**: pronounced — ambition and ethical standards
- **Saturn**: balanced — sense of responsibility
- **Apollo**: present — creative appreciation
- **Mercury**: strong — communication skill
- **Moon**: active — imagination and intuition
- **Mars**: moderate — controlled assertiveness`,

      lines: `## Major Lines Analysis

### Life Line
Long, clear, moderately deep on both hands. Good vitality; fewer major health interruptions indicated.

### Head Line
Longer and straighter on the right hand — developed mental discipline. Slight fork on left suggests creative dual-path thinking.

### Heart Line
Curves upward toward Jupiter on left; more level on right. Emotional idealism tempered by practicality in daily life.

### Fate Line
Present and rising toward the middle finger on the right hand — career direction solidified through personal effort.

### Sun / Mercury / Marriage Lines
Sun line faintly present (recognition possible mid-career). Mercury line clear (communication as asset). One clear marriage/relationship line with a secondary fainter mark.`,

      career: `## Career & Success

Best fits: **strategy, consulting, product, research, writing, tech leadership, independent professional work**.

- Job vs business: you can succeed in both; entrepreneurship suits once systems are in place.
- Leadership potential is high in specialist or thought-leader roles rather than pure people-management.
- Ideal environment: autonomy, intellectual challenge, clear impact metrics.
- Risk tolerance: moderate-calculated — you research before leaping.`,

      finance: `## Financial Analysis

Wealth-building potential is solid through **skill compounding** rather than speculation.

- Best growth window: late 20s through 40s as expertise peaks.
- Habit pattern: tends to undervalue own time early; later becomes more strategic about multiple income streams.
- Long-term indicators favor stability with selective high-upside bets.`,

      love: `## Love & Relationships

Attachment style leans **secure-avoidant hybrid**: deeply caring once committed, cautious at the start.

- Communication is a strength once trust exists.
- Ideal partner: emotionally intelligent, independent, values depth and growth.
- Relationship maturity rises significantly after personal boundary work.
- Long-term stability is high when both partners respect autonomy.`,

      timeline: `## Life Timeline

- **Childhood / teens**: sensitivity and observation; may have felt different.
- **Early 20s**: exploration and some identity friction.
- **Mid–late 20s**: key turning point — structure and direction solidify (visible in right-hand fate line development).
- **30s**: expansion of influence and possibly public recognition of skills.
- **40s+**: integration phase — mentoring, deeper creative or advisory roles, and more selective relationships.`,
    },
  }
}
