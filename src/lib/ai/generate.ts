import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GenerationType } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GenerationOptions {
  type: GenerationType
  prompt: string
  structured?: boolean
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

  return generateCreative(options, start)
}

async function generateCreative(options: GenerationOptions, start: number): Promise<GenerationResult> {
  const model = 'claude-sonnet-4-20250514'

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
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

async function generateStructured(options: GenerationOptions, start: number): Promise<GenerationResult> {
  const model = 'gpt-4o'

  const response = await openai.chat.completions.create({
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
