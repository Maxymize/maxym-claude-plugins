---
name: openai-image-code-exec
description: Generate and edit images using OpenAI's DALL-E 3 model with the Code Execution pattern (99%+ token reduction). Use when user asks to create images, generate artwork, design graphics, or work with AI image generation. Triggers include "create image", "generate image", "make a picture", "draw", "design", "illustrate", "realizza un'immagine", "genera un'immagine", "crea un disegno".
---

# OpenAI Image Code Execution

Direct connection to OpenAI Images API without MCP server overhead, following Anthropic's Code Execution pattern.

## When to Use This Skill

Use this skill when the user asks to:
- Create/generate/make an image
- Draw/illustrate/design something
- Generate artwork or graphics
- Create variations of an image
- Edit an existing image

---

## INITIAL MODE SELECTION

**CRITICAL**: When the user wants to generate an image, ALWAYS present this choice FIRST:

```
🎨 **MODALITÀ DI GENERAZIONE IMMAGINE**

Come vuoi procedere?

   1️⃣  **Prompt Manuale** - Scrivi direttamente il prompt completo
       (Per utenti esperti che sanno già cosa vogliono)

   2️⃣  **Procedura Guidata** - Ti guido passo passo con domande mirate
       (Costruiamo insieme il prompt perfetto)

Scegli 1 o 2:
```

---

### IF USER CHOOSES 1 (MANUAL PROMPT)

Ask for the complete prompt:

```
📝 **PROMPT MANUALE**

Scrivi il tuo prompt completo per l'immagine.
Puoi scriverlo in italiano o inglese - sarà passato direttamente a DALL-E.

Suggerimento: Sii specifico! Includi soggetto, ambiente, stile, illuminazione e dettagli.

Il tuo prompt:
```

After receiving the prompt, ask for format preference:

```
📐 **FORMATO** (opzionale - default: quadrato)
   1. Orizzontale (landscape - 1792x1024)
   2. Verticale (portrait - 1024x1792)
   3. Quadrato (square - 1024x1024)

🔍 **QUALITÀ** (opzionale - default: HD)
   1. Standard - più veloce
   2. HD - massima qualità

(Rispondi con numeri o "skip" per usare i default)
```

Then:
1. Show a brief summary with the prompt and parameters
2. Ask for confirmation: "✅ Procedo con questo prompt? ✏️ Vuoi modificare qualcosa?"
3. If confirmed, execute `createImage()` with the user's prompt

---

### IF USER CHOOSES 2 (GUIDED PROCEDURE)

Follow the INTERACTIVE PROMPT BUILDER WORKFLOW below.

---

## INTERACTIVE PROMPT BUILDER WORKFLOW (Guided Mode)

**CRITICAL**: Follow this interactive workflow to collect user preferences. Ask questions to build a professional prompt. The user can skip questions they don't want to answer.

### Step 1: Present Quick Questions

When in guided mode, ask these questions (user answers only what they want):

```
Per creare un'immagine ottimale, rispondi alle domande che vuoi (puoi saltare quelle che non ti interessano):

📐 **FORMATO**
   1. Orizzontale (landscape - 1792x1024) - ideale per paesaggi, scene, banner
   2. Verticale (portrait - 1024x1792) - ideale per ritratti, poster, mobile
   3. Quadrato (square - 1024x1024) - ideale per social, icone, avatar

🎨 **STILE**
   1. Fotorealistico - come una foto vera
   2. Illustrazione digitale - stile grafico moderno
   3. Pittura artistica - impressionista, olio, acquerello
   4. 3D Render - stile CGI/Pixar
   5. Fumetto/Cartoon - stile animazione
   6. Minimalista - essenziale, pulito
   7. Vintage/Retrò - atmosfera anni passati
   8. Cinematografico - stile film, drammatico

💡 **ILLUMINAZIONE** (opzionale)
   1. Luce naturale - soft, realistica
   2. Golden hour - tramonto/alba dorata
   3. Drammatica - contrasti forti, ombre
   4. Studio - illuminazione professionale controllata
   5. Neon/Cyberpunk - luci artificiali colorate
   6. Soft/Diffusa - delicata, senza ombre dure

🔍 **QUALITÀ**
   1. Standard - buona qualità, più veloce
   2. HD - massima qualità, più dettagli

Rispondi con i numeri o descrivi liberamente le tue preferenze!
```

