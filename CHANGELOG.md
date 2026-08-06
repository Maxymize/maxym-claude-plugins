# Changelog

## v1.0.02 - 2026-08-06

### gsc-code-exec 2.0.0 — da client Search Console a centro di controllo SEO

La skill copriva solo Google. Ora copre le tre superfici che decidono se un sito viene trovato e citato, e soprattutto misura il proprio effetto nel tempo.

**Bing Webmaster Tools** (`client-bing.ts`)
- Undici funzioni su endpoint verificati contro una proprietà reale prima di essere incluse
- `submitUrls()` fa quello che Google non permette: invio di URL per l'indicizzazione via API, in lotti da 500. Legge la quota prima e dopo, perché Bing risponde 200 con corpo vuoto in ogni caso e il calo di quota è l'unica conferma affidabile
- `resolveSiteUrl()` risolve un problema che altrimenti lascia perplessi: Bing può avere registrato il sito senza `www` mentre il sito vive su `www`, e l'API rifiuta un identificatore che non conosce
- Due endpoint testati e volutamente esclusi, documentati nel file perché nessuno li riscopra a mano

**IndexNow** (`client-indexnow.ts`)
- Una chiamata raggiunge Bing, Yandex, Seznam e Naver, senza account e senza consumare la quota Bing
- La chiave si ricava dal nome del file, non da una voce di configurazione: una seconda copia finirebbe per divergere e produrre 403 silenziosi
- `notify()` rifiuta l'invio finché il file della chiave non è raggiungibile, perché una segnalazione inviata troppo presto viene respinta in modo difficile da notare

**Monitoraggio continuo** (`seo-monitor.ts`)
- Ogni esecuzione salva uno snapshot nel progetto monitorato, lo confronta con il precedente e trasforma la differenza in azioni ordinate per gravità
- Verifiche tecniche che nessuna delle due console riporta: se gli URL inventati rispondono 200 invece di 404 (ogni indirizzo sbagliato diventa un duplicato della home e consuma budget di scansione), e quante parole vengono servite senza JavaScript, che è ciò che i crawler degli assistenti AI leggono davvero
- Solo regole deducibili dai dati: i consigli SEO generici sono esclusi di proposito

**Sicurezza**
- Nessuna chiave vive nella skill: vengono lette al momento della chiamata dall'ambiente del progetto monitorato, restano in memoria, non finiscono in file, log o snapshot. Verificato, non assunto
- Gli snapshot sono quindi sicuri da versionare

Provato end to end su una proprietà reale con dati veri su entrambe le console.

## v1.0.01 - 2026-03-05

### Fix
- Corretti tutti i 21 plugin.json: rimosso campo invalido `components` e sostituito con chiave top-level `skills: "./skills/"` secondo lo schema ufficiale di Claude Code
- I plugin ora si installano correttamente dal marketplace

## v1.0.00 - 2026-03-05

### Initial Release
- Plugin Marketplace con 21 plugin per Claude Code
- 15 Code Execution skills (convex, coolify, gsc, magic-ui, nanobanana-image, neon, openai-image, posthog, railway, sentry, shadcn-vue, stack-auth, stripe, supabase, veo-video)
- 3 Specialized skills (c15t-consent, infrastructure-analyzer, react-flow-editor)
- 3 Builder skills (code-execution-creator, mcp-builder, skill-creator)
