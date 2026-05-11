export function buildLoglineFromScriptPrompt(scriptContent: string, genre?: string | null): string {
  const excerpt = scriptContent.slice(0, 12000)

  return `You are an expert screenwriter. Read this screenplay and generate a single compelling logline.

A logline is ONE sentence (25-40 words) that captures:
- The protagonist (who)
- The inciting incident or central conflict (what happens)
- The stakes (what's at risk)

${genre ? `Genre: ${genre}` : ''}

SCREENPLAY:
${excerpt}

Respond with ONLY the logline. No quotes, no explanation, no alternatives. Just one sentence.`
}
