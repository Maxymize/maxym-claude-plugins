/**
 * Google Veo Video Generation Client
 * Code Execution pattern for 99%+ token reduction
 *
 * Supports: Veo 3.1, Veo 3.1 Fast, Veo 3.0, Veo 2
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// =============================================================================
// Types
// =============================================================================

export type VeoModel =
  | 'veo-3.1-generate-preview'      // Latest with audio, extension, reference images
  | 'veo-3.1-fast-generate-preview' // Fast variant for business workflows
  | 'veo-3.0-generate-001'          // Stable with audio
  | 'veo-3.0-fast-generate-001'     // Fast stable
  | 'veo-2.0-generate-001';         // Silent video only

export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';
export type Duration = '4' | '6' | '8';

export interface GenerateVideoParams {
  /** Text description of the video to generate */
  prompt: string;
  /** Model to use (default: veo-3.1-generate-preview) */
  model?: VeoModel;
  /** Aspect ratio (default: 16:9) */
  aspectRatio?: AspectRatio;
  /** Video resolution (default: 720p) */
  resolution?: Resolution;
  /** Video duration in seconds (default: 8) */
  durationSeconds?: Duration;
  /** Elements to exclude from the video */
  negativePrompt?: string;
  /** Output format: 'file' saves to disk, 'url' returns download URL */
  output?: 'file' | 'url';
  /** Directory to save video (required if output='file') */
  outputPath?: string;
  /** Custom filename (without extension) */
  filename?: string;
  /** Polling interval in milliseconds (default: 10000) */
  pollInterval?: number;
  /** Maximum wait time in milliseconds (default: 600000 = 10 minutes) */
  maxWaitTime?: number;
}

export interface ImageToVideoParams extends GenerateVideoParams {
  /** Path to starting frame image */
  imagePath: string;
}

export interface InterpolateVideoParams extends GenerateVideoParams {
  /** Path to first frame image */
  firstFramePath: string;
  /** Path to last frame image */
  lastFramePath: string;
}

export interface ExtendVideoParams {
  /** Previously generated video to extend */
  videoUri: string;
  /** Prompt for the extension */
  prompt: string;
  /** Model to use (must be veo-3.1) */
  model?: 'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview';
  /** Duration of extension in seconds */
  durationSeconds?: Duration;
  /** Output format */
  output?: 'file' | 'url';
  /** Directory to save video */
  outputPath?: string;
  /** Custom filename */
  filename?: string;
  /** Polling interval */
  pollInterval?: number;
  /** Maximum wait time */
  maxWaitTime?: number;
}

export interface ReferenceImage {
  /** Path to reference image */
  imagePath: string;
  /** How to use the image: 'style' or 'subject' */
  referenceType: 'style' | 'subject';
  /** Description of what to reference */
  description?: string;
}

export interface GenerateWithReferencesParams extends GenerateVideoParams {
  /** Up to 3 reference images for style/subject guidance */
  referenceImages: ReferenceImage[];
}

export interface VeoResult {
  success: boolean;
  videoUrl?: string;
  savedPath?: string;
  duration?: number;
  error?: string;
  operationName?: string;
  /** Estimated cost in USD */
  estimatedCostUSD?: number;
  /** Estimated cost in EUR (approx conversion) */
  estimatedCostEUR?: number;
  /** Video duration in seconds */
  videoDurationSeconds?: number;
  /** Model used */
  model?: string;
}

// =============================================================================
// Pricing Constants (as of 2025)
// =============================================================================

const PRICING_USD_PER_SECOND: Record<string, number> = {
  'veo-3.1-generate-preview': 0.40,
  'veo-3.1-fast-generate-preview': 0.15,
  'veo-3.0-generate-001': 0.40,
  'veo-3.0-fast-generate-001': 0.15,
  'veo-2.0-generate-001': 0.35,
};

// Approximate USD to EUR conversion rate
const USD_TO_EUR = 0.92;

// =============================================================================
// Helper Functions
// =============================================================================

