---
name: veo-video-code-exec
description: Generate videos using Google Veo 3.1 via Code Execution - 99% token reduction. Use when user asks to create videos, generate clips, animate images, or work with AI video generation. Triggers include "create video", "generate video", "make a clip", "animate", "video di", "genera video", "crea un video".
---

# Google Veo Video Generation Skill (Veo 3.1)

This skill provides direct access to Google Veo's video generation API without the overhead of MCP servers. It follows Anthropic's Code Execution pattern for 99%+ token reduction.

**Default Model**: `veo-3.1-generate-preview` (Latest with native audio, 1080p, extensions)

Use this skill when the user asks to:
- Create/generate/make a video
- Animate a still image (image-to-video)
- Generate a video clip or scene
- Create video content with AI
- Extend an existing video

---

## INITIAL MODE SELECTION

**CRITICAL**: When the user wants to generate a video, ALWAYS present this choice FIRST:

```
🎬 **MODALITÀ DI GENERAZIONE VIDEO**

Come vuoi procedere?

   1️⃣  **Prompt Manuale** - Scrivi direttamente il prompt completo
       (Per utenti esperti che sanno già cosa vogliono)

   2️⃣  **Procedura Guidata** - Ti guido passo passo con 11 domande
       (Costruiamo insieme il video perfetto)

Scegli 1 o 2:
```

---

### IF USER CHOOSES 1 (MANUAL PROMPT)

First, ask about reference images:

```
🖼️ **IMMAGINE DI RIFERIMENTO** (Opzionale)

Vuoi usare un'immagine come base per il video?

   1. 🎬 Sì, animare un'immagine (diventa il primo frame)
      → Funziona sempre ✅

   2. 🎨 Sì, come riferimento stile/soggetto
      → ⚠️ Funzionalità in anteprima limitata (potrebbe non funzionare)

   3. ⏭️ No, solo testo
      → Funziona sempre ✅

(Numero o "skip" per procedere senza):
```

**IF USER CHOOSES 2 (Style/Subject Reference in Manual Mode):**

Show this warning IMMEDIATELY:

```
⚠️ **AVVISO - Limitazione API Reference Images**

Le immagini di riferimento per stile/soggetto sono in **anteprima limitata**.
Molti account non hanno ancora accesso a questa funzionalità.

Hai tre opzioni:

   A) 🎬 **Procedi SENZA riferimento**
      → Descrivi il soggetto/stile nel prompt
      → Usa Veo 3.1 (qualità max + audio)
      → Funziona sempre ✅

   B) 📸 **Prova comunque**
      → Potrebbe funzionare o dare errore
      → Se fallisce, rigenererò con opzione A

   C) 🎥 **Anima l'immagine (imageToVideo)**
      → L'immagine diventa il primo frame
      → Funziona sempre ✅

Cosa preferisci? (A/B/C)
```

**Handle based on user choice, then continue to prompt collection.**

If user provides an image, collect the path and its intended use.

Then ask for the prompt:

```
📝 **PROMPT MANUALE**

Scrivi il tuo prompt completo per il video.
Puoi scriverlo in italiano o inglese - sarà passato direttamente a Veo.

Suggerimento: Includi soggetto, azione, ambiente, stile cinematografico,
movimenti di camera, e audio (dialoghi, suoni, musica).

Il tuo prompt:
```

After receiving the prompt, ask for technical parameters:

```
⚙️ **PARAMETRI TECNICI** (opzionale - default mostrati)

🤖 MODELLO E COSTI:
   1. Veo 3.1 Standard - $0.40/sec (default) - Massima qualità, audio nativo
   2. Veo 3.1 Fast - $0.15/sec - Più veloce, ottimo per iterazioni
   3. Veo 3.0 Standard - $0.40/sec - Stabile, audio incluso
   4. Veo 3.0 Fast - $0.15/sec - Veloce e affidabile
   5. Veo 2.0 - $0.35/sec - Solo video (senza audio)

📐 FORMATO:
   1. 16:9 orizzontale (default) - cinema, YouTube
   2. 9:16 verticale - TikTok, Reels, Stories

🎥 RISOLUZIONE:
   1. 720p (default) - più veloce
   2. 1080p - massima qualità

⏱️ DURATA:
   1. 4 secondi → costo: $1.60 (std) / $0.60 (fast)
   2. 6 secondi → costo: $2.40 (std) / $0.90 (fast)
   3. 8 secondi (default) → costo: $3.20 (std) / $1.20 (fast)

(Rispondi con numeri es. "1,1,1,3" o "skip" per i default)
```

Then:
1. Show a brief summary with the prompt, parameters, image (if any), and **estimated cost**
2. Ask for confirmation: "✅ Procedo? Costo stimato: $X.XX | ✏️ Vuoi modificare qualcosa?"
3. If confirmed, execute the appropriate function:
   - No image → `generateVideo()`
   - Animate image → `imageToVideo()`
   - Reference image → `generateWithReferences()`

---

### IF USER CHOOSES 2 (GUIDED PROCEDURE)

Follow the INTERACTIVE VIDEO BUILDER WORKFLOW below.

---

## INTERACTIVE VIDEO BUILDER WORKFLOW (Guided Mode)

