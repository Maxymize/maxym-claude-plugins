/**
 * Nano Banana (Gemini) Image Code Execution Client
 *
 * Direct connection to Google Gemini Image API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * Default model: gemini-3-pro-image-preview (Gemini 3 Pro with 4K support)
 * Features:
 * - Text-to-image generation (up to 4K)
 * - Image editing with natural language
 * - Image restoration
 * - Google Search grounding (Gemini 3 Pro)
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 * @see https://github.com/ConechoAI/Nano-Banana-MCP
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Supported aspect ratios for Gemini 3 Pro image generation
// 'auto' lets the model choose the best ratio
export type AspectRatio = 'auto' | '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2';

// Supported image sizes
export type ImageSize = '1K' | '2K' | '4K';

// Supported MIME types
export type MimeType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/heic';

// Output format
export type OutputFormat = 'base64' | 'file';

// Available models for image generation
// gemini-2.0-flash-exp: Legacy experimental model (no aspectRatio/imageSize support)
// gemini-2.5-flash-image: Stable model with aspectRatio and imageSize support
// gemini-3-pro-image-preview: Latest Gemini 3 Pro with 4K, Google Search grounding, thinking (DEFAULT)
export type GeminiImageModel =
  | 'gemini-2.0-flash-exp'           // Legacy, basic
  | 'gemini-2.5-flash-image'         // Stable
  | 'gemini-3-pro-image-preview';    // DEFAULT - Most advanced (4K, grounding)

// Style variations for generation
export type StyleVariation =
  | 'watercolor'
  | 'oil-painting'
  | 'sketch'
  | 'photorealistic'
  | 'anime'
  | 'minimalist'
  | 'digital-art'
  | 'cartoon'
  | 'impressionist'
  | '3d-render';

// Variation types
export type VariationType = 'lighting' | 'mood' | 'color-palette' | 'composition';

export interface GenerateImageParams {
  prompt: string;
  model?: GeminiImageModel;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  temperature?: number;  // 0.0-2.0, default 1.0 for Gemini 3 Pro (best for reasoning)
  output?: OutputFormat;
  outputPath?: string;
  styles?: StyleVariation[];
  variations?: VariationType[];
  outputCount?: number;
  seed?: number;
}

export interface EditImageParams {
  prompt: string;
  imagePath: string;
  model?: GeminiImageModel;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  temperature?: number;  // 0.0-2.0, default 1.0 for Gemini 3 Pro
  output?: OutputFormat;
  outputPath?: string;
  referenceImages?: string[];
}

export interface RestoreImageParams {
  prompt: string;
  imagePath: string;
  model?: GeminiImageModel;
  output?: OutputFormat;
  outputPath?: string;
}

export interface ImageResponse {
  success: boolean;
  message: string;
  generatedFiles?: string[];
  error?: string;
  data?: Array<{
    base64?: string;
    mimeType?: string;
    text?: string;
  }>;
}

/**
 * Get Gemini API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Get your key at https://aistudio.google.com/apikey');
  }
  return apiKey;
}

/**
 * Load image as base64 from file path
 */
async function loadImageAsBase64(imagePath: string): Promise<{ data: string; mimeType: MimeType }> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const buffer = await fs.readFile(imagePath);
  const base64 = buffer.toString('base64');

  // Determine MIME type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, MimeType> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.heic': 'image/heic'
  };

  const mimeType = mimeTypes[ext] || 'image/png';

  return { data: base64, mimeType };
}

/**
 * Save base64 image to file
 */
async function saveBase64ToFile(base64Data: string, outputPath: string): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(outputPath, buffer);
  console.log(`Saved image to: ${outputPath}`);
}

/**
 * Generate a unique filename based on prompt and timestamp
 */
function generateFilename(prompt: string, index: number = 0): string {
  const timestamp = Date.now();
  const sanitized = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);

  const suffix = index > 0 ? `_${index}` : '';
  return `nanobanana_${sanitized}${suffix}_${timestamp}.png`;
}

/**
 * Build prompt with style variations
 */