### Step 2: Build Professional Prompt

Based on user's description + answers, construct the prompt using these 6 components:

| Component | Description | Example |
|-----------|-------------|---------|
| **SUBJECT** | Chi/cosa è il focus principale (specifico, non generico) | "a young woman with freckles" not "woman" |
| **ACTION** | Cosa sta facendo il soggetto (aggiunge dinamismo) | "smiling thoughtfully and sitting" |
| **ENVIRONMENT** | Dove si svolge la scena (contesto e atmosfera) | "in a cozy cafe by the window" |
| **ART STYLE** | Look desiderato (riferimenti a camera, movimenti artistici) | "shot on Canon 5D" or "impressionist style" |
| **LIGHTING** | Come è illuminata la scena (fondamentale per qualità) | "natural window light" or "dramatic side lighting" |
| **DETAILS** | Elementi specifici che aggiungono realismo | "warm coffee cup in hands, soft focus background" |

### Step 3: Show Generated Prompt for Approval

Present the constructed prompt to user:

```
📝 **PROMPT GENERATO:**

"[Full constructed prompt here]"

✅ Vuoi procedere con questo prompt?
✏️ Vuoi modificare qualcosa?
🔄 Vuoi che lo riscrivo completamente?
```

### Step 4: Execute Only After Approval

Only call `createImage()` after user confirms the prompt.

---

## PROMPT TEMPLATES BY CATEGORY

### Portrait Photography
```
[Detailed SUBJECT with physical characteristics] [ACTION/expression],
[professional ENVIRONMENT], shot with [LENS TYPE] on [CAMERA],
[LIGHTING TYPE], [DETAILS for character and authenticity]
```

**Example:**
"A confident business executive with salt-and-pepper hair, making direct eye-contact with the camera, in a modern corporate office with floor-to-ceiling windows, shot with 85mm portrait lens on medium format film, dramatic window lighting creating rim light effect, wearing tailored navy suit with subtle texture detail, shallow depth of field"

### Product Photography
```
A [specific PRODUCT] with [FEATURES], positioned at [ANGLE],
on [SURFACE], with [controlled LIGHTING], shot with macro lens for sharp detail,
[minimal BACKGROUND], [DETAILS showing craftsmanship]
```

**Example:**
"A luxury Swiss watch with rose gold case and black leather strap, positioned at three-quarter angle, on white marble surface with soft shadow, studio photography with softbox lighting, shot with macro lens for sharp detail, minimal background with subtle gradient"

### Landscape Photography
```
[LANDSCAPE TYPE] with [NATURAL ELEMENTS], [TIME OF DAY] with [LIGHT TYPE],
[FOREGROUND ELEMENTS] providing anchor, [BACKGROUND], [ATMOSPHERIC CONDITIONS],
natural depth and visual flow
```

**Example:**
"Alpine mountain lake with crystal clear water showing perfect reflections, sunrise with warm golden light, foreground rocks providing compositional anchor, snow-capped peaks in background, morning mist creating depth, mirror-like water surface"

### Street Photography
```
[SUBJECT] in [natural ACTION], [URBAN CONTEXT], captured in candid moment
with genuine expression, [natural LIGHTING], shot with 35mm lens,
background showing city life, authentic unposed feeling
```

### Abstract Art
```
[impossible FORMS] in [MATERIALS/textures], [INTERACTION between elements],
captured in moment of dynamic tension, [dramatic LIGHTING],
[texture EFFECTS], [CONTRAST between organic/geometric]
```

### Architectural
```
[BUILDING TYPE] with [FEATURES], positioned on [LOCATION],
captured during golden hour with [LIGHT], shot with wide-angle lens,
[SKY], [surrounding LANDSCAPE], clean lines emphasized
```