**CRITICAL**: Follow this SEQUENTIAL workflow. Ask ONE question at a time, wait for the user's answer, then proceed to the next question. At the end, collect all answers to build the professional video prompt.

**User can always:**
- Answer with a number or description
- Say "skip" or "salta" to use default/auto
- Say "stop" to proceed with answers collected so far

---

### PHASE 0: REFERENCE IMAGE (first question - important!)

**Question 0 - REFERENCE IMAGE:**
```
🖼️ **IMMAGINE DI RIFERIMENTO** (Opzionale ma potente!)

Vuoi utilizzare un'immagine come riferimento per il video?

Veo 3.1 supporta diverse modalità:

   1. 🎬 **Animare un'immagine** - L'immagine diventa il primo frame
      e viene animata (es: foto di prodotto che prende vita)

   2. 🎨 **Riferimento per lo stile** - L'immagine guida lo stile
      visivo, i colori, l'estetica del video

   3. 👤 **Riferimento per il soggetto** - L'immagine mostra un
      prodotto/persona/oggetto che deve apparire nel video

   4. 🌍 **Riferimento per l'ambiente** - L'immagine mostra
      l'ambientazione/location da usare come sfondo

   5. 🎭 **Più immagini** - Fino a 3 immagini per combinare
      stile + soggetto + ambiente

   6. ⏭️ **Nessuna immagine** - Procedo solo con testo

(Numero o "skip" per procedere senza immagine):
```

**IF USER CHOOSES 1 (Animate Image):**
```
📤 **CARICA IMMAGINE DA ANIMARE**

Fornisci il percorso dell'immagine (o trascinala qui).
L'immagine diventerà il primo frame del video.

🎬 Come vuoi che venga animata?
Descrivi il movimento/azione che deve avvenire:

Esempi:
- "Il prodotto ruota lentamente mostrando tutti i lati"
- "La persona sorride e saluta con la mano"
- "Il paesaggio si anima con nuvole in movimento e uccelli che volano"
- "L'oggetto viene preso in mano da qualcuno"

Percorso immagine:
Descrizione animazione:
```
→ Store for `imageToVideo()` function

**IF USER CHOOSES 2, 3, 4, or 5 (Style/Subject/Environment/Multiple References):**

**⚠️ FIRST, show this critical warning:**
```
⚠️ **AVVISO IMPORTANTE - Limitazione API**

Le immagini di riferimento per stile/soggetto/ambiente sono in
**anteprima limitata** e potrebbero NON funzionare con il tuo account.

Prima di procedere, hai tre opzioni:

   A) 🎬 **Procedi con Veo 3.1 SENZA riferimento**
      → Descriverò il soggetto/stile dettagliatamente nel prompt
      → Massima qualità + audio nativo
      → Funziona sempre

   B) 📸 **Prova comunque con riferimento**
      → Potrebbe funzionare o dare errore
      → Se fallisce, ti proporrò l'alternativa A

   C) 🎥 **Anima l'immagine (imageToVideo)**
      → L'immagine diventa il primo frame
      → Funziona sempre + audio
      → Limitato a animare l'immagine esistente

Cosa preferisci? (A/B/C)
```

**If user chooses A → Skip to Question 1 (technical params), note to describe reference in prompt**
**If user chooses B → Continue collecting reference details below, with fallback plan**
**If user chooses C → Switch to option 1 (Animate Image) flow**

---

**IF USER CHOSE B AND OPTION 2 (Style Reference):**
```
📤 **CARICA IMMAGINE DI STILE**

⚠️ Nota: se l'API non supporta i riferimenti, il video verrà
generato descrivendo lo stile nel prompt.

Fornisci il percorso dell'immagine che rappresenta lo stile desiderato.

🎨 Cosa vuoi catturare da questa immagine?

Esempi:
- "Colori vintage anni '80 con grana cinematografica"
- "Estetica minimal scandinava, toni freddi"
- "Look cinematografico come un film di Wes Anderson"
- "Stile neon cyberpunk con contrasti forti"

Percorso immagine:
Stile da catturare:
```
→ Store as `referenceType: 'style'`
→ Store style description for fallback prompt integration

**IF USER CHOSE B AND OPTION 3 (Subject Reference):**
```
📤 **CARICA IMMAGINE DEL SOGGETTO**

⚠️ Nota: se l'API non supporta i riferimenti, il video verrà
generato descrivendo dettagliatamente il soggetto nel prompt.

Fornisci il percorso dell'immagine del prodotto/persona/oggetto
che deve apparire nel video.

👤 Come deve essere usato questo soggetto nel video?

Esempi:
- "Questo prodotto viene tenuto in mano da un influencer UGC"
- "Questa persona cammina in un ufficio moderno"
- "Questo logo appare su uno schermo nel video"
- "Questo oggetto viene mostrato in diverse angolazioni"

Percorso immagine:
Ruolo del soggetto nel video:
Descrizione dettagliata del soggetto (per fallback):
```
→ Store as `referenceType: 'subject'`
→ Store detailed subject description for fallback prompt integration

