---
name: nanobanana-image-code-exec
description: Generate and edit images using Google Gemini 3 Pro via Code Execution - 99% token reduction
---

# Nano Banana Image Generation Skill (Google Gemini 3 Pro)

This skill provides direct access to Google Gemini's image generation API (codenamed "Nano Banana") without the overhead of the MCP server. It follows Anthropic's Code Execution pattern for 99%+ token reduction.

**Default Model**: `gemini-3-pro-image-preview` (Gemini 3 Pro with 4K support)

Use this skill when the user asks to:
- Create/generate/make an image using Gemini
- Draw/illustrate/design something with Google AI
- Generate artwork or graphics with Nano Banana
- Edit an existing image with AI
- Restore old or damaged photos

---

## INITIAL MODE SELECTION

**CRITICAL**: When the user wants to generate an image, ALWAYS present this choice FIRST:

```
🎨 **MODALITÀ DI GENERAZIONE IMMAGINE**

Come vuoi procedere?

   1️⃣  **Prompt Manuale** - Scrivi direttamente il prompt completo
       (Per utenti esperti che sanno già cosa vogliono)

   2️⃣  **Procedura Guidata** - Ti guido passo passo con 9 domande
       (Costruiamo insieme il prompt perfetto)

Scegli 1 o 2:
```

---

### IF USER CHOOSES 1 (MANUAL PROMPT)

Ask for the complete prompt:

```
📝 **PROMPT MANUALE**

Scrivi il tuo prompt completo per l'immagine.
Puoi scriverlo in italiano o inglese - sarà passato direttamente a Gemini.

Suggerimento: Sii specifico! Includi soggetto, ambiente, stile, illuminazione e dettagli.

Il tuo prompt:
```

After receiving the prompt:
1. Show a brief summary of technical parameters (use defaults):
   - Format: auto
   - Resolution: 2K
   - Temperature: 1.0
2. Ask for confirmation: "✅ Procedo con questo prompt? ✏️ Vuoi modificare qualcosa?"
3. If confirmed, execute `generateImage()` with the user's prompt

---

### IF USER CHOOSES 2 (GUIDED PROCEDURE)

Follow the INTERACTIVE PROMPT BUILDER WORKFLOW below.

---

## INTERACTIVE PROMPT BUILDER WORKFLOW (Guided Mode)

**CRITICAL**: Follow this SEQUENTIAL workflow. Ask ONE question at a time, wait for the user's answer, then proceed to the next question. At the end, collect all answers to build the professional prompt.

**User can always:**
- Answer with a number or description
- Say "skip" or "salta" to use default/auto
- Say "stop" to proceed with answers collected so far

---

### PHASE 1: TECHNICAL PARAMETERS (3 questions)

**Question 1 - FORMAT:**
```
📐 **FORMATO (Aspect Ratio)**

Quale formato preferisci per l'immagine?

   0. Auto - lascia scegliere al modello
   1. Quadrato (1:1) - social, avatar, icone
   2. Orizzontale wide (16:9) - paesaggi, banner, video
   3. Orizzontale standard (4:3) - foto tradizionale
   4. Orizzontale classico (3:2) - formato fotografico
   5. Verticale (3:4) - ritratti
   6. Verticale mobile (9:16) - storie, TikTok

(Rispondi con un numero, descrivi, o "skip" per auto)
```

**Question 2 - RESOLUTION:**
```
🔍 **RISOLUZIONE**

Quale risoluzione desideri?

   1. 1K - veloce, bozze
   2. 2K - alta qualità (consigliato)
   3. 4K - massima qualità

(Rispondi con un numero o "skip" per 2K)
```

**Question 3 - TEMPERATURE:**
```
🌡️ **TEMPERATURA** (creatività del modello)

Quanto creativo vuoi che sia il risultato?

   1. 0.5 - Più deterministico, risultati prevedibili
   2. 1.0 - Bilanciato (consigliato)
   3. 1.5 - Più creativo, più variazioni
   4. 2.0 - Massima creatività

(Rispondi con un numero o "skip" per 1.0)
```

