import { fal } from '@fal-ai/client'

interface GenerateImageOptions {
  prompt: string
  aspectRatio?: string
  seed?: number
}

interface GenerateImageResult {
  imageUrl: string
  seed: number
  durationMs: number
}

function mapAspectRatio(projectRatio: string): string {
  const map: Record<string, string> = {
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9',
    '1:1': 'square',
    '4:3': 'landscape_4_3',
    '21:9': 'landscape_16_9',
    '2.39:1': 'landscape_16_9',
  }
  return map[projectRatio] || 'landscape_16_9'
}

export async function generateImage({
  prompt,
  aspectRatio = '16:9',
  seed,
}: GenerateImageOptions): Promise<GenerateImageResult> {
  const start = Date.now()

  fal.config({ credentials: process.env.FAL_API_KEY! })

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt,
      image_size: mapAspectRatio(aspectRatio) as 'landscape_16_9',
      num_images: 1,
      ...(seed !== undefined && { seed }),
    },
  })

  const image = (result.data as { images: { url: string }[]; seed: number })
  return {
    imageUrl: image.images[0].url,
    seed: image.seed,
    durationMs: Date.now() - start,
  }
}
