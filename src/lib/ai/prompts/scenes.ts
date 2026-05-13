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

Additionally, extract ALL characters from the entire screenplay. For each character, extract any physical traits, wardrobe details, age, or personality descriptors mentioned ANYWHERE in the screenplay (action lines, parentheticals, character introductions). Only include traits that are explicitly stated or clearly implied — do NOT invent or assume traits that aren't in the text. Consolidate name variations (e.g. "SARAH", "Sarah", "SARAH CHEN") into a single canonical name.

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
  ],
  "characters": [
    {
      "name": "Sarah Chen",
      "description": "Brief character summary if evident from screenplay",
      "physical_traits": {
        "hair_color": null,
        "hair_style": null,
        "eye_color": null,
        "skin_tone": null,
        "age_range": "30s",
        "build": null,
        "height": null,
        "facial_hair": null,
        "distinguishing_features": "scar on left cheek",
        "era": null,
        "archetype": null
      },
      "wardrobe": "leather jacket, worn boots",
      "scenes": [1, 3, 5]
    }
  ]
}

For physical_traits, use null for any trait not mentioned in the screenplay. The "scenes" array on each character should list the scene_numbers where they appear.

Respond with ONLY valid JSON.`
}
