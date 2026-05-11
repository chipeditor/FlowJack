import {
  VideoProviderAdapter,
  VideoGenerationRequest,
  VideoGenerationResult,
  CostEstimate,
  ProviderCapabilities,
} from '@/lib/types/video-provider'

export abstract class BaseVideoProvider implements VideoProviderAdapter {
  abstract readonly name: string
  abstract readonly id: string

  abstract textToVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult>
  abstract imageToVideo(imageUrl: string, request: VideoGenerationRequest): Promise<VideoGenerationResult>
  abstract getJobStatus(jobId: string): Promise<VideoGenerationResult>
  abstract downloadResult(jobId: string): Promise<{ url: string; expiresAt: string }>
  abstract estimateCost(request: VideoGenerationRequest): CostEstimate
  abstract getCapabilities(): ProviderCapabilities

  protected notImplemented(): never {
    throw new Error(`${this.name} provider is not yet implemented. Video generation will be available in a future release.`)
  }
}