---

### PHASE 2: CREATIVE COMPONENTS (6 questions)

**Question 4 - SUBJECT:**
```
🎯 **SUBJECT** - Il soggetto principale

Cosa/chi deve essere il focus dell'immagine?
Sii specifico! "donna" ❌ → "giovane donna con lentiggini" ✅

Descrivi il soggetto principale:
```

**Question 5 - ACTION:**
```
🎬 **ACTION** - Azione/dinamismo

Cosa sta facendo il soggetto? Questo aggiunge vita all'immagine.
Esempi: "che sorride pensierosa", "in movimento", "che lavora concentrato"

Descrivi l'azione (o "skip" per scena statica):
```

**Question 6 - ENVIRONMENT:**
```
🏠 **ENVIRONMENT** - Ambiente/contesto

Dove si svolge la scena? L'ambiente definisce l'atmosfera.
Esempi: "in un caffè accogliente", "ufficio moderno", "foresta nebbiosa"

Descrivi l'ambiente:
```

**Question 7 - ART STYLE:**
```
🎨 **ART STYLE** - Stile artistico

Che look vuoi per l'immagine?

   1. Fotorealistico - come una foto vera (Canon 5D, 85mm lens)
   2. Cinematografico - stile film, drammatico
   3. Digital Art - illustrazione moderna, ArtStation
   4. 3D Render - CGI, Unreal Engine, Pixar style
   5. Pittura - olio, acquerello, impressionista
   6. Minimalista - pulito, essenziale
   7. Altro (descrivi)

(Numero o descrizione):
```

**Question 8 - LIGHTING:**
```
💡 **LIGHTING** - Illuminazione

Come deve essere illuminata la scena? Fondamentale per la qualità!

   1. Luce naturale - soft, realistica
   2. Golden hour - tramonto/alba dorata
   3. Drammatica - contrasti forti, ombre, rim light
   4. Studio - professionale, controllata
   5. Soft/diffusa - delicata, senza ombre dure
   6. Neon/artificiale - luci colorate, cyberpunk
   7. Altro (descrivi)

(Numero o descrizione):
```

**Question 9 - DETAILS:**
```
✨ **DETAILS** - Dettagli specifici

Quali dettagli aggiuntivi vuoi includere?
Questi elementi aggiungono realismo e carattere.
Esempi: "tazza di caffè fumante", "riflessi sulle superfici", "sfondo sfocato"

Descrivi i dettagli importanti (o "skip" se nessuno in particolare):
```

---

### PHASE 3: SUMMARY AND APPROVAL

After collecting ALL answers, present the complete summary:

```
📋 **RIEPILOGO RISPOSTE**

**Parametri Tecnici:**
- Formato: [user answer or default]
- Risoluzione: [user answer or default]
- Temperatura: [user answer or default]

**Componenti Creativi:**
1. SUBJECT: [user answer]
2. ACTION: [user answer or "scena statica"]
3. ENVIRONMENT: [user answer]
4. ART STYLE: [user answer]
5. LIGHTING: [user answer]
6. DETAILS: [user answer or "nessuno specifico"]

---

📝 **PROMPT GENERATO:**

"[Full constructed prompt combining all components in English]"

---

⚙️ **PARAMETRI API:**
- Aspect Ratio: [ratio]
- Risoluzione: [size]
- Temperatura: [temp]
- Modello: gemini-3-pro-image-preview

---

✅ Vuoi procedere con questo prompt?
✏️ Vuoi modificare qualcosa? (indica cosa)
🔄 Vuoi che lo riscrivo completamente?
```

---

### PHASE 4: EXECUTE ONLY AFTER APPROVAL

Only call `generateImage()` after user explicitly confirms the prompt.

---

### WORKFLOW SHORTCUTS

**Fast mode**: If user says "veloce" or "quick", ask only:
1. Subject (required)
2. Style (optional)
3. Format (optional)

