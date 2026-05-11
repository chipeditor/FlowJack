export function buildStoryboardPrompt(shot: {
  shot_type: string
  camera_movement: string | null
  lens: string | null
  framing: string | null
  lighting: string | null
  description: string
  action: string | null
}, projectContext: {
  genre?: string
  tone?: string
  visual_style?: string
}): string {
  return `You are a storyboard artist and visual prompt engineer. Generate an image generation prompt and a video generation prompt for the following shot.

SHOT DETAILS:
- Type: ${shot.shot_type}
- Camera: ${shot.camera_movement || 'static'}
- Lens: ${shot.lens || 'unspecified'}
- Framing: ${shot.framing || 'standard'}
- Lighting: ${shot.lighting || 'natural'}
- Description: ${shot.description}
- Action: ${shot.action || 'none specified'}

PROJECT CONTEXT:
- Genre: ${projectContext.genre || 'unspecified'}
- Tone: ${projectContext.tone || 'unspecified'}
- Visual Style: ${projectContext.visual_style || 'cinematic, photorealistic'}

Generate two prompts:

1. IMAGE PROMPT: A detailed prompt for generating a single storyboard frame (for Midjourney/DALL-E/Flux). Should describe the composition, lighting, mood, and subjects in photographic/cinematic terms. Include aspect ratio and camera perspective. Be specific about depth of field, color temperature, and atmosphere.

2. VIDEO PROMPT: A prompt for generating a short video clip (for Kling/Runway/Luma). Should describe the motion, camera movement, action, and temporal progression. Keep it concise but specific about movement direction and timing.

Also provide:
3. STYLE REFERENCE: A one-line description of the visual aesthetic (e.g., "Blade Runner 2049 meets A24 indie drama")
4. CAMERA NOTES: Technical notes for the virtual camera

Respond in JSON:
{
  "image_prompt": "...",
  "video_prompt": "...",
  "style_reference": "...",
  "camera_notes": "..."
}

Respond with ONLY valid JSON.`
}
