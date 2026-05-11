interface OutlineScene {
  scene_number: number
  heading: string
  characters: string[]
  summary: string
  emotional_beat: string
  plot_function: string
  act: number
}

interface OutlineCharacter {
  name: string
  description: string
}

export function buildActPrompt(
  actNumber: number,
  scenes: OutlineScene[],
  characters: OutlineCharacter[],
  logline: string,
  genre?: string,
  tone?: string,
  previousActEnding?: string
): string {
  const actNames: Record<number, string> = {
    1: 'ACT ONE — Setup',
    2: 'ACT TWO — Confrontation',
    3: 'ACT THREE — Resolution',
  }

  const sceneList = scenes
    .map((s) => `  Scene ${s.scene_number}: ${s.heading}\n    ${s.summary}\n    Emotional beat: ${s.emotional_beat}`)
    .join('\n\n')

  const characterList = characters
    .map((c) => `  ${c.name}: ${c.description}`)
    .join('\n')

  return `You are a professional screenwriter writing ${actNames[actNumber]} of a feature film screenplay. Write ONLY this act — do not write scenes from other acts.

LOGLINE: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}

CHARACTERS:
${characterList}

${previousActEnding ? `PREVIOUS ACT ENDED WITH:\n${previousActEnding}\n\nContinue naturally from this moment.\n` : 'This is the opening of the film. Begin with FADE IN:'}

SCENES TO WRITE FOR THIS ACT:
${sceneList}

REQUIREMENTS:
- Write EVERY scene listed above — do not skip any
- Write in proper screenplay format (scene headings, action lines, dialogue)
- Each scene should be FULLY WRITTEN with complete action descriptions and dialogue
- Minimum 3-5 exchanges of dialogue per conversation scene
- Action lines should be vivid, visual, and cinematic
- Maintain consistent character voices throughout
- Transitions between scenes should feel natural
- ${actNumber === 1 ? 'Establish the world and characters thoroughly. The audience is meeting everyone for the first time.' : ''}
- ${actNumber === 2 ? 'Escalate tension progressively. Vary pacing between intense and quiet moments.' : ''}
- ${actNumber === 3 ? 'Build to a powerful climax. The resolution should feel earned and emotionally satisfying.' : ''}

CRITICAL: Write every scene COMPLETELY. Do not summarize, skip, abbreviate, or say "scene continues." Write full action and full dialogue for every scene. Use your maximum output length.

${actNumber === 3 ? 'End with FADE OUT.' : ''}

Respond with ONLY the screenplay text for this act.`
}