function calculateCost(model: VeoModel, durationSeconds: number): { usd: number; eur: number } {
  const pricePerSecond = PRICING_USD_PER_SECOND[model] || 0.40;
  const usd = pricePerSecond * durationSeconds;
  const eur = usd * USD_TO_EUR;
  return {
    usd: Math.round(usd * 100) / 100,
    eur: Math.round(eur * 100) / 100,
  };
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Get your API key from https://aistudio.google.com/apikey');
  }
  return apiKey;
}

async function imageToBase64(imagePath: string): Promise<{ data: string; mimeType: string }> {
  const absolutePath = path.isAbsolute(imagePath) ? imagePath : path.resolve(imagePath);
  const buffer = await fs.readFile(absolutePath);
  const base64 = buffer.toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  const mimeType = mimeTypes[ext] || 'image/jpeg';
  return { data: base64, mimeType };
}

function generateFilename(prompt: string): string {
  const sanitized = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 30);
  const timestamp = Date.now();
  return `veo_${sanitized}_${timestamp}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// Core API Functions
// =============================================================================

async function startVideoGeneration(
  apiKey: string,
  model: VeoModel,
  requestBody: Record<string, unknown>
): Promise<{ operationName: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Veo API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return { operationName: result.name };
}

async function pollOperation(
  apiKey: string,
  operationName: string,
  pollInterval: number,
  maxWaitTime: number
): Promise<{ videoUri: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${operationName}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Operation poll error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (result.done) {
      if (result.error) {
        throw new Error(`Video generation failed: ${JSON.stringify(result.error)}`);
      }

      // Path 1: generateVideoResponse.generatedSamples (actual API response format)
      const samples = result.response?.generateVideoResponse?.generatedSamples;
      if (samples && samples.length > 0 && samples[0].video?.uri) {
        return { videoUri: samples[0].video.uri };
      }

      // Path 2: generatedVideos (alternative format from docs)
      const videos = result.response?.generatedVideos || result.response?.generated_videos;
      if (videos && videos.length > 0) {
        const videoUri = videos[0].video?.uri || videos[0].uri;
        if (videoUri) {
          return { videoUri };
        }
      }

      throw new Error('No video URL in response. Response structure: ' + JSON.stringify(result.response));
    }

    console.log(`⏳ Video generation in progress... (${Math.round((Date.now() - startTime) / 1000)}s)`);
    await sleep(pollInterval);
  }

  throw new Error(`Video generation timed out after ${maxWaitTime / 1000} seconds`);
}

async function downloadVideo(videoUri: string, outputPath: string, apiKey: string): Promise<string> {
  const response = await fetch(videoUri, {
    headers: {
      'x-goog-api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));

  return outputPath;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate a video from a text prompt
 */
export async function generateVideo(params: GenerateVideoParams): Promise<VeoResult> {
  const {
    prompt,
    model = 'veo-3.1-generate-preview',
    aspectRatio = '16:9',
    resolution = '720p',
    durationSeconds = '8',
    negativePrompt,
    output = 'url',
    outputPath,
    filename,
    pollInterval = 10000,
    maxWaitTime = 600000,
  } = params;

  try {
    const apiKey = getApiKey();

    const requestBody: Record<string, unknown> = {
      instances: [{
        prompt,
      }],
      parameters: {
        aspectRatio,
        resolution,
        durationSeconds: parseInt(durationSeconds),
      },
    };

    if (negativePrompt) {
      (requestBody.instances as Record<string, unknown>[])[0].negativePrompt = negativePrompt;
    }

    console.log(`🎬 Starting video generation with ${model}...`);
    console.log(`   📝 Prompt: ${prompt.slice(0, 100)}...`);
    console.log(`   📐 Aspect Ratio: ${aspectRatio}`);
    console.log(`   🎥 Resolution: ${resolution}`);
    console.log(`   ⏱️  Duration: ${durationSeconds}s`);

    const { operationName } = await startVideoGeneration(apiKey, model, requestBody);
    console.log(`   🔄 Operation started: ${operationName}`);

    const { videoUri } = await pollOperation(apiKey, operationName, pollInterval, maxWaitTime);

    // Calculate cost
    const videoDuration = parseInt(durationSeconds);
    const cost = calculateCost(model, videoDuration);

    console.log(`✅ Video generated successfully!`);
    console.log(`   💰 Estimated cost: $${cost.usd} USD (~€${cost.eur} EUR)`);

    if (output === 'file' && outputPath) {
      const dir = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      await fs.mkdir(dir, { recursive: true });

      const videoFilename = filename || generateFilename(prompt);
      const filePath = path.join(dir, `${videoFilename}.mp4`);

      console.log(`📥 Downloading video to: ${filePath}`);
      await downloadVideo(videoUri, filePath, apiKey);
      console.log(`💾 Video saved: ${filePath}`);

      return {
        success: true,
        videoUrl: videoUri,
        savedPath: filePath,
        operationName,
        model,
        videoDurationSeconds: videoDuration,
        estimatedCostUSD: cost.usd,
        estimatedCostEUR: cost.eur,
      };
    }

    return {
      success: true,
      videoUrl: videoUri,
      operationName,
      model,
      videoDurationSeconds: videoDuration,
      estimatedCostUSD: cost.usd,
      estimatedCostEUR: cost.eur,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate a video from an image (animate a still image)
 */
export async function imageToVideo(params: ImageToVideoParams): Promise<VeoResult> {
  const {
    imagePath,
    prompt,
    model = 'veo-3.1-generate-preview',
    aspectRatio = '16:9',
    resolution = '720p',
    durationSeconds = '8',
    negativePrompt,
    output = 'url',
    outputPath,
    filename,
    pollInterval = 10000,
    maxWaitTime = 600000,
  } = params;

  try {
    const apiKey = getApiKey();
    const imageData = await imageToBase64(imagePath);

    const requestBody: Record<string, unknown> = {
      instances: [{
        prompt,
        image: {
          bytesBase64Encoded: imageData.data,
          mimeType: imageData.mimeType,
        },
      }],
      parameters: {
        aspectRatio,
        resolution,
        durationSeconds: parseInt(durationSeconds),
      },
    };

    if (negativePrompt) {
      (requestBody.instances as Record<string, unknown>[])[0].negativePrompt = negativePrompt;
    }

    console.log(`🎬 Starting image-to-video generation with ${model}...`);
    console.log(`   🖼️  Image: ${imagePath}`);
    console.log(`   📝 Prompt: ${prompt.slice(0, 100)}...`);

    const { operationName } = await startVideoGeneration(apiKey, model, requestBody);
    const { videoUri } = await pollOperation(apiKey, operationName, pollInterval, maxWaitTime);

    // Calculate cost
    const videoDuration = parseInt(durationSeconds);
    const cost = calculateCost(model, videoDuration);

    console.log(`✅ Video generated successfully!`);
    console.log(`   💰 Estimated cost: $${cost.usd} USD (~€${cost.eur} EUR)`);

    if (output === 'file' && outputPath) {
      const dir = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      await fs.mkdir(dir, { recursive: true });

      const videoFilename = filename || generateFilename(prompt);
      const filePath = path.join(dir, `${videoFilename}.mp4`);

      await downloadVideo(videoUri, filePath, apiKey);
      console.log(`💾 Video saved: ${filePath}`);

      return {
        success: true,
        videoUrl: videoUri,
        savedPath: filePath,
        operationName,
        model,
        videoDurationSeconds: videoDuration,
        estimatedCostUSD: cost.usd,
        estimatedCostEUR: cost.eur,
      };
    }

    return {
      success: true,
      videoUrl: videoUri,
      operationName,
      model,
      videoDurationSeconds: videoDuration,
      estimatedCostUSD: cost.usd,
      estimatedCostEUR: cost.eur,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate a video by interpolating between two frames
 * (Veo 3.1 only)
 */
export async function interpolateVideo(params: InterpolateVideoParams): Promise<VeoResult> {
  const {
    firstFramePath,
    lastFramePath,
    prompt,
    model = 'veo-3.1-generate-preview',
    aspectRatio = '16:9',
    resolution = '720p',
    durationSeconds = '8',
    negativePrompt,
    output = 'url',
    outputPath,
    filename,
    pollInterval = 10000,
    maxWaitTime = 600000,
  } = params;

  try {
    const apiKey = getApiKey();
    const firstFrame = await imageToBase64(firstFramePath);
    const lastFrame = await imageToBase64(lastFramePath);

    const requestBody: Record<string, unknown> = {
      instances: [{
        prompt,
        image: {
          bytesBase64Encoded: firstFrame.data,
          mimeType: firstFrame.mimeType,
        },
        lastFrame: {
          bytesBase64Encoded: lastFrame.data,
          mimeType: lastFrame.mimeType,
        },
      }],
      parameters: {
        aspectRatio,
        resolution,
        durationSeconds: parseInt(durationSeconds),
      },
    };

    if (negativePrompt) {
      (requestBody.instances as Record<string, unknown>[])[0].negativePrompt = negativePrompt;
    }

    console.log(`🎬 Starting frame interpolation with ${model}...`);
    console.log(`   🖼️  First frame: ${firstFramePath}`);
    console.log(`   🖼️  Last frame: ${lastFramePath}`);
    console.log(`   📝 Prompt: ${prompt.slice(0, 100)}...`);

    const { operationName } = await startVideoGeneration(apiKey, model, requestBody);
    const { videoUri } = await pollOperation(apiKey, operationName, pollInterval, maxWaitTime);

    // Calculate cost
    const videoDuration = parseInt(durationSeconds);
    const cost = calculateCost(model, videoDuration);

    console.log(`✅ Video interpolation complete!`);
    console.log(`   💰 Estimated cost: $${cost.usd} USD (~€${cost.eur} EUR)`);

    if (output === 'file' && outputPath) {
      const dir = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      await fs.mkdir(dir, { recursive: true });

      const videoFilename = filename || generateFilename(prompt);
      const filePath = path.join(dir, `${videoFilename}.mp4`);

      await downloadVideo(videoUri, filePath, apiKey);
      console.log(`💾 Video saved: ${filePath}`);

      return {
        success: true,
        videoUrl: videoUri,
        savedPath: filePath,
        operationName,
        model,
        videoDurationSeconds: videoDuration,
        estimatedCostUSD: cost.usd,
        estimatedCostEUR: cost.eur,
      };
    }

    return {
      success: true,
      videoUrl: videoUri,
      operationName,
      model,
      videoDurationSeconds: videoDuration,
      estimatedCostUSD: cost.usd,
      estimatedCostEUR: cost.eur,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extend a previously generated video
 * (Veo 3.1 only)
 */
export async function extendVideo(params: ExtendVideoParams): Promise<VeoResult> {
  const {
    videoUri,
    prompt,
    model = 'veo-3.1-generate-preview',
    durationSeconds = '8',
    output = 'url',
    outputPath,
    filename,
    pollInterval = 10000,
    maxWaitTime = 600000,
  } = params;

  try {
    const apiKey = getApiKey();

    const requestBody: Record<string, unknown> = {
      instances: [{
        prompt,
        video: {
          uri: videoUri,
        },
      }],
      parameters: {
        durationSeconds: parseInt(durationSeconds),
      },
    };

    console.log(`🎬 Starting video extension with ${model}...`);
    console.log(`   🎥 Source video: ${videoUri.slice(0, 50)}...`);
    console.log(`   📝 Prompt: ${prompt.slice(0, 100)}...`);
    console.log(`   ⏱️  Extension duration: ${durationSeconds}s`);

    const { operationName } = await startVideoGeneration(apiKey, model, requestBody);
    const { videoUri: newVideoUri } = await pollOperation(apiKey, operationName, pollInterval, maxWaitTime);

    // Calculate cost
    const videoDuration = parseInt(durationSeconds);
    const cost = calculateCost(model, videoDuration);

    console.log(`✅ Video extended successfully!`);
    console.log(`   💰 Estimated cost: $${cost.usd} USD (~€${cost.eur} EUR)`);

    if (output === 'file' && outputPath) {
      const dir = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      await fs.mkdir(dir, { recursive: true });

      const videoFilename = filename || generateFilename(prompt);
      const filePath = path.join(dir, `${videoFilename}.mp4`);

      await downloadVideo(newVideoUri, filePath, apiKey);
      console.log(`💾 Video saved: ${filePath}`);

      return {
        success: true,
        videoUrl: newVideoUri,
        savedPath: filePath,
        operationName,
        model,
        videoDurationSeconds: videoDuration,
        estimatedCostUSD: cost.usd,
        estimatedCostEUR: cost.eur,
      };
    }

    return {
      success: true,
      videoUrl: newVideoUri,
      operationName,
      model,
      videoDurationSeconds: videoDuration,
      estimatedCostUSD: cost.usd,
      estimatedCostEUR: cost.eur,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate video with reference images for style/subject guidance
 * (Veo 3.1 only - up to 3 reference images)
 */
export async function generateWithReferences(params: GenerateWithReferencesParams): Promise<VeoResult> {
  const {
    prompt,
    referenceImages,
    model = 'veo-3.1-generate-preview',
    aspectRatio = '16:9',
    resolution = '720p',
    durationSeconds = '8',
    negativePrompt,
    output = 'url',
    outputPath,
    filename,
    pollInterval = 10000,
    maxWaitTime = 600000,
  } = params;

  if (referenceImages.length > 3) {
    return {
      success: false,
      error: 'Maximum 3 reference images allowed',
    };
  }

  try {
    const apiKey = getApiKey();

    const referenceImagesData = await Promise.all(
      referenceImages.map(async (ref) => {
        const imageData = await imageToBase64(ref.imagePath);
        // Veo 3.1 API format:
        // - 'image' (not 'referenceImage')
        // - referenceType: 'asset' (for subject) or 'style' (Veo 2 only)
        // - Veo 3.1 only supports 'asset', not 'style'
        return {
          image: {
            bytesBase64Encoded: imageData.data,
            mimeType: imageData.mimeType,
          },
          referenceType: ref.referenceType === 'style' ? 'style' : 'asset',
        };
      })
    );

    const requestBody: Record<string, unknown> = {
      instances: [{
        prompt,
        referenceImages: referenceImagesData,
      }],
      parameters: {
        aspectRatio,
        resolution,
        durationSeconds: parseInt(durationSeconds),
      },
    };

    if (negativePrompt) {
      (requestBody.instances as Record<string, unknown>[])[0].negativePrompt = negativePrompt;
    }

    console.log(`🎬 Starting video generation with references using ${model}...`);
    console.log(`   📝 Prompt: ${prompt.slice(0, 100)}...`);
    console.log(`   🖼️  Reference images: ${referenceImages.length}`);

    const { operationName } = await startVideoGeneration(apiKey, model, requestBody);
    const { videoUri } = await pollOperation(apiKey, operationName, pollInterval, maxWaitTime);

    // Calculate cost
    const videoDuration = parseInt(durationSeconds);
    const cost = calculateCost(model, videoDuration);

    console.log(`✅ Video generated successfully!`);
    console.log(`   💰 Estimated cost: $${cost.usd} USD (~€${cost.eur} EUR)`);

    if (output === 'file' && outputPath) {
      const dir = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath);
      await fs.mkdir(dir, { recursive: true });

      const videoFilename = filename || generateFilename(prompt);
      const filePath = path.join(dir, `${videoFilename}.mp4`);

      await downloadVideo(videoUri, filePath, apiKey);
      console.log(`💾 Video saved: ${filePath}`);

      return {
        success: true,
        videoUrl: videoUri,
        savedPath: filePath,
        operationName,
        model,
        videoDurationSeconds: videoDuration,
        estimatedCostUSD: cost.usd,
        estimatedCostEUR: cost.eur,
      };
    }

    return {
      success: true,
      videoUrl: videoUri,
      operationName,
      model,
      videoDurationSeconds: videoDuration,
      estimatedCostUSD: cost.usd,
      estimatedCostEUR: cost.eur,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
