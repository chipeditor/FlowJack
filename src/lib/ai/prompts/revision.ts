export function buildRevisionPrompt(
  currentScreenplay: string,
  revisionNotes: string,
  logline: string,
  genre?: string,
  tone?: string
): string {
  return `You are a professional screenwriter revising a screenplay based on director's notes.

LOGLINE: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}

CURRENT SCREENPLAY:
${currentScreenplay}

REVISION NOTES FROM THE DIRECTOR:
${revisionNotes}

Apply the revision notes to the screenplay. Rules:
- Preserve the overall structure unless the notes specifically ask to change it
- Keep all scenes and characters that aren't mentioned in the notes
- Make the requested changes thoroughly — don't just make surface edits
- If the notes ask to add scenes, write them fully with complete action and dialogue
- If the notes ask to cut scenes, remove them and smooth the transitions
- If the notes ask to change tone/pacing/dialogue, apply that change consistently throughout
- Maintain proper screenplay format throughout
- Write the COMPLETE revised screenplay — do not abbreviate or truncate unchanged sections

Respond with ONLY the complete revised screenplay text. Include every scene, even unchanged ones.`
}