**Expert mode**: If user provides a complete prompt, skip to Phase 3 for approval.

---

### INTERNAL STATE TRACKING

While asking questions, maintain internal state:

```
currentState = {
  phase: 1 | 2 | 3,
  questionNumber: 1-9,
  answers: {
    // Phase 1 - Technical
    format: null,      // AspectRatio
    resolution: null,  // ImageSize
    temperature: null, // number

    // Phase 2 - Creative
    subject: null,     // required
    action: null,
    environment: null,
    artStyle: null,
    lighting: null,
    details: null
  }
}
```

Proceed to next question only after receiving an answer or "skip".

---

## FUNDAMENTAL GUIDING PRINCIPLES

### 1. Specificity is Sovereign
- AI cannot read minds
- "nice lighting" ❌ → "dramatic window lighting creating rim light effect" ✅
- Every description must be precise and detailed

### 2. Authenticity Above All
- Goal: enhance, not alter
- Preserve natural texture, skin pores, expression lines
- "Reveal the best version of what already exists"

### 3. Every Word Counts
- Each term drastically influences the result
- Example: removing "macro lens for sharp detail" makes product blurry
- Choose every word with a precise purpose

### 4. From Formula to Framework
- Prompts are not formulas to copy, but frameworks to adapt
- Develop an instinct for what AI needs
- Adapt principles to specific project needs

---

## PROMPT TEMPLATES BY CATEGORY

### A. PORTRAIT PHOTOGRAPHY

**Template:**
```
[Detailed SUBJECT with specific physical characteristics] [ACTION/facial expression],
[professional/contextual ENVIRONMENT], shot with [LENS TYPE] on [FORMAT/CAMERA],
[specific LIGHTING TYPE], [DETAILS that add character and authenticity]
```

**Example:**
```
A confident business executive with salt-and-pepper hair, making direct eye-contact
with the camera, in a modern corporate office with floor-to-ceiling windows,
shot with 85mm portrait lens on medium format film, dramatic window lighting
creating rim light effect, wearing tailored navy suit with subtle texture detail,
shallow depth of field isolating the subject
```

**Critical Elements:**
- Specify age/physical features (not generic "person")
- Direct eye contact for connection
- Lens type (85mm for professional portraits)
- Dramatic but natural lighting

---

### B. PRODUCT PHOTOGRAPHY

**Template:**
```
A [specific PRODUCT] with [distinctive FEATURES], positioned at [ANGLE],
on [SURFACE], with [controlled LIGHTING], shot with [MACRO LENS] for sharp detail,
[minimalist BACKGROUND], [DETAILS showing craftsmanship]
```

**Example:**
```
A luxury Swiss watch with rose gold case and black leather strap,
positioned at three-quarter angle showing face and profile,
on white marble surface with soft shadow, studio photography with softbox lighting,
shot with macro lens for sharp detail, minimal background with subtle gradient,
reflective surfaces showing premium craftsmanship
```

**Critical Elements:**
- "macro lens for sharp detail" is ESSENTIAL
- Controlled and soft lighting
- Non-distracting background
- Focus on craftsmanship and details

---

### C. LANDSCAPE PHOTOGRAPHY

**Template:**
```
[LANDSCAPE TYPE] with [NATURAL ELEMENTS], [TIMING/time of day] with [specific LIGHT TYPE],
[FOREGROUND ELEMENTS] providing compositional anchor, [BACKGROUND ELEMENTS],
[ATMOSPHERIC CONDITIONS], natural depth and visual flow
```

**Example:**
```
Alpine mountain lake with crystal clear water showing perfect reflections,
sunrise with warm golden light, foreground rocks providing compositional anchor,
snow-capped peaks in background, morning mist creating depth and mystery,
mirror-like water surface, natural color gradients from deep blue to warm amber
```