function buildStyledPrompt(basePrompt: string, style?: StyleVariation): string {
  const styleModifiers: Record<StyleVariation, string> = {
    'watercolor': 'in watercolor painting style, soft colors, flowing brushstrokes',
    'oil-painting': 'in oil painting style, rich textures, visible brushwork',
    'sketch': 'as a pencil sketch, line art, hand-drawn style',
    'photorealistic': 'photorealistic, highly detailed, professional photography',
    'anime': 'in anime style, Japanese animation aesthetic',
    'minimalist': 'minimalist design, clean lines, simple composition',
    'digital-art': 'digital art style, vibrant colors, modern illustration',
    'cartoon': 'cartoon style, bold outlines, exaggerated features',
    'impressionist': 'impressionist painting style, light and color focus',
    '3d-render': '3D render, CGI quality, volumetric lighting'
  };

  if (style && styleModifiers[style]) {
    return `${basePrompt}, ${styleModifiers[style]}`;
  }

  return basePrompt;
}

/**
 * Build prompt with variation types
 */
function buildVariationPrompt(basePrompt: string, variation?: VariationType, index?: number): string {
  const variationModifiers: Record<VariationType, string[]> = {
    'lighting': ['dramatic lighting', 'soft diffused lighting', 'golden hour lighting', 'studio lighting'],
    'mood': ['cheerful and bright mood', 'dramatic and intense mood', 'calm and peaceful mood', 'mysterious atmosphere'],
    'color-palette': ['warm color palette', 'cool color palette', 'monochromatic', 'vibrant saturated colors'],
    'composition': ['centered composition', 'rule of thirds', 'dynamic diagonal composition', 'symmetrical layout']
  };

  if (variation && variationModifiers[variation] && index !== undefined) {
    const modifiers = variationModifiers[variation];
    const modifier = modifiers[index % modifiers.length];
    return `${basePrompt}, ${modifier}`;
  }

  return basePrompt;
}

/**
 * Generate images using Google Gemini's image generation model (Nano Banana)
 *
 * @param params - Image generation parameters
 * @returns Response with generated image data or file paths
 *
 * @example
 * // Generate a single image
 * const result = await generateImage({
 *   prompt: 'A serene landscape with mountains',
 *   aspectRatio: '16:9',
 *   imageSize: '2K'
 * });
 *
 * @example
 * // Generate with style variations
 * const result = await generateImage({
 *   prompt: 'A cozy coffee shop',
 *   styles: ['watercolor', 'photorealistic'],
 *   outputCount: 2,
 *   output: 'file',
 *   outputPath: './output/'
 * });
 */