---

## STYLE KEYWORDS REFERENCE

### Photorealistic
- "photorealistic", "hyperrealistic", "ultra detailed"
- "shot on Canon 5D Mark IV", "85mm portrait lens"
- "natural skin texture", "authentic", "unposed"

### Digital Art
- "digital art", "digital painting", "concept art"
- "trending on ArtStation", "DeviantArt style"
- "vibrant colors", "detailed illustration"

### Cinematic
- "cinematic lighting", "movie still", "film grain"
- "anamorphic lens", "dramatic shadows"
- "color graded", "theatrical"

### Painting Styles
- "oil painting", "watercolor", "impressionist"
- "visible brushstrokes", "canvas texture"
- "in the style of [artist]"

### 3D/CGI
- "3D render", "Octane render", "Unreal Engine"
- "Pixar style", "CGI", "ray tracing"
- "volumetric lighting", "subsurface scattering"

### Minimalist
- "minimalist", "clean", "simple"
- "negative space", "geometric", "flat design"
- "monochromatic", "elegant"

---

## LIGHTING KEYWORDS

| Type | Keywords |
|------|----------|
| Natural | "natural light", "daylight", "soft window light" |
| Golden Hour | "golden hour", "warm sunset light", "magic hour" |
| Dramatic | "dramatic lighting", "chiaroscuro", "strong shadows", "rim light" |
| Studio | "studio lighting", "softbox", "three-point lighting", "even illumination" |
| Neon | "neon lights", "cyberpunk lighting", "colorful artificial lights" |
| Soft | "diffused light", "overcast", "soft shadows", "flat lighting" |

---

## QUALITY PRINCIPLES

### 1. Specificity is Key
- "nice lighting" ❌ → "dramatic window lighting creating rim light effect" ✅
- "woman" ❌ → "young woman with freckles and auburn hair" ✅

### 2. Every Word Counts
Each term drastically influences the result. Choose with purpose.

### 3. Authenticity Over Perfection
For portraits/people: preserve natural texture, skin pores, expression lines.

### 4. Context Consistency
Lighting and environment must make sense together.

## Setup (one-time per project)

1. Install dependencies:
```bash
npm install node-fetch
npm install -D @types/node
```

2. Copy `scripts/client-openai-image.ts` to your project (e.g., `lib/openai-image.ts`)

3. Set environment variable:
```bash
export OPENAI_API_KEY="sk-..."
```

Get your API key from: https://platform.openai.com/api-keys

## Usage

```typescript
import { createImage, editImage, downloadImage } from './client-openai-image.js';

// Generate a single image
const result = await createImage({
  prompt: 'A serene mountain landscape at sunset',
  size: '1024x1024',
  quality: 'high'
});
console.log(result.data[0].url); // Image URL

// Save image directly to file
await createImage({
  prompt: 'A futuristic cityscape',
  output: 'file_output',
  file_output: './output/city.png',
  output_format: 'png',
  quality: 'high'
});

// Generate multiple variations
const variations = await createImage({
  prompt: 'An abstract art piece',
  n: 3,
  size: '1024x1024'
});

// Edit an existing image
const edited = await editImage({
  image: './input/photo.png',
  prompt: 'Add a rainbow in the sky',
  mask: './input/mask.png'
});

// Download image from URL
await downloadImage(result.data[0].url, './output/downloaded.png');
```

## Available Functions

| Function | Description |
|----------|-------------|
| `createImage(params)` | Generate new images from text prompts |
| `editImage(params)` | Edit existing images with prompts and optional masks |
| `downloadImage(url, path)` | Download image from URL to file |
| `base64ToFile(base64, path)` | Save base64-encoded image to file |

## Parameters