**Critical Elements:**
- "crystal clear water showing perfect reflections" for magical quality
- Specific timing (sunrise/golden hour)
- Foreground elements for depth
- Detailed atmospheric conditions

---

### D. ARCHITECTURAL VISUALIZATION

**Template:**
```
[BUILDING TYPE] with [ARCHITECTURAL FEATURES], positioned on [LOCATION/CONTEXT],
captured during [GOLDEN HOUR/specific moment] with [warm/specific LIGHT],
shot with [WIDE-ANGLE LENS], [SKY/atmosphere], [surrounding LANDSCAPE]
```

**Example:**
```
Modern minimalist house with floor-to-ceiling glass windows,
positioned on hillside overlooking valley, captured during golden hour
with warm light reflecting off glass surfaces, shot with wide-angle
architectural photography lens, dramatic sky with scattered clouds,
clean lines and geometric shapes emphasized
```

---

### E. STREET PHOTOGRAPHY

**Template:**
```
[SUBJECT] in [natural ACTION], [specific URBAN CONTEXT],
captured in [candid MOMENT] with genuine expression, [afternoon natural LIGHTING],
shot with [35mm lens] for natural field of view, background [CONTEXT supporting story]
```

**Example:**
```
Elderly man reading newspaper at sidewalk cafe, captured in candid moment
with genuine expression, urban environment with soft afternoon light filtering
through street trees, shot with 35mm lens for natural field of view,
background slightly out of focus showing city life, authentic street scene
feeling unposed and natural
```

---

### F. ABSTRACT ART

**Template:**
```
[impossible FORMS/elements] in [MATERIALS/textures], [INTERACTION between elements],
captured in [MOMENT/dynamic tension], [dramatic LIGHTING] creating depth and shadow,
[texture/surface EFFECTS], [CONTRAST between organic/geometric elements]
```

**Example:**
```
Flowing liquid metal forms in gold and copper tones, interacting with crystalline
geometric structures, captured in moment of dynamic tension, dramatic lighting
creating depth and shadow, shot as if through macro lens revealing intricate
surface textures, organic curves contrasting with angular geometric elements
```

---

### G. DIGITAL ART / ILLUSTRATION

**Template:**
```
[SUBJECT] in [digital art/illustration] style, [COLOR PALETTE], [COMPOSITION],
trending on ArtStation, highly detailed, [MOOD/ATMOSPHERE], [SPECIFIC STYLE REFERENCES]
```

**Example:**
```
A mystical forest guardian spirit, digital art style, ethereal blue and green
color palette with bioluminescent accents, centered composition with dramatic scale,
trending on ArtStation, highly detailed texture on bark-like skin,
mysterious and ancient atmosphere, inspired by concept art and fantasy illustration
```

---

## EDITING PROMPT TEMPLATES

### H. PORTRAIT ENHANCEMENT

**Template:**
```
Enhance portrait photo. [SPECIFICS on what to improve] while maintaining
[ELEMENTS TO PRESERVE], [subtle LIGHTING MODIFICATIONS], [EYE IMPROVEMENTS
without exaggerating], maintain authentic human qualities throughout
```

### I. BACKGROUND REPLACEMENT

**Template:**
```
Replace [ORIGINAL BACKGROUND] with [NEW BACKGROUND description],
maintain natural lighting on subject consistent with new environment,
preserve original subject shadows and edge detail, ensure seamless integration
```

### J. COLOR GRADING

**Template:**
```
Apply [STYLE] color grading with [HIGHLIGHT COLOR treatment] and [SHADOW COLOR treatment],
[ENHANCE/preserve specific elements], [INCREASE/decrease specific aspects],
preserve detail in [KEY AREAS], create [DESIRED MOOD/quality]
```

### K. OBJECT REMOVAL

**Template:**
```
Remove [OBJECT TO REMOVE] from [LOCATION IN IMAGE] while seamlessly filling
the area with [CONTEXTUALLY APPROPRIATE replacement], maintain natural lighting
and perspective, ensure no visible editing artifacts
```

