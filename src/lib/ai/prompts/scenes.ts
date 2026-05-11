export function buildSceneBreakdownPrompt(screenplay: string): string {
  return `You are a professional assistant director breaking down a screenplay into individual scenes for production planning.

SCREENPLAY:
${screenplay}

For each scene, extract and generate:
1. scene_number (sequential integer)
2. heading (the scene heading exactly as written)
3. interior_exterior ("INT" or "EXT" or "INT/EXT")
4. location (the location name)
5. time_of_day (DAY, NIGHT, DAWN, DUSK, etc.)
6. description (1-2 sentence summary of what happens)
7. characters (array of character names present)
8. mood (one word: tense, joyful, melancholic, mysterious, etc.)
9. estimated_duration_seconds (realistic estimate)
10. notes (any production considerations)

Respond in JSON format:
{
  "scenes": [
    {
      "scene_number": 1,
      "heading": "INT. COFFEE SHOP - DAY",
      "interior_exterior": "INT",
      "location": "Coffee Shop",
      "time_of_day": "DAY",
      "description": "...",
      "characters": ["SARAH", "BARISTA"],
      "mood": "anxious",
      "estimated_duration_seconds": 45,
      "notes": "..."
    }
  ]
}

Respond with ONLY valid JSON.`
}
