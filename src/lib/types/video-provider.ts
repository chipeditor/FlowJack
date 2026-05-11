export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9'
export type VideoDuration = 3 | 5 | 10 | 15 | 30 | 60

export interface VideoGenerationRequest {
  prompt: string
  negativePrompt?: string
  aspectRatio: AspectRatio
  duration: VideoDuration
  referenceImageUrl?: string
  style?: string
  seed?: number
}

export interface VideoGenerationResult {
  jobId: string
  status: 'queued' | 'processing' | 'complete' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  resolution?: string
  error?: string
}

export interface CostEstimate {
  cents: number
  currency: string
  creditsUsed?: number
  breakdown?: string
}

export interface ProviderCapabilities {
  supportedAspectRatios: AspectRatio[]
  supportedDurations: VideoDuration[]
  supportsAudio: boolean
  supportsCharacterConsistency: boolean
  supportsImageToVideo: boolean
  supportsStyleTransfer: boolean
  maxResolution: string
  averageGenerationTime: number // seconds
}

export interface VideoProvider {
  readonly name: string
  readonly id: string

  textToVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult>
  imageToVideo(imageUrl: string, request: VideoGenerationRequest): Promise<VideoGenerationResult>
  getJobStatus(jobId: string): Promise<VideoGenerationResult>
  downloadResult(jobId: string): Promise<{ url: string; expiresAt: string }>
  estimateCost(request: VideoGenerationRequest): CostEstimate
  getCapabilities(): ProviderCapabilities
}
