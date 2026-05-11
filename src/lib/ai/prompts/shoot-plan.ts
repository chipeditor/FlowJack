interface SceneInput {
  scene_number: number
  heading: string
  location: string
  interior_exterior: string
  time_of_day: string
  characters: string[]
  estimated_duration_seconds: number
}

interface ShotInput {
  scene_number: number
  shot_type: string
  camera_movement: string | null
  lens: string | null
  lighting: string | null
  duration_seconds: number | null
}

export function buildShootPlanPrompt(
  logline: string,
  scenes: SceneInput[],
  shots: ShotInput[],
  genre?: string | null
): string {
  const sceneData = scenes.map(s => ({
    scene: s.scene_number,
    heading: s.heading,
    location: s.location,
    int_ext: s.interior_exterior,
    tod: s.time_of_day,
    characters: s.characters,
    est_minutes: Math.round(s.estimated_duration_seconds / 60),
  }))

  const shotSummary: Record<number, { count: number; types: string[]; movements: string[]; lenses: string[]; lighting: string[] }> = {}
  for (const shot of shots) {
    if (!shotSummary[shot.scene_number]) {
      shotSummary[shot.scene_number] = { count: 0, types: [], movements: [], lenses: [], lighting: [] }
    }
    const s = shotSummary[shot.scene_number]
    s.count++
    if (shot.shot_type && !s.types.includes(shot.shot_type)) s.types.push(shot.shot_type)
    if (shot.camera_movement && !s.movements.includes(shot.camera_movement)) s.movements.push(shot.camera_movement)
    if (shot.lens && !s.lenses.includes(shot.lens)) s.lenses.push(shot.lens)
    if (shot.lighting && !s.lighting.includes(shot.lighting)) s.lighting.push(shot.lighting)
  }

  return `You are an experienced line producer and assistant director creating a production plan for an independent film.

PROJECT:
Logline: ${logline}
${genre ? `Genre: ${genre}` : ''}
Total scenes: ${scenes.length}
Total shots: ${shots.length}

SCENE DATA:
${JSON.stringify(sceneData, null, 2)}

SHOT SUMMARY PER SCENE:
${JSON.stringify(shotSummary, null, 2)}

Create a complete production plan with the following sections:

1. SHOOT SCHEDULE (shoot_schedule): Group scenes by location and time of day to minimize company moves. Each shoot day should have:
   - day_number, location, interior_exterior ("INT"/"EXT"/"INT/EXT"), time_of_day
   - scenes (array of scene numbers), estimated_hours (realistic — include setup/reset time)
   - notes (any scheduling concerns)
   Aim for 4-8 pages of script per day for indie production.

2. CALL SHEETS (call_sheets): One per shoot day with:
   - day_number, location, call_time (e.g. "6:00 AM" for day exteriors, "4:00 PM" for night scenes)
   - scenes (array), cast_needed (character names from scene data)
   - equipment_notes (key gear for the day's shots), notes

3. CAST BREAKDOWN (cast_breakdown): Every unique character with:
   - character name, scene_count, scenes (array of scene numbers)
   - shoot_days (which day numbers they're needed), notes

4. LOCATION LIST (location_list): Every unique location with:
   - location name, interior_exterior, time_of_day (array — may appear at multiple times)
   - scene_count, scenes (array), notes (special requirements like crowd, permits, etc.)

5. EQUIPMENT LIST (equipment_list): Derived from shot data. Each item:
   - category ("camera", "lighting", "grip", "special"), item name
   - scenes_needed (array of scene numbers), notes
   Include standard kit plus anything special the shots require (steadicam, crane, drone, etc.)

6. BUDGET TIER (budget_tier): One of "micro" (under $5k), "low" ($5-25k), or "mid" ($25-100k)
   Based on: location count, shoot days, cast size, equipment complexity, any VFX or special needs.
   Include budget_notes explaining the assessment.

7. total_shoot_days: integer count of shoot days
8. notes: any overall production notes or concerns

Respond with ONLY valid JSON matching this structure. No markdown, no explanation.`
}
