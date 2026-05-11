import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';
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
      model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash-latest',
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
        temperature: 0.7,
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
6. Create a coherent narrative with a clear beginning, middle, and end.
7. Break story into short paragraphs (max 3 sentences each) returning them as an array of strings.

The syllableMap must include EVERY unique word in the story that has 2+ syllables.
For 1-syllable words, still include them if they might be challenging for a young reader.
`.trim();

    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Generating story: topic="${topic}", level=${readingLevel}, attempt=${attempt}`);
        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING, description: "max 6 words, engaging and simple" },
                paragraphs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "the full story, separated into an array of strings representing paragraphs" },
                tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "3-5 relevant topics" },
                syllableMap: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      word: { type: SchemaType.STRING },
                      syllables: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                      chunks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                      pronunciation: { type: SchemaType.STRING }
                    },
                    required: ["word", "syllables", "chunks", "pronunciation"]
                  }
                }
              },
              required: ["title", "paragraphs", "tags", "syllableMap"]
            }
          }
        });
        const response = result.response;
        const text = response.text();

        let parsed: { title: string; paragraphs: string[]; tags: string[]; syllableMap: SyllableEntry[] };
        try {
          parsed = JSON.parse(text);
        } catch (parseError) {
          logger.error('Failed to parse Gemini response (will retry):', text.substring(0, 200));
          lastError = new Error(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
          // Treat as retryable error - continue to next attempt
          if (attempt < maxRetries) {
            const delay = attempt * 1500;
            logger.warn(`JSON parse error, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw lastError;
        }

        if (!parsed.title || !Array.isArray(parsed.paragraphs) || !Array.isArray(parsed.syllableMap)) {
          throw new Error('Gemini returned malformed story JSON structure');
        }

        const bodyText = parsed.paragraphs.join('\n\n');
        const words = bodyText.trim().split(/\s+/);
        const wordCount = words.length;
        const wordsPerMinute = readingLevel === 'BEGINNER' ? 50 : readingLevel === 'ELEMENTARY' ? 80 : 120;
        const estimatedReadingMinutes = Math.max(1, Math.round(wordCount / wordsPerMinute));

        const story: GeneratedStory = {
          title: parsed.title,
          body: bodyText,
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
        lastError = error instanceof Error ? error : new Error(String(error));
        const isRetryable = lastError.message.includes('503') ||
                           lastError.message.includes('high demand') ||
                           lastError.message.includes('Invalid JSON') ||
                           lastError.message.includes('Parse error') ||
                           lastError.message.includes('timeout') ||
                           lastError.message.includes('network');

        if (isRetryable && attempt < maxRetries) {
          const delay = attempt * 1500; // 1.5s, 3s, 4.5s
          logger.warn(`Retryable error (${lastError.message.substring(0, 50)}...), retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Not retryable or exhausted retries
        logger.error('Gemini story generation failed:', error);
        throw new Error(
          `Story generation failed: ${lastError.message}`,
        );
      }
    }

    throw new Error(`Story generation failed after ${maxRetries} attempts: ${lastError?.message}`);
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

Rules:
- Use standard English syllabification
- chunks = same as syllables (visual breaking points)
- pronunciation = uppercase stressed syllable, lowercase others
- Every word in the input list must appear in output
`.trim();

    try {
      logger.debug(`Syllabifying ${uniqueWords.length} words`);
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                word: { type: SchemaType.STRING },
                syllables: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                chunks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                pronunciation: { type: SchemaType.STRING }
              },
              required: ["word", "syllables", "chunks", "pronunciation"]
            }
          }
        }
      });
      const text2 = result.response.text();
      const entries = JSON.parse(text2) as SyllableEntry[];

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
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent('Say "ok" and nothing else.');
        const text = result.response.text().toLowerCase().trim();
        logger.info(`Gemini ping response: ${text}`);
        return text.includes('ok');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const is503 = errorMsg.includes('503') || errorMsg.includes('high demand');
        if (is503 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        logger.error(`Gemini ping failed: ${errorMsg}`);
        return false;
      }
    }
    return false;
  }
}

// Singleton export
export const geminiService = new GeminiService();
