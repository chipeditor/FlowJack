import { VideoProvider } from '@/lib/types/video-provider'
import { KlingProvider } from './kling'

export type VideoProviderID = 'kling' | 'runway' | 'luma' | 'pika' | 'fal'

const providers: Record<string, VideoProvider> = {
  kling: new KlingProvider(),
}

export function getVideoProvider(id: VideoProviderID): VideoProvider {
  const provider = providers[id]
  if (!provider) {
    throw new Error(`Video provider "${id}" is not available.`)
  }
  return provider
}

export function getAvailableProviders(): VideoProvider[] {
  return Object.values(providers)
}