### L. ATMOSPHERIC EFFECTS

**Template:**
```
Add [ATMOSPHERIC CONDITION] [LOCATION/effect], creating [DEPTH/MOOD effects]
while maintaining [VISIBILITY requirements], [LIGHTING modification],
enhance sense of place and [EMOTIONAL/environmental storytelling]
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
- "3D render", "Octane render", "Unreal Engine 5"
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
| Studio | "studio lighting", "softbox", "three-point lighting" |
| Soft | "diffused light", "overcast", "soft shadows", "flat lighting" |

---

## QUALITY CHECKLIST

Before finalizing a prompt, verify:

- [ ] **Specificity**: Is every component detailed? (no "nice", "good", "beautiful")
- [ ] **Consistency**: Do lighting and environment make sense together?
- [ ] **Authenticity**: If portrait/people, have I preserved naturalness?
- [ ] **Technical details**: Have I specified camera/lens when relevant?
- [ ] **Balance**: Is enhancement vs alteration clear?
- [ ] **Precise words**: Is each term chosen with purpose?
- [ ] **Appropriate length**: Not too short (vague) nor too long (confusing)

---
## Special Cases Management

### Multiple Request (e.g. "both portrait and landscape")
- Create TWO separate prompts
- Explain that Nano Banana works better with clear focus
- Offer to combine elements if sensible

### Non-Photographic Style
- Digital art: emphasize "digital art style", remove camera references
- Painting: use "painted in [style]", specify painting technique
- 3D render: "3D rendered", specify software style if relevant

### Impossible/Problematic Request
- Explain why it might not work
- Offer creative alternatives
- Suggest different approach

## Expansion and Learning

This skill is a **living framework**. For each new type of request:

1. Identify patterns in request
2. Map to basic 6 components
3. Apply guiding principles
4. Test and refine
5. Add variants to mental database

## Final Notes

- **Prompts are not rigid formulas**, they are adaptable frameworks
- **Specificity always beats genericness**
- **Authenticity is more important than perfection**
- **Every word has weight and impact**
- **Context guides construction** (e-commerce vs art vs documentary)

When generating prompts, think like a **professional photography director** communicating complete vision to technical team: what you want to capture, how it should appear, what emotion it must convey.

---

## Setup (one-time per project)

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

2. Add to your `.env` file:
```bash
GEMINI_API_KEY=your_api_key_here
```

3. The skill is ready to use!

---

## API Reference

### generateImage(params)

Generate images from text prompts.

```typescript
import { generateImage } from './scripts/client-nanobanana.js';