### createImage

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | **required** | Text description from user |
| `model` | string | `'dall-e-3'` | `'dall-e-3'` (recommended) or `'dall-e-2'` |
| `size` | string | `'1024x1024'` | DALL-E 3: `'1024x1024'`, `'1792x1024'`, `'1024x1792'` |
| `quality` | string | `'standard'` | `'high'` (HD) or `'standard'` |
| `output` | string | `'url'` | `'base64'` or `'file_output'` |
| `file_output` | string | - | Absolute path to save image |
| `n` | number | `1` | Number of images (DALL-E 3 supports only n=1) |
| `output_format` | string | `'png'` | `'png'`, `'jpeg'`, `'webp'` |
| `user` | string | - | User identifier for OpenAI |

**DALL-E 3 Limitations:**
- `n` parameter must be 1 (only one image per request)
- Sizes: `1024x1024`, `1792x1024` (landscape), `1024x1792` (portrait)
- Quality: `'high'` maps to HD, `'standard'` is default

### editImage

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image` | string | **required** | Path to image or base64 string |
| `prompt` | string | **required** | Text description of edit |
| `mask` | string | - | Path to mask image (transparent areas = edit) |
| `model` | string | `'gpt-image-1'` | Model to use |
| `size` | string | `'1024x1024'` | Output size |
| `quality` | string | `'auto'` | Image quality |
| `output` | string | `'base64'` | Output format |
| `file_output` | string | - | Path to save edited image |
| `n` | number | `1` | Number of variations (1-10) |
| `user` | string | - | User identifier |

## Dynamic Prompt Execution

**WORKFLOW COMPLETO:**

1. **User Request** → Ricevi la richiesta dell'utente
2. **Ask Preferences** → Presenta le domande rapide (formato, stile, illuminazione, qualità)
3. **User Answers** → L'utente risponde a quelle che vuole (può saltare)
4. **Build Prompt** → Costruisci il prompt usando i 6 componenti + preferenze
5. **Show for Approval** → Mostra il prompt generato per approvazione
6. **User Confirms** → L'utente approva, modifica, o chiede di riscrivere
7. **Execute** → Solo dopo approvazione, esegui `createImage()`
8. **Report** → Mostra l'immagine generata e il path

**Example interaction:**

```
USER: "Voglio un'immagine di un gatto"

CLAUDE: "Per creare un'immagine ottimale del gatto, rispondi alle domande che vuoi:
📐 FORMATO: 1.Orizzontale 2.Verticale 3.Quadrato
🎨 STILE: 1.Fotorealistico 2.Illustrazione 3.Pittura 4.3D 5.Cartoon 6.Minimalista
💡 ILLUMINAZIONE: 1.Naturale 2.Golden hour 3.Drammatica 4.Studio
🔍 QUALITÀ: 1.Standard 2.HD"

USER: "3, 1, 2, 2"

CLAUDE: "📝 PROMPT GENERATO:
'A photorealistic image of a cat with detailed fur texture,
captured during golden hour with warm sunset light creating
soft shadows, natural environment, shot with 85mm lens,
HD quality with sharp focus on eyes'

✅ Procedo? ✏️ Modifiche?"

USER: "Si procedi"

CLAUDE: [Executes createImage() and shows result]
```

```typescript
// After user approval, execute:
import { createImage } from './client-openai-image.js';

const approvedPrompt = "A photorealistic image of a cat with detailed fur texture...";

const result = await createImage({
  prompt: approvedPrompt,
  size: '1024x1024',      // Based on user choice (3 = square)
  quality: 'high',         // Based on user choice (2 = HD)
  output: 'file_output',
  file_output: './output/cat_image.png'
});

console.log('Image saved to: ./output/cat_image.png');
```

## Recommended Patterns

**Process locally, report only summary:**
```typescript
// Generate image and extract only necessary info
const result = await createImage({
  prompt: userPrompt,  // Always from user, never hardcoded
  quality: 'high'
});

// Report only the URL, don't load the entire image into context
console.log(`Generated image: ${result.data[0].url}`);
console.log(`Revised prompt: ${result.data[0].revised_prompt}`);
```

**Multiple images (sequential for DALL-E 3):**
```typescript
// DALL-E 3 only supports n=1, so generate sequentially
const prompts = [
  'Logo design for tech startup - minimalist style',
  'Logo design for tech startup - modern style',
  'Logo design for tech startup - geometric style'
];

