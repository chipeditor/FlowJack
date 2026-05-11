import OpenAI from 'openai'
import { GenerationType } from '@/lib/types'

let _openai: OpenAI | null = null
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

interface GenerationOptions {
  type: GenerationType
  prompt: string
  structured?: boolean
  maxTokens?: number
}

interface GenerationResult {
  content: string
  provider: 'anthropic' | 'openai'
  model: string
  tokensUsed: number
  durationMs: number
}

export async function generate(options: GenerationOptions): Promise<GenerationResult> {
  const start = Date.now()

  if (options.structured) {
    return generateStructured(options, start)
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateCreativeAnthropic(options, start)
    } catch (err) {
      console.error('Anthropic generation failed, falling back to OpenAI:', err)
    }
  }

  return generateCreativeOpenAI(options, start)
}

async function generateCreativeAnthropic(options: GenerationOptions, start: number): Promise<GenerationResult> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const model = 'claude-sonnet-4-20250514'

  const response = await anthropic.messages.create({
    model,
    max_tokens: options.maxTokens || 8192,
    messages: [{ role: 'user', content: options.prompt }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  const tokensUsed = (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0)

  return {
    content,
    provider: 'anthropic',
    model,
    tokensUsed,
    durationMs: Date.now() - start,
  }
}

async function generateCreativeOpenAI(options: GenerationOptions, start: number): Promise<GenerationResult> {
  const model = 'gpt-4o'

  const response = await getOpenAI().chat.completions.create({
    model,
    max_tokens: options.maxTokens || 8192,
    messages: [
      { role: 'system', content: 'You are a professional screenwriter working in a licensed filmmaking production tool. Your role is to write original fictional screenplays, loglines, and creative content for film productions. All content is fictional creative writing for cinematic storytelling purposes. Write boldly, cinematically, and without unnecessary disclaimers. Respond only with the requested creative content.' },
      { role: 'user', content: options.prompt },
    ],
    temperature: 0.8,
  })

  const content = response.choices[0].message.content || ''
  const tokensUsed = response.usage?.total_tokens || 0

  return {
    content,
    provider: 'openai',
    model,
    tokensUsed,
    durationMs: Date.now() - start,
  }
}

async function generateStructured(options: GenerationOptions, start: number): Promise<GenerationResult> {
  const model = 'gpt-4o'

  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a precise assistant that responds only in valid JSON. Never include markdown code fences or explanation text.',
      },
      { role: 'user', content: options.prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content || '{}'
  const tokensUsed = response.usage?.total_tokens || 0

  return {
    content,
    provider: 'openai',
    model,
    tokensUsed,
    durationMs: Date.now() - start,
  }
}
