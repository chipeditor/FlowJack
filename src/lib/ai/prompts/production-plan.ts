export function buildProductionPlanPrompt(
  logline: string,
  screenplay: string,
  sceneCount: number,
  genre?: string,
  tone?: string
): string {
  return `You are a film production designer, composer, and sound designer creating a comprehensive production plan for a short film.

LOGLINE: ${logline}
GENRE: ${genre || 'unspecified'}
TONE: ${tone || 'unspecified'}
NUMBER OF SCENES: ${sceneCount}

SCREENPLAY:
${screenplay}

Create a complete production plan covering:

1. VOICEOVER DIRECTION: For each scene that benefits from narration or prominent dialogue, provide direction including character, tone, pacing, and emotional quality.

2. MUSIC DIRECTION: Overall musical identity including genre, tempo (BPM range), mood progression, key instruments, and 2-3 reference tracks (real songs/scores that capture the feel).

3. SFX DIRECTION: Key sound effects per scene — ambient sound, specific effects, Foley notes. Be specific (e.g., "distant city traffic with occasional horn" not just "city sounds").

4. COLOR PALETTE: 5-7 hex color codes that define the visual palette, with a note on what each represents (shadows, midtones, highlights, accent, etc.).

5. VISUAL STYLE: A paragraph describing the overall visual identity — film stock feel, contrast level, saturation, color grading approach.

6. REFERENCE FILMS: 3-5 films that inform the visual/tonal approach, with a brief note on what to take from each.

Respond in JSON:
{
  "voiceover_direction": [
    { "scene_number": 1, "character": "NARRATOR", "direction": "...", "tone": "contemplative", "text": "suggested VO text or null" }
  ],
  "music_direction": {
    "genre": "ambient electronic with orchestral elements",
    "tempo": "70-90 BPM",
    "mood": "building tension resolving to catharsis",
    "instruments": ["piano", "synthesizer pads", "strings", "subtle percussion"],
    "reference_tracks": ["Trent Reznor - Hand Covers Bruise", "Olafur Arnalds - Near Light"],
    "notes": "Music should breathe. Silence is as important as sound."
  },
  "sfx_direction": [
    { "scene_number": 1, "timestamp_description": "opening", "effect": "room tone — quiet hum of fluorescent lights", "intensity": "subtle" }
  ],
  "color_palette": ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#f5f5f5"],
  "visual_style": "...",
  "reference_films": ["Arrival (2016) — muted palette, deliberate pacing", "Her (2013) — warm intimacy, soft focus"]
}

Respond with ONLY valid JSON.`
}