**IF USER CHOSE B AND OPTION 4 (Environment Reference):**
```
📤 **CARICA IMMAGINE DELL'AMBIENTE**

⚠️ Nota: se l'API non supporta i riferimenti, l'ambiente verrà
descritto dettagliatamente nel prompt.

Fornisci il percorso dell'immagine che mostra l'ambientazione desiderata.

🌍 Come deve essere usato questo ambiente?

Esempi:
- "Il soggetto cammina in questa location"
- "Questa è l'atmosfera/mood che voglio ricreare"
- "Lo sfondo del video deve essere simile a questo"
- "L'illuminazione deve essere come in questa foto"

Percorso immagine:
Uso dell'ambiente:
Descrizione dettagliata dell'ambiente (per fallback):
```
→ Store as `referenceType: 'style'` with environment description
→ Store detailed environment description for fallback prompt integration

**IF USER CHOSE B AND OPTION 5 (Multiple Images):**
```
📤 **CARICA PIÙ IMMAGINI** (max 3)

⚠️ Nota: se l'API non supporta i riferimenti multipli, tutti gli
elementi verranno descritti dettagliatamente nel prompt.

Veo 3.1 può usare fino a 3 immagini di riferimento contemporaneamente.

Per ogni immagine indica:
1. Percorso del file
2. Tipo: stile (S) o soggetto (T)
3. Descrizione di come usarla
4. **Descrizione dettagliata (per fallback)**

Esempio:
- Immagine 1: ./style.jpg | S | "Colori cinematografici caldi" | "Palette calda con toni arancio/ambra, grana filmica, contrasto medio"
- Immagine 2: ./product.jpg | T | "Prodotto da mostrare" | "Scatola colorata con scritte 'ADHD Self-Help Toolkit', design moderno, colori rosa/blu/viola"
- Immagine 3: ./person.jpg | T | "Modella che tiene il prodotto" | "Donna 25 anni, capelli scuri, stile casual"

Fornisci le tue immagini (una per riga):
```
→ Store as array of `referenceImages`
→ Store detailed descriptions for fallback prompt integration

---

### PHASE 1: TECHNICAL PARAMETERS (4 questions)

**Question 1 - MODEL & COST:**
```
🤖 **MODELLO E COSTI**

Quale modello vuoi utilizzare?

   ┌─────────────────────────────────────────────────────────┐
   │  MODELLO              │ COSTO/sec │ CARATTERISTICHE     │
   ├───────────────────────┼───────────┼─────────────────────┤
   │ 1. Veo 3.1 Standard   │  $0.40    │ Max qualità, audio  │
   │ 2. Veo 3.1 Fast       │  $0.15    │ Veloce, iterazioni  │
   │ 3. Veo 3.0 Standard   │  $0.40    │ Stabile, audio      │
   │ 4. Veo 3.0 Fast       │  $0.15    │ Veloce, affidabile  │
   │ 5. Veo 2.0            │  $0.35    │ Solo video, no audio│
   └─────────────────────────────────────────────────────────┘

   💡 Esempio costi per durata:
      • 4 sec: $1.60 (std) / $0.60 (fast) / $1.40 (veo2)
      • 6 sec: $2.40 (std) / $0.90 (fast) / $2.10 (veo2)
      • 8 sec: $3.20 (std) / $1.20 (fast) / $2.80 (veo2)

(Rispondi con un numero o "skip" per Veo 3.1 Standard)
```

**Question 2 - FORMAT:**
```
📐 **FORMATO (Aspect Ratio)**

Quale formato preferisci per il video?

   1. 16:9 orizzontale - cinema, YouTube, presentazioni
   2. 9:16 verticale - TikTok, Instagram Reels, Stories

(Rispondi con un numero o "skip" per 16:9)
```

**Question 3 - RESOLUTION:**
```
🎥 **RISOLUZIONE**

Quale risoluzione desideri?

   1. 720p - più veloce, buona qualità
   2. 1080p - massima qualità (consigliato per progetti importanti)

(Rispondi con un numero o "skip" per 720p)
```

**Question 4 - DURATION:**
```
⏱️ **DURATA**

Quanto deve durare il video?

   1. 4 secondi - clip breve, social media
   2. 6 secondi - durata media
   3. 8 secondi - durata massima (consigliato per scene complete)

(Rispondi con un numero o "skip" per 8 secondi)
```

---

### PHASE 2: CREATIVE COMPONENTS (8 questions)

**Question 4 - VIDEO STYLE:**
```
🎬 **STILE VIDEO**

Che tipo di video vuoi creare?

   1. 🎥 Cinematografico - Stile film, drammatico, alta produzione
   2. 📱 UGC/Selfie - User generated content, social, autentico
   3. 🎯 Corporate - Professionale, aziendale, training
   4. 📚 Documentario - Narrazione, educativo, informativo
   5. 🎨 Artistico/Surrealista - Creativo, onirico, sperimentale
   6. 📺 Spot Pubblicitario - Marketing, promozione prodotto
   7. 🎞️ Animazione - Stile animato, cartoon, motion graphics
   8. 🔬 Educational/Scientifico - Didattico, spiegazioni visuali
   9. Altro (descrivi)

(Numero o descrizione):
```