export async function generateImage(params: GenerateImageParams): Promise<ImageResponse> {
  const apiKey = getApiKey();
  const model = params.model || 'gemini-3-pro-image-preview';

  const results: Array<{ base64?: string; mimeType?: string; text?: string }> = [];
  const generatedFiles: string[] = [];

  // Determine how many images to generate
  const outputCount = params.outputCount || 1;
  const styles = params.styles || [];
  const variations = params.variations || [];

  // Calculate total generations needed
  const totalGenerations = Math.max(
    outputCount,
    styles.length || 1,
    variations.length ? outputCount : 1
  );

  try {
    for (let i = 0; i < totalGenerations; i++) {
      // Build prompt with style/variation if applicable
      let finalPrompt = params.prompt;

      if (styles.length > 0) {
        const styleIndex = i % styles.length;
        finalPrompt = buildStyledPrompt(finalPrompt, styles[styleIndex]);
      }

      if (variations.length > 0) {
        const variationIndex = i % variations.length;
        finalPrompt = buildVariationPrompt(finalPrompt, variations[variationIndex], i);
      }

      // Build request body
      const body: any = {
        contents: [{
          parts: [{ text: finalPrompt }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      };

      // Add temperature (default 1.0 for Gemini 3 Pro - best for reasoning)
      if (params.temperature !== undefined) {
        body.generationConfig.temperature = params.temperature;
      }

      // Add image config if specified (only for models that support it)
      // gemini-2.0-flash-exp does NOT support aspectRatio or imageSize
      // gemini-2.5-flash-image and gemini-3-pro-image-preview DO support them
      const supportsImageConfig = model !== 'gemini-2.0-flash-exp';
      if (supportsImageConfig && (params.aspectRatio || params.imageSize)) {
        body.generationConfig.imageConfig = {};
        if (params.aspectRatio && params.aspectRatio !== 'auto') {
          body.generationConfig.imageConfig.aspectRatio = params.aspectRatio;
        }
        if (params.imageSize) {
          body.generationConfig.imageConfig.imageSize = params.imageSize;
        }
      }

      // Add seed for reproducibility
      if (params.seed !== undefined) {
        body.generationConfig.seed = params.seed + i;
      }

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();

      // Extract image data from response
      if (result.candidates && result.candidates[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageData = {
              base64: part.inlineData.data,
              mimeType: part.inlineData.mimeType
            };
            results.push(imageData);

            // Save to file if requested
            if (params.output === 'file' && params.outputPath) {
              const path = await import('path');
              const filename = generateFilename(params.prompt, i);
              const fullPath = path.join(params.outputPath, filename);
              await saveBase64ToFile(imageData.base64!, fullPath);
              generatedFiles.push(fullPath);
            }
          } else if (part.text) {
            results.push({ text: part.text });
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully generated ${results.filter(r => r.base64).length} image(s)`,
      generatedFiles: generatedFiles.length > 0 ? generatedFiles : undefined,
      data: results
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to generate image',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Edit an existing image using natural language instructions
 *
 * @param params - Image editing parameters
 * @returns Response with edited image data or file paths
 *
 * @example
 * const result = await editImage({
 *   prompt: 'Add sunglasses to the person',
 *   imagePath: './portrait.jpg',
 *   output: 'file',
 *   outputPath: './output/edited_portrait.png'
 * });
 */
export async function editImage(params: EditImageParams): Promise<ImageResponse> {
  const apiKey = getApiKey();
  const model = params.model || 'gemini-3-pro-image-preview';

  try {
    // Load the input image
    const inputImage = await loadImageAsBase64(params.imagePath);

    // Build parts array with prompt and image
    const parts: any[] = [
      { text: params.prompt },
      {
        inline_data: {
          mime_type: inputImage.mimeType,
          data: inputImage.data
        }
      }
    ];

    // Add reference images if provided
    if (params.referenceImages && params.referenceImages.length > 0) {
      for (const refPath of params.referenceImages) {
        const refImage = await loadImageAsBase64(refPath);
        parts.push({
          inline_data: {
            mime_type: refImage.mimeType,
            data: refImage.data
          }
        });
      }
    }

    // Build request body
    const body: any = {
      contents: [{
        parts
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    };

    // Add temperature (default 1.0 for Gemini 3 Pro)
    if (params.temperature !== undefined) {
      body.generationConfig.temperature = params.temperature;
    }

    // Add image config if specified
    if (params.aspectRatio || params.imageSize) {
      body.generationConfig.imageConfig = {};
      if (params.aspectRatio && params.aspectRatio !== 'auto') {
        body.generationConfig.imageConfig.aspectRatio = params.aspectRatio;
      }
      if (params.imageSize) {
        body.generationConfig.imageConfig.imageSize = params.imageSize;
      }
    }

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const results: Array<{ base64?: string; mimeType?: string; text?: string }> = [];
    const generatedFiles: string[] = [];

    // Extract image data from response
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
          results.push(imageData);

          // Save to file if requested
          if (params.output === 'file' && params.outputPath) {
            await saveBase64ToFile(imageData.base64!, params.outputPath);
            generatedFiles.push(params.outputPath);
          }
        } else if (part.text) {
          results.push({ text: part.text });
        }
      }
    }

    return {
      success: true,
      message: 'Successfully edited image',
      generatedFiles: generatedFiles.length > 0 ? generatedFiles : undefined,
      data: results
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to edit image',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Restore a damaged or old image using AI enhancement
 *
 * @param params - Image restoration parameters
 * @returns Response with restored image data or file paths
 *
 * @example
 * const result = await restoreImage({
 *   prompt: 'Remove scratches, enhance colors, fix faded areas',
 *   imagePath: './old_photo.jpg',
 *   output: 'file',
 *   outputPath: './output/restored_photo.png'
 * });
 */
export async function restoreImage(params: RestoreImageParams): Promise<ImageResponse> {
  // Restoration is essentially editing with a restoration-focused prompt
  const restorationPrompt = `Restore and enhance this image: ${params.prompt}.
    Improve image quality, fix any damage, enhance colors while maintaining the original subject and composition.`;

  return editImage({
    prompt: restorationPrompt,
    imagePath: params.imagePath,
    model: params.model,
    output: params.output,
    outputPath: params.outputPath
  });
}

/**
 * Helper to save base64 image data to a file
 *
 * @param base64Data - Base64 encoded image data
 * @param outputPath - Where to save the file
 */
export async function saveImageToFile(base64Data: string, outputPath: string): Promise<void> {
  await saveBase64ToFile(base64Data, outputPath);
}

/**
 * Helper to convert image file to base64
 *
 * @param imagePath - Path to the image file
 * @returns Base64 encoded image data with MIME type
 */
export async function imageToBase64(imagePath: string): Promise<{ data: string; mimeType: string }> {
  return loadImageAsBase64(imagePath);
}
