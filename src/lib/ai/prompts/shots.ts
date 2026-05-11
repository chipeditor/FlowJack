export function buildShotListPrompt(scene: {
  heading: string
  description: string
  characters: string[]
  mood: string
}): string {
  return `You are a senior cinematographer and director planning the shot list for a scene. Think like Roger Deakins designing coverage.

SCENE: ${scene.heading}
DESCRIPTION: ${scene.description}
CHARACTERS: ${scene.characters.join(', ')}
MOOD: ${scene.mood}

For each shot, specify:
1. shot_number (sequential)
2. shot_type (establishing, wide, full, medium, medium close-up, close-up, extreme close-up, insert, over-the-shoulder, POV, two-shot)
3. camera_movement (static, dolly in, dolly out, dolly lateral, pan left, pan right, tilt up, tilt down, crane up, crane down, handheld, steadicam, push-in, pull-back)
4. lens (focal length: 14mm, 24mm, 35mm, 50mm, 85mm, 135mm)
5. framing (rule of thirds, centered, dutch angle, negative space, leading lines, frame within frame)
6. lighting (natural, high-key, low-key, Rembrandt, split, silhouette, motivated practical, golden hour, overcast diffused)
7. description (what we see in this shot — specific and visual)
8. action (what's happening physically)
9. dialogue (any dialogue in this shot, or null)
10. duration_seconds (estimated)
11. transition (cut, dissolve, fade to black, match cut, smash cut, J-cut, L-cut)
12. notes (any additional direction)

Design coverage that:
- Establishes geography first
- Uses motivated camera movement
- Varies shot size purposefully
- Creates visual rhythm
- Serves the emotional arc of the scene
- Typically 3-8 shots per scene

Respond in JSON format:
{
  "shots": [
    {
      "shot_number": 1,
      "shot_type": "establishing",
      "camera_movement": "slow dolly in",
      "lens": "35mm",
      "framing": "centered",
      "lighting": "natural overcast",
      "description": "...",
      "action": "...",
      "dialogue": null,
      "duration_seconds": 4,
      "transition": "cut",
      "notes": "..."
    }
  ]
}

Respond with ONLY valid JSON.`
}