**Question 5 - SUBJECT:**
```
🎯 **SOGGETTO** - Il protagonista del video

Chi/cosa è il focus principale del video?
Sii MOLTO specifico! Includi:
- Caratteristiche fisiche (età, etnia, corporatura, capelli, occhi)
- Abbigliamento e accessori
- Espressione e stato emotivo
- Postura e atteggiamento

Esempio: "Una donna asiatica di 30 anni, capelli neri lunghi,
in blazer blu scuro, espressione sicura e professionale"

Descrivi il soggetto:
```

**Question 6 - TEXT & DIALOGUE:**
```
📝 **TESTO E DIALOGHI**

Il video deve includere contenuti testuali o parlati?

   1. 📺 **Testo a schermo** - Scritte, titoli, call-to-action
      Es: "50% OFF NOW", "Link in bio", sottotitoli

   2. 🎤 **Dialogo personaggio** - Il soggetto parla alla camera
      Es: "Living with ADHD can be easier..."

   3. 🔊 **Voce fuori campo** - Narrazione senza speaker visibile
      Es: Voiceover che descrive il prodotto

   4. 🎵 **Solo musica/suoni** - Nessun testo o parlato

   5. 🎭 **Combinazione** - Più elementi insieme (specifica quali)

(Numero o "skip" per solo musica/suoni):
```

**IF USER CHOOSES 1 (Text on screen):**
```
📺 **TESTO A SCHERMO**

Che testo deve apparire nel video?

Descrivi:
- Testo esatto tra virgolette
- Posizione (alto, centro, basso)
- Stile (bold, elegante, neon, minimal)
- Quando appare (inizio, fine, specifico momento)
- Animazione (fade in, slide, glitch, nessuna)

Esempio: "ADHD SELF HELP BUNDLE - 50% OFF"
(bold, centro schermo, appare a 5 secondi con fade in)

Il tuo testo:
```

**IF USER CHOOSES 2 (Character dialogue):**
```
🎤 **DIALOGO PERSONAGGIO**

Cosa dice il personaggio?

Scrivi:
- Le battute esatte tra virgolette
- Tono di voce (entusiasta, serio, amichevole, professionale)
- Emozione (felice, pensieroso, sicuro, empatico)
- Accento/lingua se specifico

Esempio:
"Living with ADHD can be easier if we have self-help support like this."
(tono: genuino e amichevole, emozione: empatica, voce femminile giovane)

Le battute del personaggio:
```

**IF USER CHOOSES 3 (Voiceover):**
```
🔊 **VOCE FUORI CAMPO**

Qual è il testo della narrazione?

Scrivi:
- Testo completo del voiceover
- Tipo di voce (maschile/femminile, giovane/matura)
- Stile (documentario, commerciale, intimo, autoritativo)
- Ritmo (lento, normale, energico)

Esempio:
"Discover the ultimate toolkit designed specifically for ADHD minds.
Everything you need to organize, focus, and thrive."
(voce: femminile giovane, stile: commerciale caldo, ritmo: moderato)

Il tuo voiceover:
```

**IF USER CHOOSES 5 (Combination):**
```
🎭 **COMBINAZIONE TESTO/DIALOGHI**

Descrivi tutti gli elementi testuali e parlati:

1. **Testo a schermo** (se presente):
   - Testo, posizione, quando appare

2. **Dialogo personaggio** (se presente):
   - Battute, tono, emozione

3. **Voce fuori campo** (se presente):
   - Testo narrazione, tipo voce, stile

Esempio:
- Testo: "50% OFF NOW" appare alla fine in basso
- Dialogo: Il personaggio dice "Check this out!" all'inizio
- Voiceover: Nessuno

I tuoi elementi:
```

→ Store text/dialogue responses for prompt construction

---

**Question 7 - ACTION:**
```
🎬 **AZIONE** - Cosa succede nel video

Cosa sta facendo il soggetto? Descrivi:
- Movimento principale
- Gesti e micro-espressioni
- Sequenza di azioni
- Interazioni con oggetti/persone

Tipo di movimento:
   1. Naturale - movimenti realistici quotidiani
   2. Energico - dinamico, alta energia
   3. Lento e deliberato - pensieroso, attento
   4. Elegante - fluido, armonioso
   5. Sicuro - deciso, con presenza

Descrivi l'azione:
```

**Question 8 - ENVIRONMENT:**
```
🏠 **AMBIENTE** - Dove si svolge la scena

Descrivi l'ambiente con dettagli su:
- Location (interno/esterno, tipo di spazio)
- Elementi di sfondo e props
- Condizioni meteo/ora del giorno
- Dettagli architettonici
- Atmosfera generale

Esempio: "Ufficio moderno con vetrate a tutta altezza,
vista su skyline cittadino, luce del tramonto dorata"

Descrivi l'ambiente:
```

**Question 9 - CAMERA:**
```
🎥 **MOVIMENTI DI CAMERA**

Come deve muoversi la camera?

TIPO DI INQUADRATURA:
   1. Wide shot - inquadratura ampia, contesto
   2. Medium shot - mezza figura, versatile
   3. Close-up - primo piano, emozioni
   4. Extreme close-up - dettaglio ravvicinato

MOVIMENTO CAMERA:
   1. Statica - camera fissa
   2. Dolly in/out - avvicinamento/allontanamento fluido
   3. Pan - movimento orizzontale
   4. Tilt - movimento verticale
   5. Tracking shot - segue il soggetto
   6. Drone shot - vista aerea
   7. Handheld - effetto documentario

Esempio: "2, 5" = Medium shot con tracking

(Numeri o descrizione):
```

