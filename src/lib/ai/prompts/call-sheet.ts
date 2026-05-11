interface SceneForDay {
  scene_number: number
  heading: string
  location: string
  interior_exterior: string
  time_of_day: string
  characters: string[]
  estimated_duration_seconds: number
  shot_count: number
}

interface ShootDayInput {
  day_number: number
  location: string
  interior_exterior: string
  time_of_day: string
  scenes: number[]
  estimated_hours: number
  notes: string | null
}

interface EquipmentForDay {
  category: string
  item: string
  scenes_needed: number[]
}

interface CrewInfo {
  key_contacts: { name: string; role: string }[]
  cast: { character_name: string; actor_name: string | null }[]
}

export function buildCallSheetPrompt(
  projectTitle: string,
  shootDay: ShootDayInput,
  totalShootDays: number,
  scenes: SceneForDay[],
  equipment: EquipmentForDay[],
  crew: CrewInfo,
  nextDaySummary: string | null
): string {
  return `You are an experienced 1st Assistant Director creating a detailed call sheet for an indie film production.

PROJECT: ${projectTitle}
SHOOT DAY: Day ${shootDay.day_number} of ${totalShootDays}
PRIMARY LOCATION: ${shootDay.location}
INT/EXT: ${shootDay.interior_exterior}
TIME OF DAY: ${shootDay.time_of_day}
ESTIMATED HOURS: ${shootDay.estimated_hours}
${shootDay.notes ? `SCHEDULE NOTES: ${shootDay.notes}` : ''}

SCENES FOR THIS DAY:
${JSON.stringify(scenes.map(s => ({
  scene: s.scene_number,
  heading: s.heading,
  location: s.location,
  int_ext: s.interior_exterior,
  tod: s.time_of_day,
  characters: s.characters,
  est_minutes: Math.round(s.estimated_duration_seconds / 60),
  shots: s.shot_count,
})), null, 2)}

EQUIPMENT NEEDED TODAY:
${JSON.stringify(equipment, null, 2)}

CAST:
${JSON.stringify(crew.cast, null, 2)}

${nextDaySummary ? `NEXT DAY: ${nextDaySummary}` : ''}

Generate a complete call sheet with the following JSON structure:

{
  "crew_call": "TIME (e.g. 6:00 AM) — based on time_of_day: DAY exterior = early, NIGHT = late afternoon, INT = flexible",
  "shooting_call": "TIME or null — first shot time if different from crew call (typically 30-60min after crew call)",
  "sunrise": "approximate time based on general US location",
  "sunset": "approximate time based on general US location",
  "locations": [
    {
      "location_name": "from scene data",
      "interior_exterior": "INT/EXT",
      "parking_notes": null,
      "notes": null,
      "sort_order": 0
    }
  ],
  "scenes": [
    {
      "scene_number": 1,
      "interior_exterior": "INT",
      "set_description": "from scene heading",
      "time_of_day": "DAY",
      "page_count": "estimated in 8ths format (e.g. '2 3/8')",
      "characters": ["CHARACTER_NAME"],
      "location": "location name",
      "shot_count": 5,
      "estimated_duration_minutes": 45,
      "sort_order": 0
    }
  ],
  "cast": [
    {
      "character_name": "CHARACTER",
      "actor_name": "from crew data or null",
      "status": null,
      "call_time": "suggested individual call time — stagger based on scene order and makeup needs",
      "makeup_time": null,
      "on_set_time": "call_time + 30min buffer",
      "scenes_today": [1, 3],
      "notes": null
    }
  ],
  "department_notes": [
    {
      "department": "Camera|Lighting|Grip|Art|Sound|Special",
      "note": "key equipment and setup notes for this department based on today's shots and equipment list"
    }
  ],
  "advance_schedule_note": "brief summary of tomorrow's work or null if last day",
  "breakfast_time": "suggested — typically 30min before crew call",
  "lunch_time": "suggested — 6 hours after crew call per union rules"
}

IMPORTANT RULES:
- Sort scenes in SHOOTING ORDER (group by location to minimize moves), not scene number order
- Stagger cast call times — actors not in early scenes call later
- Department notes should be specific and actionable based on the equipment list
- Page counts should be realistic estimates in 8ths format
- All times in 12-hour format with AM/PM

Respond with ONLY valid JSON. No markdown, no explanation.`
}
