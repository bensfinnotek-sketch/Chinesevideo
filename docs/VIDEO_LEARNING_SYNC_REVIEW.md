# Video Composer + Learning Sync — Review Snapshot

## Scope

This snapshot consolidates the current implementation direction for the Chinese video learning pipeline. The repository history contains the incremental feature commits; this document is the single review index for the current architecture.

## Pipeline

`Lesson JSON → Scene list → Chinese/Pinyin/Vietnamese → Teacher explanation → TTS → visual assets → overlays → Karaoke timing → scene render → video combine`

The learning-sync layer now treats synchronized Chinese text, Pinyin, timing and semantic learning roles as shared data rather than renderer-only state.

## Implemented areas

### 1. Canonical Lesson JSON
- Central lesson/document schema.
- Scene types: intro, context, dialogue, listen, explanation, vocabulary, example, repeat, mini practice.
- Audio configuration and optional Karaoke timing.
- Adapters from generated lesson plans/scenes into canonical Lesson JSON.

### 2. Audio + Karaoke timing
- Audio segments are the timing source.
- Karaoke tokens are generated from Chinese dialogue.
- Smart clause splitting and preferred-phrase matching.
- Manual timing can be restored after TTS regeneration.
- Split/Merge editing preserves Pinyin mapping.
- Phrase-level playback is supported by the composer UI.

### 3. Chinese ↔ Pinyin synchronization
- Pinyin syllables are stored per Karaoke token.
- Renderer places Pinyin under matching Chinese characters.
- Active Karaoke phrase highlights both Chinese and its corresponding Pinyin.
- Token-level Pinyin data is available to downstream learning features.

### 4. Semantic learning units
Each Karaoke token can carry:
- `learningRole`: target / supporting / connector
- `learningUnitId`: stable key for the learning phrase
- `pinyinSyllables`
- source segment and token indexes

Stable IDs survive timing regeneration, so replay/practice layers do not need to depend on transient timing indexes.

### 5. LearningPhrase contract
Audio metadata exposes synchronized `learningPhrases` derived from Karaoke tokens.

A learning phrase currently contains:
- stable ID
- Chinese text
- Pinyin
- start/end timing
- semantic role
- source segment/token indexes

This creates a shared source of truth for future:
- replay
- slow playback
- repeat/shadowing
- vocabulary cards
- mini practice
- pronunciation recording
- learning analytics

### 6. Video Composer
- Real-time scene rendering based on configured FPS.
- Scene duration follows generated audio when available.
- Audio playback is connected to the recording pipeline.
- MediaRecorder format detection supports MP4 where available and WebM fallback.
- Export UI reports the actual generated file type.

### 7. Composer / Karaoke editor
- Snap ON/OFF for phrase boundaries.
- Drag start/end timing.
- Numeric timing edits.
- Phrase text editing.
- Split / Merge / Delete.
- Auto-generate smart phrases.
- Phrase-level preview playback.
- Pinyin is retained while editing.

### 8. Pedagogical direction
The composer is designed for contextual learning rather than a flashcard-only slideshow:

`Context → Dialogue → Listen → Explanation → Vocabulary → Example → Repeat → Mini Practice`

The AI lesson generator can select the appropriate subset per lesson.

## Current source-of-truth model

`Audio segments`
→ `KaraokeToken`
→ `LearningPhrase`
→ renderer / replay / practice / analytics

The renderer should consume synchronized token data instead of independently re-parsing Chinese/Pinyin whenever possible.

## Review notes / next architectural step

The next clean layer is a dedicated `LearningSyncEngine` service that receives scene context + audio metadata + vocabulary context and produces enriched learning units.

Likely future optional fields:
- Vietnamese meaning
- part of speech
- CEFR/HSK level
- lesson ID / scene ID
- speaker
- occurrence ID
- richer Pinyin syllable metadata

Keep stable `learningUnitId` separate from an occurrence ID: the former can represent the reusable vocabulary/phrase concept, while the latter identifies one occurrence in a specific lesson.

## Verification note

This snapshot was written after re-fetching the current GitHub files and includes the latest synchronized architecture. No CI/build status is claimed here.
