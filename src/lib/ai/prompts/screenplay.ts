export function buildScreenplayPrompt(
  logline: string,
  genre?: string,
  tone?: string,
  durationTarget?: string
): string {
  const durationGuide = {
    short: '2-3 minutes (approximately 2-3 pages)',
    medium: '5-8 minutes (approximately 5-8 pages)',
    feature: '10-15 minutes (approximately 10-15 pages)',
  }

  const duration = durationGuide[durationTarget as keyof typeof durationGuide] || durationGuide.short

  return `You are a professional screenwriter. Write a short film screenplay based on the following logline.

LOGLINE: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}
TARGET LENGTH: ${duration}

Write in proper screenplay format:
- Scene headings (INT./EXT. LOCATION - TIME)
- Action lines (present tense, visual, cinematic)
- Character names (CAPS before dialogue)
- Dialogue
- Parentheticals only when essential

Guidelines:
- Write visually. Every line should be filmable.
- Keep dialogue minimal and purposeful.
- Create clear visual storytelling moments.
- Include 3-7 distinct scenes.
- End with a strong visual or emotional beat.
- Write for a short film — economical, impactful, complete.

Respond with ONLY the screenplay text in proper format.`
}