**Question 10 - LIGHTING:**
```
💡 **ILLUMINAZIONE**

Come deve essere illuminata la scena?

   1. Luce naturale - soft, realistica, finestre
   2. Golden hour - tramonto/alba, toni caldi dorati
   3. Drammatica - contrasti forti, ombre profonde, rim light
   4. Studio/Three-point - professionale, controllata
   5. Neon/Artificiale - luci colorate, cyberpunk
   6. Soft/Diffusa - delicata, senza ombre dure
   7. Low-key - atmosfera dark, misteriosa
   8. High-key - luminosa, allegra, commerciale

(Numero o descrizione):
```

**Question 11 - AUDIO:**
```
🔊 **AUDIO** - Suoni ambiente e musica

Veo 3.1 genera audio nativo!

(Nota: dialoghi e voiceover sono già stati raccolti nella domanda 6)

**SUONI AMBIENTE:**
- Rumori di fondo (traffico, natura, ufficio, silenzio)
- Effetti sonori specifici (whoosh, click, passi)

**MUSICA:**
- Genere (epica, soft, corporate, elettronica, lo-fi)
- Mood (ispirante, tesa, rilassante, energica)
- Volume (sottofondo soft, prominente, assente)

Esempi:
- "Lo-fi chill in sottofondo, suoni di ufficio soft"
- "Musica epica crescente, nessun suono ambiente"
- "Solo suoni naturali, niente musica"

Descrivi suoni e musica (o "skip" per audio automatico):
```

---

### PHASE 3: NEGATIVE PROMPT (Optional)

```
🚫 **ELEMENTI DA EVITARE** (opzionale)

Ci sono elementi che NON vuoi nel video?

Esempi comuni:
- "sottotitoli, watermark, testo sovrapposto"
- "movimenti bruschi, sfocatura, artefatti"
- "elementi disturbanti, scarsa qualità"

Elementi da evitare (o "skip"):
```

---

### PHASE 4: SUMMARY AND APPROVAL

**⚠️ CRITICAL CHECK BEFORE SUMMARY:**

If the user selected reference images (options 2-5 in PHASE 0) AND chose option B (try anyway),
the summary MUST include:

```
⚠️ **NOTA IMPORTANTE - Reference Images**

Hai scelto di usare immagini di riferimento. Questa funzionalità è in
anteprima limitata e potrebbe non funzionare con il tuo account API.

**Piano di fallback se l'API restituisce errore:**
- Il video verrà rigenerato SENZA l'immagine di riferimento
- Il soggetto/stile sarà descritto dettagliatamente nel prompt
- Stessa qualità, stesso costo, funziona sempre

✅ Vuoi procedere con questo piano? (sì/no)
```

---

After collecting ALL answers, present the complete summary:

```
📋 **RIEPILOGO VIDEO**

**🖼️ Immagini di Riferimento:**
[Se presenti, mostrare:]
- Tipo: [Animazione / Stile / Soggetto / Ambiente / Multipla]
- File: [percorso/i immagine/i]
- Uso: [descrizione di come verrà usata]
[Altrimenti: "Nessuna - generazione solo da testo"]

**Parametri Tecnici:**
- Modello: [Veo 3.1 Standard / Fast / Veo 3.0 / Veo 2.0]
- Costo/sec: [$0.40 / $0.15 / $0.35]
- Formato: [16:9 / 9:16]
- Risoluzione: [720p / 1080p]
- Durata: [4s / 6s / 8s]
- Funzione: [generateVideo / imageToVideo / generateWithReferences]

**💰 COSTO STIMATO: $X.XX**

**Componenti Creativi:**
1. STILE: [stile scelto]
2. SOGGETTO: [descrizione soggetto]
3. TESTO/DIALOGHI: [testo a schermo / dialogo / voiceover / nessuno]
4. AZIONE: [descrizione azione]
5. AMBIENTE: [descrizione ambiente]
6. CAMERA: [inquadratura e movimento]
7. ILLUMINAZIONE: [tipo illuminazione]
8. AUDIO: [suoni ambiente / musica]

**Elementi da evitare:** [negative prompt o "nessuno"]

---

📝 **PROMPT GENERATO:**

"[Full constructed prompt in English combining all components]"

---

⚙️ **STIMA TEMPI:**
- Generazione: 1-6 minuti (dipende dal carico server)
- Il video sarà scaricato automaticamente

---

✅ Vuoi procedere? **Costo stimato: $X.XX**
✏️ Vuoi modificare qualcosa? (indica cosa)
🔄 Vuoi cambiare modello per risparmiare? (es. "usa Fast")
```

---

### PHASE 5: EXECUTE ONLY AFTER APPROVAL

Only execute after user explicitly confirms. Choose the appropriate function based on image usage:

| Scenario | Function to Use |
|----------|-----------------|
| No image | `generateVideo()` |
| Animate single image (option 1) | `imageToVideo()` |
| Style/Subject references (options 2-5) | `generateWithReferences()` |

---

**⚠️ FALLBACK HANDLING FOR REFERENCE IMAGES:**

