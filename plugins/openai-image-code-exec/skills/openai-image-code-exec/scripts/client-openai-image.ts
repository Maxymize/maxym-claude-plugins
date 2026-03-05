/**
 * OpenAI Image Code Execution Client
 *
 * Direct connection to OpenAI Images API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://platform.openai.com/docs/api-reference/images
 */

const OPENAI_API_BASE = 'https://api.openai.com/v1';

// DALL-E 3 sizes: 1024x1024, 1792x1024, 1024x1792
// DALL-E 2 sizes: 256x256, 512x512, 1024x1024
export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792' | '256x256' | '512x512';
export type ImageQuality = 'auto' | 'high' | 'medium' | 'low';
export type ImageBackground = 'transparent' | 'opaque' | 'auto';
export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type ImageOutput = 'base64' | 'file_output';
export type ModerationLevel = 'auto' | 'low';

export interface CreateImageParams {
  prompt: string;
  model?: 'dall-e-3' | 'dall-e-2' | 'gpt-image-1';
  size?: ImageSize;
  quality?: ImageQuality;
  background?: ImageBackground;
  output?: ImageOutput;
  file_output?: string;
  n?: number;
  output_format?: ImageFormat;
  output_compression?: number;
  moderation?: ModerationLevel;
  user?: string;
}

export interface EditImageParams {
  image: string;
  prompt: string;
  mask?: string;
  model?: 'gpt-image-1';
  size?: ImageSize;
  quality?: ImageQuality;
  output?: ImageOutput;
  file_output?: string;
  n?: number;
  user?: string;
}

export interface ImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

/**
 * Get OpenAI API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Create images using OpenAI's gpt-image-1 model
 *
 * @param params - Image generation parameters
 * @returns Response with generated image URLs or base64 data
 *
 * @example
 * // Generate a single image
 * const result = await createImage({
 *   prompt: 'A serene landscape with mountains',
 *   size: '1024x1024',
 *   quality: 'high'
 * });
 *
 * @example
 * // Generate and save to file
 * const result = await createImage({
 *   prompt: 'A futuristic city at sunset',
 *   output: 'file_output',
 *   file_output: '/path/to/output.png',
 *   output_format: 'png'
 * });
 */
export async function createImage(params: CreateImageParams): Promise<ImageResponse> {
  const apiKey = getApiKey();

  // Build request body following OpenAI API format
  // DALL-E 3 is the current production model
  const model = params.model || 'dall-e-3';

  const body: any = {
    model,
    prompt: params.prompt,
    n: params.n || 1,
    size: params.size || '1024x1024'
  };

  // DALL-E 3 specific parameters
  if (model === 'dall-e-3') {
    if (params.quality) body.quality = params.quality === 'high' ? 'hd' : 'standard';
  }

  // response_format is supported but optional
  if (params.output === 'file_output') {
    body.response_format = 'b64_json';
  }

  if (params.user) body.user = params.user;

  try {
    const response = await fetch(`${OPENAI_API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const result: ImageResponse = await response.json();

    // If file_output is requested, save the images
    if (params.output === 'file_output' && params.file_output) {
      await saveImagesToFiles(result, params.file_output, params.output_format || 'png');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to create image: ${error}`);
  }
}

/**
 * Edit an existing image using OpenAI's gpt-image-1 model
 *
 * @param params - Image editing parameters
 * @returns Response with edited image URLs or base64 data
 *
 * @example
 * const result = await editImage({
 *   image: '/path/to/image.png',
 *   prompt: 'Add a rainbow in the sky',
 *   mask: '/path/to/mask.png'
 * });
 */
export async function editImage(params: EditImageParams): Promise<ImageResponse> {
  const apiKey = getApiKey();

  // For editing, we need to use FormData
  const formData = new FormData();

  // Handle image input (file path or base64)
  const imageBuffer = await loadImageBuffer(params.image);
  const imageBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' });
  formData.append('image', imageBlob, 'image.png');

  formData.append('prompt', params.prompt);
  formData.append('model', params.model || 'gpt-image-1');
  formData.append('n', String(params.n || 1));
  formData.append('size', params.size || '1024x1024');
  formData.append('response_format', params.output === 'file_output' ? 'b64_json' : 'url');

  // Add mask if provided
  if (params.mask) {
    const maskBuffer = await loadImageBuffer(params.mask);
    const maskBlob = new Blob([new Uint8Array(maskBuffer)], { type: 'image/png' });
    formData.append('mask', maskBlob, 'mask.png');
  }

  // Add optional parameters
  if (params.quality) formData.append('quality', params.quality);
  if (params.user) formData.append('user', params.user);

  try {
    const response = await fetch(`${OPENAI_API_BASE}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const result: ImageResponse = await response.json();

    // If file_output is requested, save the images
    if (params.output === 'file_output' && params.file_output) {
      await saveImagesToFiles(result, params.file_output, 'png');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to edit image: ${error}`);
  }
}

/**
 * Load image buffer from file path or base64 string
 */
async function loadImageBuffer(imageInput: string): Promise<Buffer> {
  // Check if it's a base64 string
  if (imageInput.startsWith('data:image')) {
    const base64Data = imageInput.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else if (imageInput.match(/^[A-Za-z0-9+/=]+$/)) {
    return Buffer.from(imageInput, 'base64');
  }

  // Otherwise treat as file path
  const fs = await import('fs/promises');
  return fs.readFile(imageInput);
}

/**
 * Save images from API response to files
 */
async function saveImagesToFiles(
  response: ImageResponse,
  basePath: string,
  format: ImageFormat = 'png'
): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  for (let i = 0; i < response.data.length; i++) {
    const imageData = response.data[i];

    // Determine output path
    let outputPath = basePath;
    if (response.data.length > 1) {
      const ext = path.extname(basePath);
      const base = basePath.slice(0, -ext.length);
      outputPath = `${base}_${i + 1}${ext}`;
    }

    // Get image data
    let buffer: Buffer;
    if (imageData.b64_json) {
      buffer = Buffer.from(imageData.b64_json, 'base64');
    } else if (imageData.url) {
      // Download from URL
      const imageResponse = await fetch(imageData.url);
      const arrayBuffer = await imageResponse.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No image data in response');
    }

    // Save to file
    await fs.writeFile(outputPath, buffer);
    console.log(`Saved image to: ${outputPath}`);
  }
}

/**
 * Helper to download image from URL and save to file
 *
 * @param url - Image URL to download
 * @param outputPath - Where to save the file
 *
 * @example
 * await downloadImage(result.data[0].url, '/path/to/output.png');
 */
export async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, buffer);
  console.log(`Downloaded image to: ${outputPath}`);
}

/**
 * Helper to convert base64 to file
 *
 * @param base64Data - Base64 encoded image data
 * @param outputPath - Where to save the file
 */
export async function base64ToFile(base64Data: string, outputPath: string): Promise<void> {
  const buffer = Buffer.from(base64Data, 'base64');
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, buffer);
  console.log(`Saved base64 image to: ${outputPath}`);
}
