import { generate } from './generate'
import { buildOutlinePrompt } from './prompts/outline'

interface MultiPassResult {
  outline: ScreenplayOutline
  screenplay: string
  wordCount: number
  batchWordCounts: number[]
  totalTokensUsed: number
  totalDurationMs: number
  batchCount: number
}

interface ScreenplayOutline {
  title_suggestion: string
  theme: string
  characters: { name: string; description: string }[]
  scenes: {
    scene_number: number
    heading: string
    characters: string[]
    summary: string
    emotional_beat: string
    plot_function: string
    act: number
  }[]
}

const SCENES_PER_BATCH = 3

export async function generateMultiPassScreenplay(
  logline: string,
  genre?: string,
  tone?: string,
  durationTarget?: string,
  onProgress?: (stage: string, detail: string) => void
): Promise<MultiPassResult> {
  const startTime = Date.now()
  let totalTokens = 0

  // ── PASS 1: Generate structured outline ──
  onProgress?.('outline', 'Generating scene-by-scene outline...')

  const outlinePrompt = buildOutlinePrompt(logline, genre, tone, durationTarget)
  const outlineResult = await generate({
    type: 'screenplay',
    prompt: outlinePrompt,
    structured: true,
    maxTokens: 8192,
  })
  totalTokens += outlineResult.tokensUsed

  let outline: ScreenplayOutline
  try {
    outline = JSON.parse(outlineResult.content)
  } catch {
    throw new Error('Failed to parse screenplay outline')
  }

  if (!outline.scenes || outline.scenes.length === 0) {
    throw new Error('Outline contained no scenes')
  }

  console.log(`[FlowJack] Outline: ${outline.scenes.length} scenes, ${outline.characters.length} characters`)

  // ── PASS 2: Generate screenplay in batches of scenes ──
  const batches = chunkScenes(outline.scenes, SCENES_PER_BATCH)
  const batchTexts: string[] = []
  const batchWordCounts: number[] = []

  console.log(`[FlowJack] Generating ${batches.length} batches of ~${SCENES_PER_BATCH} scenes each`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const batchNum = i + 1
    const isFirst = i === 0
    const isLast = i === batches.length - 1

    const sceneRange = `${batch[0].scene_number}-${batch[batch.length - 1].scene_number}`
    onProgress?.('batch', `Writing scenes ${sceneRange} (batch ${batchNum}/${batches.length})...`)

    const previousEnding = !isFirst && batchTexts.length > 0
      ? extractLastLines(batchTexts[batchTexts.length - 1], 20)
      : undefined

    const prompt = buildBatchPrompt(
      batch,
      outline.characters,
      logline,
      genre,
      tone,
      isFirst,
      isLast,
      previousEnding,
      batchNum,
      batches.length
    )

    const result = await generate({
      type: 'screenplay',
      prompt,
      maxTokens: 16384,
    })

    totalTokens += result.tokensUsed
    batchTexts.push(result.content)

    const words = result.content.split(/\s+/).length
    batchWordCounts.push(words)

    console.log(`[FlowJack] Batch ${batchNum}/${batches.length}: ${words} words, scenes ${sceneRange}`)
  }

  // ── PASS 3: Assemble final screenplay ──
  onProgress?.('assembly', 'Assembling final screenplay...')

  const assembled = assembleScreenplay(batchTexts, outline.title_suggestion)
  const totalWordCount = assembled.split(/\s+/).length

  console.log(`[FlowJack] Assembly complete: ${totalWordCount} total words, ~${Math.round(totalWordCount / 250)} pages`)

  return {
    outline,
    screenplay: assembled,
    wordCount: totalWordCount,
    batchWordCounts,
    totalTokensUsed: totalTokens,
    totalDurationMs: Date.now() - startTime,
    batchCount: batches.length,
  }
}