If `generateWithReferences()` returns the error:
```
"Your use case is currently not supported"
```

**DO NOT show an error to the user.** Instead:

1. **Inform the user immediately:**
```
⚠️ L'API non supporta le reference images per questo account.
Sto procedendo con il piano di fallback...

🔄 Rigenerazione in corso con descrizione dettagliata nel prompt...
```

2. **Automatically regenerate** using `generateVideo()` with:
   - The original prompt PLUS detailed descriptions of the reference elements
   - Same model, same parameters
   - Include in prompt: subject description, style description, environment description (collected earlier)

3. **Show success** when complete:
```
✅ Video generato con successo usando il piano di fallback!
```

**Example fallback prompt integration:**
```typescript
const fallbackPrompt = `${originalPrompt}

The main subject is: ${subjectDetailedDescription}
Visual style: ${styleDetailedDescription}
Environment: ${environmentDetailedDescription}`;

await generateVideo({
  prompt: fallbackPrompt,
  // ... same other parameters
});
```

**Example for imageToVideo:**
```typescript
await imageToVideo({
  imagePath: '/path/to/image.jpg',
  prompt: 'The product slowly rotates revealing all sides...',
  aspectRatio: '16:9',
  resolution: '1080p',
  durationSeconds: '8',
  output: 'file',
  outputPath: './output/'
});
```

**Example for generateWithReferences:**
```typescript
await generateWithReferences({
  prompt: 'A professional unboxing the product in a modern studio...',
  referenceImages: [
    { imagePath: './product.jpg', referenceType: 'subject', description: 'Product to show' },
    { imagePath: './style.jpg', referenceType: 'style', description: 'Warm cinematic colors' }
  ],
  aspectRatio: '16:9',
  resolution: '1080p',
  durationSeconds: '8',
  output: 'file',
  outputPath: './output/'
});
```

---

## PROMPT STRUCTURE REFERENCE

### Professional Veo 3 Prompt Components

```
Subject: [Detailed character/object with 15+ specific attributes]

Action: [Specific movements, gestures, timing, micro-expressions]

Scene: [Environment, props, lighting setup, time of day]

Style: [Camera shot, angle, movement, visual aesthetic, color palette]

Dialogue: [Character speech with tone indicators]
(Character Name): "Exact dialogue here"
(Tone: emotional descriptor)

Sounds: [Ambient sounds, effects, music]

Technical (Negative): [Elements to avoid]
```

---

## VIDEO STYLE TEMPLATES

### 1. CINEMATOGRAFICO
```
Cinematic shot of [SUBJECT], [ACTION] in [ENVIRONMENT].
Professional film lighting with [LIGHTING TYPE], shot on anamorphic lens.
Camera: [CAMERA MOVEMENT] from [START] to [END].
Audio: [DIALOGUE/SOUNDS]. Epic orchestral underscore.
Style: Hollywood production quality, dramatic color grading.
Negative: amateur footage, poor lighting, shaky camera.
```

### 2. UGC/SELFIE
```
A selfie video of [SUBJECT] [ACTION].
[SUBJECT] holds the camera at arm's length, arm clearly visible in frame.
Natural eye movement, looking into camera then away.
Slightly grainy, film-like quality.
[SUBJECT] speaks [ACCENT]: "[DIALOGUE]"
Authentic, unpolished feel.
Negative: professional studio, perfect lighting, scripted feeling.
```

### 3. CORPORATE/TRAINING
```
[SUBJECT], a professional [ROLE], [ACTION] in [CORPORATE ENVIRONMENT].
Professional three-point lighting with warm key light.
Camera: Smooth dolly-in from wide to medium shot.
Audio: Clear, authoritative voice: "[DIALOGUE]"
with subtle office ambiance and inspirational background music.
Style: Corporate documentary, polished and professional.
Negative: distracting elements, poor lighting, unprofessional appearance.
```

### 4. DOCUMENTARIO
```
Documentary-style footage of [SUBJECT] [ACTION].
Handheld camera work, natural lighting, observational cinematography.
Authentic interactions captured in genuine moments.
Audio: Natural ambient sounds, [NARRATION IF ANY].
Style: Cinéma vérité, journalistic approach.
Negative: staged feeling, artificial poses, dramatic music.
```

### 5. SPOT PUBBLICITARIO
```
Commercial advertisement for [PRODUCT/SERVICE].
[SUBJECT] [ACTION] showcasing [KEY BENEFIT].
Studio lighting, product hero shots, lifestyle integration.
Camera: Dynamic angles, smooth transitions, focus pulls.
Audio: Upbeat music, professional voiceover: "[TAGLINE]"
Style: High-end advertising, aspirational imagery.
Negative: amateur quality, unclear messaging, poor product visibility.
```

### 6. EDUCATIONAL/SCIENTIFICO
```
Educational video explaining [TOPIC].
Visual: [DIAGRAMS/DEMONSTRATIONS/ANIMATIONS]
Clear scientific explanation with visual reinforcement.
Camera: Smooth zoom transitions, synchronized with narration.
Audio: Clear [GENDER] narrator explains: "[KEY POINTS]"
Subtle ambient sounds, no distracting background music.
Key terms appear as clean text overlays.
Negative: confusing visuals, overwhelming information, poor audio.
```

