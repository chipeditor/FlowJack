export type ProjectStatus = 'draft' | 'in_progress' | 'complete' | 'archived'
export type UserTier = 'free' | 'creator' | 'pro'
export type GenerationType = 'logline' | 'screenplay' | 'scenes' | 'shots' | 'storyboard' | 'production_plan'
export type AIProvider = 'anthropic' | 'openai'
export type VideoProvider = 'kling' | 'runway' | 'luma' | 'pika' | 'fal'
export type RenderStatus = 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled'
export type StoryboardStatus = 'pending' | 'generating' | 'complete' | 'failed'
export type InteriorExterior = 'INT' | 'EXT' | 'INT/EXT'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  tier: UserTier
  projects_count: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  logline: string | null
  genre: string | null
  tone: string | null
  duration_target: string | null
  aspect_ratio: string
  status: ProjectStatus
  idea_input: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Script {
  id: string
  project_id: string
  version: number
  title: string | null
  content: string
  format: string
  word_count: number | null
  estimated_runtime_seconds: number | null
  is_active: boolean
  created_at: string
}

export interface Scene {
  id: string
  script_id: string
  project_id: string
  scene_number: number
  heading: string
  description: string | null
  location: string | null
  time_of_day: string | null
  interior_exterior: InteriorExterior | null
  characters: string[]
  mood: string | null
  estimated_duration_seconds: number | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Shot {
  id: string
  scene_id: string
  project_id: string
  shot_number: number
  shot_type: string
  camera_movement: string | null
  lens: string | null
  framing: string | null
  lighting: string | null
  description: string
  action: string | null
  dialogue: string | null
  duration_seconds: number | null
  transition: string
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Storyboard {
  id: string
  shot_id: string
  project_id: string
  image_prompt: string
  video_prompt: string | null
  style_reference: string | null
  camera_notes: string | null
  image_url: string | null
  thumbnail_url: string | null
  status: StoryboardStatus
  sort_order: number
  created_at: string
}

export interface ProductionPlan {
  id: string
  project_id: string
  voiceover_direction: VoiceoverNote[]
  music_direction: MusicDirection
  sfx_direction: SFXNote[]
  color_palette: string[]
  visual_style: string | null
  reference_films: string[]
  total_estimated_duration_seconds: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VoiceoverNote {
  scene_number: number
  character: string | null
  direction: string
  tone: string
  text: string
}

export interface MusicDirection {
  genre: string
  tempo: string
  mood: string
  instruments: string[]
  reference_tracks: string[]
  notes: string
}

export interface SFXNote {
  scene_number: number
  timestamp_description: string
  effect: string
  intensity: string
}

export interface Render {
  id: string
  shot_id: string | null
  project_id: string
  provider: VideoProvider
  provider_job_id: string | null
  prompt: string
  status: RenderStatus
  video_url: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  resolution: string | null
  aspect_ratio: string | null
  cost_cents: number | null
  error_message: string | null
  metadata: Record<string, unknown>
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface AIGeneration {
  id: string
  project_id: string
  user_id: string
  generation_type: GenerationType
  provider: AIProvider
  model: string
  input_prompt: string
  output_content: string
  tokens_used: number | null
  cost_cents: number | null
  duration_ms: number | null
  accepted: boolean
  metadata: Record<string, unknown>
  created_at: string
}