function buildBatchPrompt(
  scenes: ScreenplayOutline['scenes'],
  characters: ScreenplayOutline['characters'],
  logline: string,
  genre?: string,
  tone?: string,
  isFirst?: boolean,
  isLast?: boolean,
  previousEnding?: string,
  batchNum?: number,
  totalBatches?: number
): string {
  const sceneDetails = scenes
    .map((s) => {
      return `SCENE ${s.scene_number} — ${s.heading}
  What happens: ${s.summary}
  Characters present: ${s.characters.join(', ')}
  Emotional beat: ${s.emotional_beat}
  Plot function: ${s.plot_function}

  REQUIREMENTS FOR THIS SCENE:
  - Write a COMPLETE scene heading
  - Write AT LEAST 5-8 lines of detailed action/description
  - If characters speak, write AT LEAST 10-15 lines of dialogue with action beats between lines
  - Describe the setting, lighting, sounds, and atmosphere in detail
  - Show character emotions through physical behavior, not just dialogue
  - This scene alone must be AT LEAST 500 words / 2 pages`
    })
    .join('\n\n')

  const characterList = characters
    .map((c) => `  ${c.name}: ${c.description}`)
    .join('\n')

  const minWords = scenes.length * 700

  return `You are an award-winning screenwriter writing a feature film. This is SECTION ${batchNum} of ${totalBatches}.

FILM: ${logline}
${genre ? `GENRE: ${genre}` : ''}
${tone ? `TONE: ${tone}` : ''}

CHARACTERS:
${characterList}

${previousEnding ? `THE PREVIOUS SECTION ENDED WITH:\n---\n${previousEnding}\n---\nPick up IMMEDIATELY where this left off. Do NOT repeat anything from above.\n` : ''}
${isFirst ? 'This is the OPENING of the film. Start with:\n\nFADE IN:\n' : ''}

YOU MUST WRITE THESE ${scenes.length} SCENES:

${sceneDetails}

═══════════════════════════════════════════
ABSOLUTE RULES — VIOLATION MEANS FAILURE:
═══════════════════════════════════════════

1. MINIMUM LENGTH: ${minWords} words total for this section. This is NON-NEGOTIABLE.
2. Each scene MUST be at least 500 words. A scene with less than 500 words is INCOMPLETE.
3. NEVER write "they continue talking" or "the conversation goes on" — write the ACTUAL words spoken.
4. NEVER use brackets like [scene continues] or [more dialogue] — these are FORBIDDEN.
5. NEVER summarize action — describe every beat: what characters do, how they move, what they touch, their expressions.
6. Every dialogue exchange must include action lines BETWEEN speakers describing reactions, pauses, gestures, movements.
7. Describe the environment: lighting (specific — "amber streetlight cuts through venetian blinds"), sounds ("the distant hum of a refrigerator"), textures, smells.
8. Use proper screenplay format: INT./EXT. HEADING, action in present tense, CHARACTER NAME centered above dialogue.

EXAMPLE OF CORRECT DENSITY (this is how detailed each scene must be):

INT. APARTMENT - NIGHT

The apartment is small, cluttered with books stacked on every surface. A single lamp casts warm light across peeling wallpaper. Rain streaks down the window, distorting the neon signs outside into abstract smears of red and blue.

SARAH (30s, tired eyes, ink-stained fingers) sits at a kitchen table covered in manuscript pages. She picks up her coffee mug, finds it empty, sets it back down. She stares at the page in front of her.

A KEY turns in the front door lock. Sarah doesn't look up.

MICHAEL (30s, wet raincoat, carrying grocery bags) pushes through the door with his shoulder. He sets the bags on the counter, shakes water from his hair.

                    MICHAEL
          You haven't moved since this morning.

Sarah turns a page. Doesn't respond.

                    MICHAEL (CONT'D)
          I got that pasta you like. The one from
          the place on seventh.

                    SARAH
                    (still reading)
          I'm not hungry.

Michael hangs his coat on the back of a chair. Water drips onto the floor. He notices but doesn't clean it up.

                    MICHAEL
          When's the last time you ate something?

Sarah finally looks up. Her eyes are red.

...THIS is the level of detail required for EVERY scene.

${isLast ? 'End with FADE OUT.' : 'Do NOT write FADE OUT or THE END — the story continues.'}

Now write ALL ${scenes.length} scenes at this density. MINIMUM ${minWords} words.`
}

function chunkScenes<T>(scenes: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < scenes.length; i += size) {
    chunks.push(scenes.slice(i, i + size))
  }
  return chunks
}

function assembleScreenplay(parts: string[], title?: string): string {
  const assembled: string[] = []

  if (title) {
    assembled.push(`${title.toUpperCase()}\n\n`)
  }

  for (let i = 0; i < parts.length; i++) {
    let text = parts[i].trim()

    // Remove duplicate FADE IN if not the first part
    if (i > 0) {
      text = text.replace(/^\s*FADE IN:\s*/i, '')
    }

    // Remove FADE OUT if not the last part
    if (i < parts.length - 1) {
      text = text.replace(/\s*FADE OUT\.?\s*$/i, '')
    }

    // Remove any meta-commentary the model might add
    text = text.replace(/^\s*\[.*?\]\s*$/gm, '')
    text = text.replace(/^\s*\(Note:.*?\)\s*$/gm, '')
    text = text.replace(/^\s*---\s*$/gm, '')

    assembled.push(text)
  }

  return assembled.join('\n\n')
}

function extractLastLines(text: string, lineCount: number): string {
  const lines = text.trim().split('\n')
  return lines.slice(-lineCount).join('\n')
}
