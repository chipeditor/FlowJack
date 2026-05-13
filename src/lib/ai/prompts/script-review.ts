export interface ScriptSuggestion {
  id: string
  type: 'dialogue' | 'action' | 'structure' | 'pacing' | 'character'
  severity: 'minor' | 'moderate' | 'significant'
  lineStart: number
  lineEnd: number
  originalText: string
  suggestedText: string
  rationale: string
}

export function buildScriptReviewPrompt(scriptContent: string, genre?: string | null): string {
  const lines = scriptContent.split('\n')
  const numbered = lines.map((l, i) => `${i + 1}: ${l}`).join('\n')
  const trimmed = numbered.slice(0, 20000)

  return `You are a senior script doctor reviewing a screenplay for a professional production.

Analyze the screenplay below and identify 5-12 specific, actionable improvements. Focus on:
- **Dialogue**: Stilted, on-the-nose, or unnatural lines — suggest more cinematic alternatives
- **Action lines**: Vague or unfilmable descriptions — rewrite to show what a camera sees
- **Pacing**: Scenes that drag or transitions that feel abrupt
- **Structure**: Missing beats, weak scene openings/closings
- **Character**: Inconsistent voice, unclear motivation in specific moments

${genre ? `Genre context: ${genre} — tailor suggestions to genre conventions.` : ''}

Rules:
- Each suggestion must reference specific line numbers from the script
- Provide the exact original text and your suggested replacement
- Keep suggestions concise — replace only what needs changing, not entire scenes
- Rationale should be 1-2 sentences explaining WHY the change improves the script
- Order suggestions by line number (earliest first)
- Do NOT suggest adding new scenes or characters — only improve what exists

Respond with valid JSON only, no markdown:
{
  "suggestions": [
    {
      "type": "dialogue|action|structure|pacing|character",
      "severity": "minor|moderate|significant",
      "lineStart": <number>,
      "lineEnd": <number>,
      "originalText": "<exact text from those lines>",
      "suggestedText": "<your improved version>",
      "rationale": "<why this is better>"
    }
  ]
}

SCREENPLAY (with line numbers):
${trimmed}`
}