---

## MOVEMENT KEYWORDS

| Keyword | Effect |
|---------|--------|
| `natural movement` | Default, realistic human motion |
| `energetic movement` | Dynamic, high-energy actions |
| `slow and deliberate` | Thoughtful, careful actions |
| `graceful movement` | Smooth, flowing motion |
| `confident movement` | Assured, purposeful actions |
| `fluid movement` | Seamless, continuous motion |

---

## CAMERA KEYWORDS

| Shot Type | Description |
|-----------|-------------|
| Wide shot | Full environment context |
| Medium shot | Waist up, versatile |
| Close-up | Face/detail focus |
| Extreme close-up | Macro detail |
| Over-the-shoulder | Conversation perspective |
| POV | First-person view |

| Camera Movement | Description |
|-----------------|-------------|
| Static | Fixed camera |
| Dolly in/out | Smooth approach/retreat |
| Pan left/right | Horizontal sweep |
| Tilt up/down | Vertical sweep |
| Tracking | Following subject |
| Crane/Jib | Elevated smooth motion |
| Drone | Aerial perspective |
| Handheld | Documentary feel |
| Steadicam | Smooth floating motion |

---

## LIGHTING KEYWORDS

| Type | Keywords |
|------|----------|
| Natural | "natural light", "soft window light", "daylight" |
| Golden Hour | "golden hour", "warm sunset", "magic hour" |
| Dramatic | "dramatic lighting", "chiaroscuro", "rim light" |
| Studio | "three-point lighting", "softbox", "professional" |
| Neon | "neon lights", "cyberpunk", "colorful artificial" |
| Low-key | "dark atmosphere", "shadows", "moody" |
| High-key | "bright", "cheerful", "commercial" |

---

## AUDIO SPECIFICATIONS

### Dialogue Format
```
[Character Name]: "[Exact words]"
(Tone: [emotion], [accent], [delivery style])
```

### Sound Elements
- **Ambient**: office hum, city traffic, forest birds, ocean waves
- **Effects**: footsteps, door closing, typing, glass clinking
- **Music**: orchestral, electronic, corporate, indie, lo-fi

---

## PRICING REFERENCE

### Cost per Second

| Model | Cost/sec | Audio | Best For |
|-------|----------|-------|----------|
| **Veo 3.1 Standard** | $0.40 | ✅ Native | Final production, max quality |
| **Veo 3.1 Fast** | $0.15 | ✅ Native | Iterations, drafts, quick tests |
| **Veo 3.0 Standard** | $0.40 | ✅ Yes | Stable production |
| **Veo 3.0 Fast** | $0.15 | ✅ Yes | Fast iterations |
| **Veo 2.0** | $0.35 | ❌ No | Silent videos, B-roll |

### Quick Cost Calculator

| Duration | Standard ($0.40) | Fast ($0.15) | Veo 2 ($0.35) |
|----------|------------------|--------------|---------------|
| 4 sec | $1.60 | $0.60 | $1.40 |
| 6 sec | $2.40 | $0.90 | $2.10 |
| 8 sec | $3.20 | $1.20 | $2.80 |

### Cost-Saving Tips

1. **Use Fast for iterations**: Test prompts with Veo 3.1 Fast ($0.15/sec), then generate final with Standard
2. **Start with 4 seconds**: Shorter videos to validate the concept before longer ones
3. **Use 720p for tests**: Only use 1080p for final production
4. **Veo 2.0 for B-roll**: If you don't need audio, save with Veo 2.0

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

### generateVideo(params)

Generate videos from text prompts.

```typescript
import { generateVideo } from './scripts/client-veo.js';

const result = await generateVideo({
  prompt: 'A cinematic shot of a sunrise over mountains',
  aspectRatio: '16:9',
  resolution: '1080p',
  durationSeconds: '8',
  output: 'file',
  outputPath: './output/'
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Text description of the video |
| `model` | VeoModel | `'veo-3.1-generate-preview'` | Model to use |
| `aspectRatio` | string | `'16:9'` | `'16:9'` or `'9:16'` |
| `resolution` | string | `'720p'` | `'720p'` or `'1080p'` |
| `durationSeconds` | string | `'8'` | `'4'`, `'6'`, or `'8'` |
| `negativePrompt` | string | - | Elements to exclude |
| `output` | string | `'url'` | `'url'` or `'file'` |
| `outputPath` | string | - | Directory to save video |
| `pollInterval` | number | `10000` | Polling interval (ms) |
| `maxWaitTime` | number | `600000` | Max wait time (ms) |

### imageToVideo(params)

Animate a still image into video.

```typescript
import { imageToVideo } from './scripts/client-veo.js';

const result = await imageToVideo({
  imagePath: './photo.jpg',
  prompt: 'The person slowly turns and smiles',
  durationSeconds: '6',
  output: 'file',
  outputPath: './output/'
});
```

### interpolateVideo(params)

Create video by interpolating between two frames (Veo 3.1 only).

```typescript
import { interpolateVideo } from './scripts/client-veo.js';

const result = await interpolateVideo({
  firstFramePath: './start.jpg',
  lastFramePath: './end.jpg',
  prompt: 'Smooth transition between scenes',
  output: 'file',
  outputPath: './output/'
});
```

### extendVideo(params)

Extend a previously generated video (Veo 3.1 only).

```typescript
import { extendVideo } from './scripts/client-veo.js';

