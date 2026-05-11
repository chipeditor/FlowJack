export function buildScreenplayPrompt(
  logline: string,
  genre?: string,
  tone?: string,
  durationTarget?: string
): string {
  const durationGuide: Record<string, { time: string; pages: string; scenes: string; wordCount: string }> = {
    short: { time: '1-5 minutes', pages: '1-5 pages', scenes: '3-7 scenes', wordCount: '1,000-2,500 words' },
    medium: { time: '5-15 minutes', pages: '5-15 pages', scenes: '8-15 scenes', wordCount: '2,500-7,500 words' },
    standard: { time: '15-45 minutes', pages: '15-45 pages', scenes: '15-35 scenes', wordCount: '7,500-22,000 words' },
    feature: { time: '45-120 minutes', pages: '45-120 pages', scenes: '30-80 scenes', wordCount: '22,000-60,000 words' },
  }

  const guide = durationGuide[durationTarget || 'short'] || durationGuide.short
  const isLong = durationTarget === 'standard' || durationTarget === 'feature'
  const isFeature = durationTarget === 'feature'

  if (isFeature) {
    return `You are a professional feature film screenwriter. You MUST write a FEATURE-LENGTH screenplay. This is NOT a short film. This is a full-length movie.

LOGLINE: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}

MANDATORY REQUIREMENTS:
- MINIMUM 40 scenes
- MINIMUM 20,000 words
- THREE full acts with clear act breaks
- Multiple subplots and character arcs
- The screenplay must be ${guide.pages} long (${guide.wordCount})
- Target runtime: ${guide.time}
- This must be a COMPLETE feature film, not a short

STRUCTURE:
ACT ONE (first 25%): Setup — introduce protagonist, establish world, inciting incident, end with first act turning point
ACT TWO (middle 50%): Confrontation — rising stakes, midpoint reversal, subplots develop, allies and enemies, low point/crisis
ACT THREE (final 25%): Resolution — climax, final confrontation, resolution of all subplots, denouement

Write in proper screenplay format:
- Scene headings (INT./EXT. LOCATION - TIME)
- Action lines (present tense, visual, cinematic)
- Character names (CAPS before dialogue)
- Dialogue (substantial, character-driven conversations)
- Parentheticals only when essential

Guidelines:
- Write visually. Every line should be filmable.
- Develop FULL character arcs — characters must change.
- Include meaningful dialogue scenes — conversations that reveal character and advance plot.
- Create at least 3-4 distinct set pieces / memorable sequences.
- Build subplots that interweave with the main plot.
- Layer in thematic depth through visual motifs and recurring imagery.
- Vary pacing: quiet character moments AND high-intensity sequences.
- Every scene must earn its place but DO NOT cut scenes short.

CRITICAL: Write the COMPLETE screenplay from FADE IN to FADE OUT. Do NOT summarize, abbreviate, skip scenes, or write "scenes continue similarly." Write EVERY scene fully with complete action lines and dialogue. Use your MAXIMUM output length. This must read as a real, producible feature film screenplay.`
  }

  if (isLong) {
    return `You are a professional screenwriter. Write a substantial screenplay — this is NOT a short film.

LOGLINE: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}

MANDATORY REQUIREMENTS:
- MINIMUM 15 scenes
- MINIMUM 7,500 words
- Target length: ${guide.pages} (${guide.wordCount})
- Target runtime: ${guide.time}
- Target scene count: ${guide.scenes}

Write in proper screenplay format:
- Scene headings (INT./EXT. LOCATION - TIME)
- Action lines (present tense, visual, cinematic)
- Character names (CAPS before dialogue)
- Dialogue
- Parentheticals only when essential

Guidelines:
- Write visually. Every line should be filmable.
- Develop full character arcs and subplots.
- Include act breaks and rising tension.
- Build toward a satisfying climax and resolution.
- Create distinct set pieces and memorable sequences.
- Include meaningful dialogue — don't rush through conversations.

CRITICAL: Write the COMPLETE screenplay. Do NOT summarize, abbreviate, or skip scenes. Write EVERY scene fully. Use your MAXIMUM output length.`
  }

  return `You are a professional screenwriter. Write a short film screenplay based on the following logline.

LOGLINE: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}
TARGET LENGTH: ${guide.time} (approximately ${guide.pages}, ${guide.wordCount})
TARGET SCENE COUNT: ${guide.scenes}

Write in proper screenplay format:
- Scene headings (INT./EXT. LOCATION - TIME)
- Action lines (present tense, visual, cinematic)
- Character names (CAPS before dialogue)
- Dialogue
- Parentheticals only when essential

Guidelines:
- Write visually. Every line should be filmable.
- Keep dialogue purposeful and character-driven.
- Create clear visual storytelling moments.
- Structure with a clear beginning, middle, and end.
- End with a strong visual or emotional beat.
- Write economically — every scene earns its place.

Respond with ONLY the screenplay text in proper format. Write the COMPLETE screenplay — do not truncate or abbreviate.`
}
