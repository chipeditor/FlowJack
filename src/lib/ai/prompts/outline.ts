export function buildOutlinePrompt(
  logline: string,
  genre?: string,
  tone?: string,
  durationTarget?: string
): string {
  const sceneTargets: Record<string, string> = {
    short: '3-7',
    medium: '8-15',
    standard: '20-35',
    feature: '40-70',
  }
  const target = sceneTargets[durationTarget || 'short'] || '40-70'

  return `You are a professional screenwriter and story architect. Create a detailed scene-by-scene outline for a feature film.

LOGLINE: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}
TARGET SCENE COUNT: ${target}

Create a structured outline with THREE ACTS:

ACT ONE (Setup — roughly 25% of scenes):
- Introduce protagonist and their world
- Establish the central conflict
- Inciting incident
- End with a clear turning point that launches Act Two

ACT TWO (Confrontation — roughly 50% of scenes):
- Rising action and escalating stakes
- Introduce subplots and supporting characters
- Midpoint reversal or revelation
- Series of complications and setbacks
- End with a crisis / low point

ACT THREE (Resolution — roughly 25% of scenes):
- Climax and final confrontation
- Resolution of subplots
- Character transformation
- Denouement

For EACH scene provide:
- scene_number
- heading (INT./EXT. LOCATION - TIME)
- characters (array of character names)
- summary (2-3 sentences describing what happens)
- emotional_beat (what the audience should feel)
- plot_function (what this scene accomplishes for the story)
- act (1, 2, or 3)

Also provide:
- characters: a list of all characters with a one-line description
- theme: the central theme in one sentence

Respond in JSON:
{
  "title_suggestion": "...",
  "theme": "...",
  "characters": [
    { "name": "CHARACTER NAME", "description": "one-line description" }
  ],
  "scenes": [
    {
      "scene_number": 1,
      "heading": "INT. LOCATION - TIME",
      "characters": ["NAME"],
      "summary": "...",
      "emotional_beat": "...",
      "plot_function": "...",
      "act": 1
    }
  ]
}

Respond with ONLY valid JSON. Include ALL ${target} scenes.`
}