const result = await extendVideo({
  videoUri: 'https://...previous-video-url...',
  prompt: 'Continue the scene with the character walking away',
  durationSeconds: '8',
  output: 'file',
  outputPath: './output/'
});
```

### generateWithReferences(params)

Generate video with style/subject reference images (Veo 3.1 only, max 3 images).

```typescript
import { generateWithReferences } from './scripts/client-veo.js';

const result = await generateWithReferences({
  prompt: 'A professional walking through an office',
  referenceImages: [
    { imagePath: './style-ref.jpg', referenceType: 'style' },
    { imagePath: './person.jpg', referenceType: 'subject', description: 'main character' }
  ],
  output: 'file',
  outputPath: './output/'
});
```

---

## Available Models

| Model | ID | Features |
|-------|-----|----------|
| **Veo 3.1** | `veo-3.1-generate-preview` | Audio, 1080p, extension, references, interpolation |
| **Veo 3.1 Fast** | `veo-3.1-fast-generate-preview` | Faster generation for business |
| **Veo 3** | `veo-3.0-generate-001` | Stable with audio |
| **Veo 2** | `veo-2.0-generate-001` | Silent video only |

---

## Timing Estimates

- **Generation time**: 1-6 minutes (varies with server load)
- **Peak hours**: Up to 6 minutes
- **Off-peak**: As fast as 11 seconds
- **Video storage**: URLs valid for 2 days

---

## API Limitations & Known Issues

### ⚠️ Reference Images (generateWithReferences) - Limited Availability

**CRITICAL**: The `generateWithReferences()` function (for style/subject reference images) is currently in **limited preview** and may return:

```
"Your use case is currently not supported. Please refer to Gemini API documentation for current model offering."
```

**This limitation applies to:**
- Subject references (option 3 in guided workflow)
- Style references (option 2 in guided workflow)
- Environment references (option 4 in guided workflow)
- Multiple reference images (option 5 in guided workflow)

**NOT affected:**
- `imageToVideo()` - Animating a single image works normally
- `generateVideo()` - Text-to-video works normally
- `interpolateVideo()` - Frame interpolation works normally
- `extendVideo()` - Video extension works normally

### When Reference Images Fail - User Choice Required

**BEFORE generating**, if the user has selected reference images (options 2-5), you MUST inform them:

```
⚠️ **AVVISO IMPORTANTE - Reference Images**

Le immagini di riferimento (stile/soggetto) sono in anteprima limitata
e potrebbero non essere supportate dal tuo account API.

Hai due opzioni:

   A) 🎬 **Continua con Veo 3.1 SENZA immagine di riferimento**
      → Il prodotto/soggetto verrà descritto dettagliatamente nel prompt
      → Qualità massima, audio nativo
      → Costo: [costo calcolato]

   B) 📸 **Usa Veo 2.0 CON immagine di riferimento**
      → L'immagine verrà usata come riferimento
      → Qualità inferiore, SENZA audio
      → Costo: [costo calcolato con Veo 2.0]
      → ⚠️ Anche questo potrebbe non funzionare

   C) 🎥 **Anima l'immagine direttamente (imageToVideo)**
      → L'immagine diventa il primo frame e viene animata
      → Funziona sempre, audio incluso (Veo 3.1)
      → Costo: [costo calcolato]

Cosa preferisci? (A/B/C)
```

**If user chooses A:**
- Remove reference images from request
- Integrate detailed product/subject description into the prompt
- Use Veo 3.1 for best quality

**If user chooses B:**
- Switch to `veo-2.0-generate-001`
- Attempt with reference images (may still fail)
- Warn about no audio

**If user chooses C:**
- Switch to `imageToVideo()` function
- Use the reference image as the starting frame
- Ask for animation description

---

## Troubleshooting

### "GEMINI_API_KEY environment variable is not set"
Get your API key from [Google AI Studio](https://aistudio.google.com/apikey) and add to `.env`

### "Video generation timed out"
- Increase `maxWaitTime` parameter
- Try during off-peak hours
- Use `veo-3.1-fast-generate-preview` for faster results

### Safety filter blocks
- Avoid generating harmful/inappropriate content
- Review negative prompts
- Modify prompt to be more appropriate

### Regional restrictions
- Some regions (EU/UK/CH/MENA) have restrictions on person generation
- Check `personGeneration` parameter settings

---

## Coverage Status

| Capability | Function | Status |
|------------|----------|--------|
| Text-to-Video | `generateVideo()` | ✅ 100% |
| Image-to-Video | `imageToVideo()` | ✅ 100% |
| Frame Interpolation | `interpolateVideo()` | ✅ 100% |
| Video Extension | `extendVideo()` | ✅ 100% |
| Reference Images | `generateWithReferences()` | ✅ 100% |

**Status: 100% IMPLEMENTED** - All Veo 3.1 capabilities available via Code Execution.

---

## References

- [Google Veo Documentation](https://ai.google.dev/gemini-api/docs/video)
- [Veo 3 Prompting Guide](https://github.com/snubroot/veo-3-prompting-guide)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)
