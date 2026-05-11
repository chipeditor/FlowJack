import { BaseVideoProvider } from './base'
import {
  VideoGenerationRequest,
  VideoGenerationResult,
  CostEstimate,
  ProviderCapabilities,
} from '@/lib/types/video-provider'

export class KlingProvider extends BaseVideoProvider {
  readonly name = 'Kling AI'
  readonly id = 'kling'

  async textToVideo(_request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    this.notImplemented()
  }

  async imageToVideo(_imageUrl: string, _request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    this.notImplemented()
  }

  async getJobStatus(_jobId: string): Promise<VideoGenerationResult> {
    this.notImplemented()
  }

  async downloadResult(_jobId: string): Promise<{ url: string; expiresAt: string }> {
    this.notImplemented()
  }

  estimateCost(request: VideoGenerationRequest): CostEstimate {
    const baseCost = request.duration <= 5 ? 10 : request.duration <= 10 ? 20 : 40
    return { cents: baseCost, currency: 'USD' }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      supportedDurations: [5, 10],
      supportsAudio: false,
      supportsCharacterConsistency: true,
      supportsImageToVideo: true,
      supportsStyleTransfer: true,
      maxResolution: '1080p',
      averageGenerationTime: 120,
    }
  }
}