for (let i = 0; i < prompts.length; i++) {
  const result = await createImage({
    prompt: prompts[i],
    size: '1024x1024',
    quality: 'high',
    output: 'file_output',
    file_output: `./output/logo_variation_${i + 1}.png`
  });
  console.log(`Saved variation ${i + 1}`);
}
```

**Image editing workflow:**
```typescript
// 1. Generate base image
const base = await createImage({
  prompt: 'A product photo on white background',
  output: 'file_output',
  file_output: './temp/base.png'
});

// 2. Edit with mask (transparent areas will be regenerated)
const edited = await editImage({
  image: './temp/base.png',
  prompt: 'Add colorful lighting effects',
  mask: './temp/mask.png',
  output: 'file_output',
  file_output: './output/final.png'
});
```

## Benefits vs MCP Traditional

| Aspect | MCP Traditional | Code Execution |
|--------|-----------------|----------------|
| Token per request | ~3,000+ | ~200 |
| Latency | 2-3 MCP calls | 1 HTTP request |
| Batch operations | N separate calls | 1 API call with n parameter |
| File handling | Base64 through context | Direct file I/O |
| Progress tracking | Via MCP responses | Local console.log |

## Troubleshooting

### "OPENAI_API_KEY environment variable is not set"
Set your API key:
```bash
export OPENAI_API_KEY="sk-..."
```

### "OpenAI API error: ..."
Check:
- API key is valid and has credits
- Prompt doesn't violate content policy
- Image format is supported (PNG for edits)
- Mask has same dimensions as image (for edits)

### "Failed to load image"
For `editImage`:
- Ensure image path is absolute
- Image must be PNG format
- Image size must be less than 4MB
- Mask must have same dimensions as image

### Rate limiting
OpenAI has rate limits. If you hit limits:
- Reduce `n` parameter (fewer images per call)
- Add delays between requests
- Check your rate limits in OpenAI dashboard

## Examples

### Execute user's image request
```typescript
// User says: "Crea un'immagine di un tramonto sul mare con una barca a vela"
const userRequest = "A sunset over the sea with a sailboat, warm colors, photorealistic";

const result = await createImage({
  prompt: userRequest,
  size: '1792x1024',  // Landscape for scenic images
  quality: 'high',
  output: 'file_output',
  file_output: './output/sunset_sailboat.png'
});

console.log('Image saved to: ./output/sunset_sailboat.png');
```

### Generate hero image for website
```typescript
// User says: "I need a hero image for my tech startup"
const hero = await createImage({
  prompt: 'Modern minimalist web design hero section with geometric shapes and gradient, professional, clean',
  size: '1792x1024',  // DALL-E 3 landscape size
  quality: 'high',
  output: 'file_output',
  file_output: './public/hero.png'
});
```

### Portrait image
```typescript
// User says: "Generate a portrait of a futuristic robot"
const portrait = await createImage({
  prompt: 'Futuristic humanoid robot portrait, cinematic lighting, detailed mechanical parts',
  size: '1024x1792',  // Portrait orientation
  quality: 'high',
  output: 'file_output',
  file_output: './output/robot_portrait.png'
});
```

### Edit product photo
```typescript
// Add background to product
const product = await editImage({
  image: './products/item.png',
  prompt: 'Place product in a modern studio setting with soft lighting',
  output: 'file_output',
  file_output: './products/item_staged.png'
});
```

## Coverage Status

| MCP Tool | Code Exec Function | Status |
|----------|-------------------|--------|
| `create-image` | `createImage()` | ✅ 100% |
| `edit-image` | `editImage()` | ✅ 100% |

**Status: 100% MIGRATED** - All MCP tools fully replaced by Code Execution functions.

## References

- [OpenAI Images API Documentation](https://platform.openai.com/docs/api-reference/images)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)