const result = await generateImage({
  prompt: 'A serene mountain landscape at sunset',
  aspectRatio: '16:9',
  imageSize: '2K',
  temperature: 1.0,
  output: 'file',
  outputPath: './output/'
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Text description of the image |
| `model` | string | `'gemini-3-pro-image-preview'` | Gemini model |
| `aspectRatio` | string | - | `'auto'`, `'1:1'`, `'16:9'`, `'4:3'`, `'3:2'`, `'3:4'`, `'9:16'` |
| `imageSize` | string | - | `'1K'`, `'2K'`, `'4K'` |
| `temperature` | number | 1.0 | 0.0-2.0 (1.0 recommended for Gemini 3 Pro) |
| `output` | string | `'base64'` | Output format: `'base64'` or `'file'` |
| `outputPath` | string | - | Directory to save images (required if output='file') |
| `styles` | array | - | Style variations: `['watercolor', 'photorealistic', etc.]` |
| `outputCount` | number | `1` | Number of images to generate |
| `seed` | number | - | Seed for reproducible generation |

### editImage(params)

Edit existing images with natural language.

```typescript
import { editImage } from './scripts/client-nanobanana.js';

const result = await editImage({
  prompt: 'Add sunglasses to the person and change background to a beach',
  imagePath: './portrait.jpg',
  aspectRatio: '1:1',
  imageSize: '2K',
  output: 'file',
  outputPath: './output/edited_portrait.png'
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Edit instructions |
| `imagePath` | string | required | Path to image to edit |
| `model` | string | `'gemini-3-pro-image-preview'` | Gemini model |
| `aspectRatio` | string | - | Output aspect ratio |
| `imageSize` | string | - | Output size (`'1K'`, `'2K'`, `'4K'`) |
| `temperature` | number | 1.0 | Creativity level |
| `output` | string | `'base64'` | Output format |
| `outputPath` | string | - | Path to save edited image |
| `referenceImages` | array | - | Additional reference images for style |

### restoreImage(params)

Restore damaged or old photographs.

```typescript
import { restoreImage } from './scripts/client-nanobanana.js';

const result = await restoreImage({
  prompt: 'Remove scratches, enhance colors, fix faded areas',
  imagePath: './old_photo.jpg',
  output: 'file',
  outputPath: './output/restored_photo.png'
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Restoration instructions |
| `imagePath` | string | required | Path to damaged image |
| `model` | string | `'gemini-3-pro-image-preview'` | Gemini model |
| `output` | string | `'base64'` | Output format |
| `outputPath` | string | - | Path to save restored image |

---

## Example Workflow

```
USER: "Voglio un'immagine di un tramonto sul mare"

CLAUDE: "Per creare un'immagine ottimale con Gemini 3 Pro, rispondi alle domande che vuoi:
📐 FORMATO: 0.Auto 1.Quadrato 2.Wide 16:9 3.Standard 4:3 4.Foto 3:2 5.Verticale 3:4 6.Mobile 9:16
🔍 RISOLUZIONE: 1.1K 2.2K 3.4K
🌡️ TEMPERATURA: 0.5=deterministico, 1.0=bilanciato, 1.5=creativo"

USER: "2, 3, 1"

CLAUDE: "📝 PROMPT GENERATO:

'A breathtaking sunset over the ocean, photorealistic style, golden hour lighting
with warm orange and pink hues reflecting on calm water, dramatic clouds painted
by the setting sun, distant horizon line, shot with wide-angle lens,
ultra detailed, professional landscape photography quality'

⚙️ PARAMETRI TECNICI:
- Aspect Ratio: 16:9 (wide)
- Risoluzione: 4K
- Temperatura: 1.0
- Modello: gemini-3-pro-image-preview

✅ Procedo? ✏️ Modifiche?"

USER: "Si procedi"

CLAUDE: [Executes generateImage() and shows result]
```

---

## Aspect Ratios Quick Reference

| Ratio | Use Case | Best For |
|-------|----------|----------|
| auto | Let model decide | When unsure |
| 1:1 | Square | Social media posts, avatars, icons |
| 4:3 | Standard | Traditional photos, presentations |
| 3:2 | Classic photo | Photography, prints |
| 16:9 | Wide | Landscapes, banners, YouTube thumbnails |
| 3:4 | Tall | Portraits, Pinterest |
| 9:16 | Mobile | Stories, TikTok, mobile wallpapers |

---

## Troubleshooting

### "GEMINI_API_KEY environment variable is not set"
Get your API key from [Google AI Studio](https://aistudio.google.com/apikey) and add it to `.env`

### "Gemini API error: ..."
- Check your API key is valid
- Ensure you have quota available
- Some prompts may be rejected by safety filters

### Geographic restrictions
- Gemini Image API may require VPN from certain countries
- Canada/USA connections work reliably

---

## MCP Tool Coverage

| MCP Tool | Code Exec Function | Coverage |
|----------|-------------------|----------|
| `generate_image` | `generateImage()` | ✅ 100% |
| `edit_image` | `editImage()` | ✅ 100% |
| `restore_image` | `restoreImage()` | ✅ 100% |

**Status: 100% MIGRATED** - All MCP tools fully replaced by Code Execution functions.

---

## References

- [Google Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [Nano Banana MCP Repository](https://github.com/ConechoAI/Nano-Banana-MCP)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)
