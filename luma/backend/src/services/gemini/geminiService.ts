import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { logger } from '../../config/logger';
import { ReadingLevel } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyllableEntry {
  word: string;
  syllables: string[];
  chunks: string[];        // Display chunks e.g. ["rain", "bow"]
  pronunciation: string;   // IPA-like hint e.g. "RAIN-boh"
}

export interface GeneratedStory {
  title: string;
  body: string;
  syllableMap: SyllableEntry[];
  wordCount: number;
  estimatedReadingMinutes: number;
  readingLevel: ReadingLevel;
  topic: string;
  ageGroup: string;
  tags: string[];
}

export interface StoryGenerationOptions {
  topic: string;
  readingLevel: ReadingLevel;
  ageGroup?: string;           // e.g. "7-10"
  includeCharacters?: string[];
  maxWords?: number;
}

// ─── Gemini Service ───────────────────────────────────────────────────────────

class GeminiService {
  private readonly client: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });
  }

  // ─── Story Generation ──────────────────────────────────────────────────────

  async generateStory(options: StoryGenerationOptions): Promise<GeneratedStory> {
    const {
      topic,
      readingLevel,
      ageGroup = '7-10',
      includeCharacters = [],
      maxWords = 200,
    } = options;

    const levelDescriptions: Record<ReadingLevel, string> = {
      BEGINNER: 'Use only 3-5 letter words. Maximum 1 clause per sentence. Avoid all complex vocabulary.',
      ELEMENTARY: 'Use simple words under 2 syllables. Short sentences. Very clear narrative.',
      INTERMEDIATE: 'Can include some 2-3 syllable words. Mix of short and medium sentences.',
      ADVANCED: 'More varied vocabulary. Can include 3-4 syllable words. Richer descriptions.',
    };

    const characterHint =
      includeCharacters.length > 0
        ? `Include these characters: ${includeCharacters.join(', ')}.`
        : '';

    const prompt = `
You are a specialist children's author creating content for children with dyslexia aged ${ageGroup}.
Reading level: ${readingLevel} — ${levelDescriptions[readingLevel]}

Topic: "${topic}"
${characterHint}
Maximum words: ${maxWords}

Rules for dyslexia-friendly writing:
1. Use short, clear sentences (max 12 words each)
2. Prefer common, phonetic words
3. Avoid homophones and confusing word pairs (e.g. b/d words)
4. One idea per sentence
5. Positive, engaging tone
6. Break story into short paragraphs (max 3 sentences each)

Return ONLY valid JSON matching this exact schema (no markdown fences):
{
  "title": "string (max 6 words, engaging and simple)",
  "body": "string (the full story, paragraphs separated by \\n\\n)",
  "tags": ["string array of 3-5 relevant topics"],
  "syllableMap": [
    {
      "word": "rainbow",
      "syllables": ["rain", "bow"],
      "chunks": ["rain", "bow"],
      "pronunciation": "RAIN-boh"
    }
  ]
}

The syllableMap must include EVERY unique word in the story that has 2+ syllables.
For 1-syllable words, still include them if they might be challenging for a young reader.
`.trim();

    try {
      logger.debug(`Generating story: topic="${topic}", level=${readingLevel}`);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Strip any accidental markdown fences Gemini might add
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanJson) as {
        title: string;
        body: string;
        tags: string[];
        syllableMap: SyllableEntry[];
      };

      if (!parsed.title || !parsed.body || !Array.isArray(parsed.syllableMap)) {
        throw new Error('Gemini returned malformed story JSON structure');
      }

      const words = parsed.body.trim().split(/\s+/);
      const wordCount = words.length;
      const wordsPerMinute = readingLevel === 'BEGINNER' ? 50 : readingLevel === 'ELEMENTARY' ? 80 : 120;
      const estimatedReadingMinutes = Math.max(1, Math.round(wordCount / wordsPerMinute));

      const story: GeneratedStory = {
        title: parsed.title,
        body: parsed.body,
        syllableMap: parsed.syllableMap,
        wordCount,
        estimatedReadingMinutes,
        readingLevel,
        topic,
        ageGroup,
        tags: parsed.tags ?? [],
      };

      logger.info(`Story generated: "${story.title}" (${wordCount} words)`);
      return story;
    } catch (error) {
      logger.error('Gemini story generation failed:', error);
      throw new Error(
        `Story generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ─── Syllabify a Single Text ───────────────────────────────────────────────

  async syllabifyText(text: string): Promise<SyllableEntry[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to syllabify cannot be empty');
    }

    // Extract unique words
    const uniqueWords = [...new Set(text.toLowerCase().match(/\b[a-z']+\b/g) ?? [])];

    if (uniqueWords.length === 0) {
      return [];
    }

    const prompt = `
You are a phonics and reading specialist helping children with dyslexia.
Break each word below into syllables and provide a pronunciation hint.

Words: ${uniqueWords.join(', ')}

Return ONLY valid JSON (no markdown, no explanation) — an array of objects:
[
  {
    "word": "butterfly",
    "syllables": ["but", "ter", "fly"],
    "chunks": ["but", "ter", "fly"],
    "pronunciation": "BUT-ter-fly"
  }
]

Rules:
- Use standard English syllabification
- chunks = same as syllables (visual breaking points)
- pronunciation = uppercase stressed syllable, lowercase others
- Every word in the input list must appear in output
`.trim();

    try {
      logger.debug(`Syllabifying ${uniqueWords.length} words`);
      const result = await this.model.generateContent(prompt);
      const text2 = result.response.text();
      const cleanJson = text2.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const entries = JSON.parse(cleanJson) as SyllableEntry[];

      if (!Array.isArray(entries)) {
        throw new Error('Syllabification response is not an array');
      }

      logger.info(`Syllabified ${entries.length} words`);
      return entries;
    } catch (error) {
      logger.error('Syllabification failed:', error);
      throw new Error(
        `Syllabification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ─── Health Check ──────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Say "ok" and nothing else.');
      const text = result.response.text().toLowerCase().trim();
      return text.includes('ok');
    } catch {
      return false;
    }
  }
}

// Singleton export
export const geminiService = new GeminiService();
