export type ProjectStatus = 'draft' | 'in_progress' | 'complete' | 'archived'
export type UserTier = 'free' | 'creator' | 'pro'
export type GenerationType = 'logline' | 'screenplay' | 'scenes' | 'shots' | 'storyboard' | 'creative_brief' | 'production_plan'
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

export type BudgetTier = 'micro' | 'low' | 'mid'

export interface ShootDay {
  day_number: number
  location: string
  interior_exterior: InteriorExterior
  time_of_day: string
  scenes: number[]
  estimated_hours: number
  notes: string | null
}

export type CastStatus = 'S' | 'W' | 'F' | 'H'

export interface CallSheetScene {
  scene_number: number
  interior_exterior: string
  set_description: string
  time_of_day: string
  page_count: string | null
  characters: string[]
  location: string
  shot_count: number
  estimated_duration_minutes: number | null
  sort_order: number
}

export interface CallSheetCastEntry {
  character_name: string
  actor_name: string | null
  status: CastStatus | null
  call_time: string | null
  makeup_time: string | null
  on_set_time: string | null
  scenes_today: number[]
  notes: string | null
}

export interface CallSheetLocation {
  location_name: string
  address: string | null
  interior_exterior: string
  parking_notes: string | null
  notes: string | null
  sort_order: number
}

export interface DepartmentNote {
  department: string
  note: string
}

export interface CallSheet {
  id: string
  project_id: string
  shoot_plan_id: string
  day_number: number
  date: string | null
  crew_call: string
  shooting_call: string | null
  sunrise: string | null
  sunset: string | null
  weather_forecast: string | null
  locations: CallSheetLocation[]
  scenes: CallSheetScene[]
  cast_list: CallSheetCastEntry[]
  department_notes: DepartmentNote[]
  important_notes: string | null
  breakfast_time: string | null
  lunch_time: string | null
  nearest_hospital: string | null
  advance_schedule_note: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CallSheetStub {
  day_number: number
  location: string
  call_time: string
  scenes: number[]
  cast_needed: string[]
  equipment_notes: string | null
  notes: string | null
}

export interface CastBreakdownEntry {
  character: string
  scene_count: number
  scenes: number[]
  shoot_days: number[]
  notes: string | null
}

export interface LocationEntry {
  location: string
  interior_exterior: InteriorExterior
  time_of_day: string[]
  scene_count: number
  scenes: number[]
  notes: string | null
}

export interface EquipmentEntry {
  category: string
  item: string
  scenes_needed: number[]
  notes: string | null
}

export interface ShootPlan {
  id: string
  project_id: string
  shoot_schedule: ShootDay[]
  call_sheets: CallSheetStub[]
  cast_breakdown: CastBreakdownEntry[]
  location_list: LocationEntry[]
  equipment_list: EquipmentEntry[]
  budget_tier: BudgetTier
  budget_notes: string | null
  total_shoot_days: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type CrewDepartment =
  | 'production'
  | 'direction'
  | 'camera'
  | 'sound'
  | 'lighting'
  | 'grip'
  | 'art'
  | 'hmu_wardrobe'
  | 'post'
  | 'other'

export const CREW_DEPARTMENTS: { value: CrewDepartment; label: string }[] = [
  { value: 'production', label: 'Production' },
  { value: 'direction', label: 'Direction' },
  { value: 'camera', label: 'Camera' },
  { value: 'sound', label: 'Sound' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'grip', label: 'Grip' },
  { value: 'art', label: 'Art' },
  { value: 'hmu_wardrobe', label: 'Hair/Makeup/Wardrobe' },
  { value: 'post', label: 'Post Production' },
  { value: 'other', label: 'Other' },
]

export interface CrewMember {
  id: string
  project_id: string
  name: string
  role: string
  department: CrewDepartment
  phone: string | null
  email: string | null
  is_cast: boolean
  character_name: string | null
  is_key_contact: boolean
  daily_rate: number | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
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
