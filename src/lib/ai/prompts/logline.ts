export function buildLoglinePrompt(idea: string, genre?: string, tone?: string): string {
  return `You are a professional screenwriter and story consultant. Generate a compelling logline for a short film based on the following idea.

IDEA: ${idea}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}

A logline must:
- Be one to two sentences maximum
- Introduce the protagonist
- Present the central conflict or goal
- Hint at the stakes
- Be specific, not generic
- Create intrigue

Respond with ONLY the logline text. No preamble, no explanation.`
}
