import { VideoProviderAdapter } from '@/lib/types/video-provider'
import { KlingProvider } from './kling'

export type VideoProviderAdapterID = 'kling' | 'runway' | 'luma' | 'pika' | 'fal'

const providers: Record<string, VideoProviderAdapter> = {
  kling: new KlingProvider(),
}

export function getVideoProviderAdapter(id: VideoProviderAdapterID): VideoProviderAdapter {
  const provider = providers[id]
  if (!provider) {
    throw new Error(`Video provider "${id}" is not available.`)
  }
  return provider
}

export function getAvailableProviders(): VideoProviderAdapter[] {
  return Object.values(providers)
}
